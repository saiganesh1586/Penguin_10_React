import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomerSupportWorkspace from '../src/apps/customer-support/app/App.jsx';

const customer = {
  id: 'client-1',
  userId: 'client-1',
  name: 'Client Name',
  role: 'client',
  token: 'customer-token',
};
const ticket = {
  ticketId: 'SUP-001',
  concern: 'Payment is not working',
  requestType: 'Payment Issues',
  status: 'open',
  description: 'The payment did not complete.',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
  messages: [],
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function deferred() {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
}
function open(user = customer) {
  if (user) sessionStorage.setItem('ef_cu', JSON.stringify(user));
  return render(
    <MemoryRouter initialEntries={['/customer-support']}>
      <Routes>
        <Route path="/customer-support" element={<CustomerSupportWorkspace />} />
        <Route path="/landing" element={<div>Public landing</div>} />
        <Route path="/admin" element={<div>Admin workspace</div>} />
        <Route path="/employee1" element={<div>Support workspace</div>} />
        <Route path="/employee2" element={<div>Finance workspace</div>} />
      </Routes>
    </MemoryRouter>
  );
}
async function fillRequest(user) {
  await user.selectOptions(screen.getByLabelText(/Request Type/), 'Payment Issues');
  await user.selectOptions(screen.getByLabelText(/Type of Concern/), 'Payment is not working');
  await user.type(screen.getByLabelText(/Description/), 'Please check my payment.');
}

describe('React Customer Support', () => {
  beforeEach(() =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json([]))
    )
  );

  it('redirects unauthenticated and retired accounts before requesting tickets', () => {
    open(null);
    expect(screen.getByText('Public landing')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    [{ role: 'superuser' }, 'Admin workspace'],
    [{ role: 'employee', employeeType: 'SUPPORT_EXECUTIVE' }, 'Support workspace'],
    [{ role: 'employee', employeeType: 'REGISTRATION_VERIFICATION' }, 'Support workspace'],
    [{ role: 'employee', employeeType: 'EVENT_OPERATIONS' }, 'Support workspace'],
    [{ role: 'employee', employeeType: 'FINANCE_EXECUTIVE' }, 'Finance workspace'],
    [{ role: 'employee', employeeType: 'SUPPORT_FINANCE' }, 'Finance workspace'],
  ])('keeps excluded account %j in its own workspace', (account, destination) => {
    open({ ...account, token: 'personnel-token' });
    expect(screen.getByText(destination)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('clears an old ordinary staff session', () => {
    open({ role: 'staff', token: 'retired-token' });
    expect(screen.getByText('Public landing')).toBeInTheDocument();
    expect(sessionStorage.getItem('ef_cu')).toBeNull();
  });
  it('loads real ticket IDs, replies, and statuses using the saved token', async () => {
    fetch.mockResolvedValueOnce(json([ticket]));
    const user = userEvent.setup();
    open();
    expect(await screen.findByText('SUP-001')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/support/tickets',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer customer-token' }),
      })
    );
    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(ticket.description);
    expect(within(screen.getByRole('dialog')).getByText('Open')).toBeInTheDocument();
  });
  it('resets the concern when the request type changes and limits categories by role', async () => {
    const user = userEvent.setup();
    open({ ...customer, role: 'attendee' });
    expect(
      screen.queryByRole('option', { name: 'Organizer & Client Support' })
    ).not.toBeInTheDocument();
    await fillRequest(user);
    await user.selectOptions(screen.getByLabelText(/Request Type/), 'Account Related Problems');
    expect(screen.getByLabelText(/Type of Concern/)).toHaveValue('');
    expect(
      screen.queryByRole('option', { name: 'Payment is not working' })
    ).not.toBeInTheDocument();
  });
  it('validates required fields without posting a request', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(screen.getByText('Complete all required fields before submitting.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false);
  });
  it('uploads attachments, posts the unchanged backend payload, refreshes history, and resets a successful form', async () => {
    let tickets = [];
    fetch.mockImplementation(async (url, options) => {
      if (url.endsWith('/attachments')) return json({ attachmentId: 'attachment-1' });
      if (options.method === 'POST') {
        tickets = [{ ...ticket, ticketId: 'SUP-CREATED' }];
        return json(tickets[0]);
      }
      return json(tickets);
    });
    const user = userEvent.setup();
    open();
    await fillRequest(user);
    await user.upload(
      screen.getByLabelText(/Attachments/),
      new File(['receipt'], 'receipt.txt', { type: 'text/plain' })
    );
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(
      await screen.findByText('Request submitted. Your ticket number is SUP-CREATED.')
    ).toBeInTheDocument();
    const upload = fetch.mock.calls.find(([url]) => url.endsWith('/attachments'));
    expect(upload[1].body).toBeInstanceOf(FormData);
    expect(upload[1].headers['Content-Type']).toBeUndefined();
    const posted = fetch.mock.calls.find(
      ([url, options]) => url.endsWith('/tickets') && options.method === 'POST'
    );
    expect(JSON.parse(posted[1].body)).toEqual({
      requestType: 'Payment Issues',
      concern: 'Payment is not working',
      description: 'Please check my payment.',
      attachmentIds: ['attachment-1'],
    });
    expect(screen.getByText('SUP-CREATED')).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toHaveValue('');
  });
  it('retains drafts and attachment selections after a failed save', async () => {
    fetch.mockImplementation(async (_url, options) =>
      options.method === 'POST' ? json({ message: 'Server unavailable' }, 503) : json([])
    );
    const user = userEvent.setup();
    open();
    await fillRequest(user);
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toHaveValue('Please check my payment.');
    expect(screen.getByLabelText(/Type of Concern/)).toHaveValue('Payment is not working');
    expect(screen.getByRole('button', { name: 'Submit Request' })).toBeEnabled();
  });
  it('rejects unsupported uploads before sending any file', async () => {
    const user = userEvent.setup({ applyAccept: false });
    open();
    await fillRequest(user);
    await user.upload(
      screen.getByLabelText(/Attachments/),
      new File(['bad'], 'bad.exe', { type: 'application/octet-stream' })
    );
    await user.click(screen.getByRole('button', { name: 'Submit Request' }));
    expect(
      screen.getByText(
        'Choose up to 5 JPG, PNG, WEBP, PDF, or TXT files, each no larger than 5 MB.'
      )
    ).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, options]) => options.method === 'POST')).toBe(false);
  });
  it('blocks duplicate submissions while a save is pending', async () => {
    const pending = deferred();
    fetch.mockImplementation(async (_url, options) =>
      options.method === 'POST' ? pending.promise : json([])
    );
    const user = userEvent.setup();
    open();
    await fillRequest(user);
    await user.dblClick(screen.getByRole('button', { name: 'Submit Request' }));
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
    expect(fetch.mock.calls.filter(([, options]) => options.method === 'POST')).toHaveLength(1);
    await act(async () => pending.resolve(json({ ticketId: 'SUP-NEW' })));
    expect(
      await screen.findByText('Request submitted. Your ticket number is SUP-NEW.')
    ).toBeInTheDocument();
  });
  it('keeps a failed follow-up draft, then refreshes the saved conversation', async () => {
    let attempts = 0,
      saved = ticket;
    fetch.mockImplementation(async (_url, options) => {
      if (options.method === 'POST') {
        if (!attempts++) return json({ message: 'Could not send message' }, 503);
        saved = {
          ...ticket,
          messages: [
            { sender: 'requester', message: 'Please recheck.', createdAt: ticket.createdAt },
          ],
        };
        return json(saved);
      }
      return json([saved]);
    });
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole('button', { name: 'View' }));
    await user.type(screen.getByLabelText('Follow-up message'), 'Please recheck.');
    await user.click(screen.getByRole('button', { name: 'Send Follow-up' }));
    expect(await screen.findByText('Could not send message')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up message')).toHaveValue('Please recheck.');
    await user.click(screen.getByRole('button', { name: 'Send Follow-up' }));
    expect(await screen.findByText('Please recheck.')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up message')).toHaveValue('');
  });
  it('does not reopen a ticket closed while its follow-up is pending', async () => {
    const pending = deferred();
    fetch.mockImplementation(async (_url, options) =>
      options.method === 'POST' ? pending.promise : json([ticket])
    );
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole('button', { name: 'View' }));
    await user.type(screen.getByLabelText('Follow-up message'), 'Please recheck.');
    await user.click(screen.getByRole('button', { name: 'Send Follow-up' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await act(async () => pending.resolve(json({ success: true })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('shows ticket-loading failures and keeps the request form available', async () => {
    fetch.mockResolvedValue(json({ message: 'Offline' }, 503));
    open();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load support tickets: Offline'
    );
    expect(screen.getByRole('button', { name: 'Submit Request' })).toBeEnabled();
  });
  it('downloads an attachment with authentication and allows retry after a server error', async () => {
    class DownloadURL extends URL {
      static createObjectURL = vi.fn(() => 'blob:receipt');
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal('URL', DownloadURL);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let attempts = 0;
    fetch.mockImplementation(async url => {
      if (url.endsWith('/attachments/file%2F1')) {
        return attempts++
          ? new Response('receipt', { headers: { 'Content-Type': 'text/plain' } })
          : json({ message: 'Download unavailable' }, 503);
      }
      return json([
        { ...ticket, attachments: [{ attachmentId: 'file/1', originalName: 'receipt.txt' }] },
      ]);
    });
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole('button', { name: 'View' }));
    await user.click(screen.getByRole('button', { name: 'receipt.txt' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Download unavailable');
    await user.click(screen.getByRole('button', { name: 'receipt.txt' }));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/support/attachments/file%2F1', {
      headers: { Authorization: 'Bearer customer-token' },
    });
    expect(click.mock.instances[0].download).toBe('receipt.txt');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:receipt');
  });
  it('releases the pending read on unmount', async () => {
    const pending = deferred();
    fetch.mockReturnValue(pending.promise);
    const view = open();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const signal = fetch.mock.calls[0][1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve(json([ticket])));
  });
  it('closes the conversation with Escape and clears the session on sign-out', async () => {
    fetch.mockResolvedValue(json([ticket]));
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole('button', { name: 'View' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out and return' }));
    expect(screen.getByText('Public landing')).toBeInTheDocument();
    expect(sessionStorage.getItem('ef_cu')).toBeNull();
  });
});
