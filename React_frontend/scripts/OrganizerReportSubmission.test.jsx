import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrganizerContext } from '../src/apps/organizer/context/OrganizerContext.jsx';
import { organizerActions } from '../src/apps/organizer/api/organizer-api.js';
import ReportsPage from '../src/apps/organizer/pages/ReportsPage.jsx';
import fixtures from './role-fixtures.cjs';

function openReports({ linked = true } = {}) {
  const { data, records, event, request } = fixtures.roleFixture(
    'organizer',
    document,
    sessionStorage
  );
  event.status = 'completed';
  event.backendStatus = 'completed';
  event.id = 1001;
  event.eventId = 'event-1';
  request.eventId = 1001;
  request.status = 'completed';
  delete request.clientUserId;
  request.clientId = 'client-profile';
  request.clientDetails = {
    userId: 'client-user',
    name: 'Requesting Client',
    email: 'client@example.com',
  };
  if (!linked) {
    records.eventRequests.length = 0;
    delete event.clientId;
    delete event.backendClientId;
    delete event.clientUserId;
  }
  const onToast = vi.fn();
  const onRenderPage = vi.fn().mockResolvedValue(undefined);
  const upload = vi.fn().mockResolvedValue({ data: { eventReportId: 'saved-report' } });
  const legacyOpen = vi.fn(() => {
    throw new Error('The old DOM modal is unavailable');
  });
  vi.stubGlobal('apiUploadEventReport', upload);
  vi.stubGlobal('openSubmitReportModal', legacyOpen);
  data.actions = { ...organizerActions, onToast, onRenderPage };
  const view = render(
    <OrganizerContext.Provider value={data}>
      <ReportsPage />
    </OrganizerContext.Provider>
  );
  return { ...view, upload, onToast, onRenderPage, legacyOpen };
}

const reportFile = () =>
  new File(['%PDF-1.4\nEvent report\n%%EOF'], 'event-report.pdf', { type: 'application/pdf' });

describe('Organizer report submission', () => {
  it('opens the dialog from the real report button with mixed event IDs and a clientDetails contact', async () => {
    const h = openReports();
    const trigger = screen.getByRole('button', { name: /Submit Report/ });
    expect(trigger).toBeEnabled();
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Submit Event Report' });
    expect(dialog).toHaveFocus();
    expect(within(dialog).getByText('Requesting Client')).toBeInTheDocument();
    expect(h.legacyOpen).not.toHaveBeenCalled();
    const file = reportFile();
    fireEvent.change(within(dialog).getByLabelText('Report file'), { target: { files: [file] } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit File' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(h.upload).toHaveBeenCalledWith('event-1', file);
    expect(h.onRenderPage).toHaveBeenCalledWith('reports');
    expect(h.onToast).toHaveBeenCalledWith('Report sent to the requesting client.', 'success');
  });

  it('shows validation and upload failures in the open dialog and keeps the file for retry', async () => {
    const h = openReports();
    h.upload.mockRejectedValueOnce(new Error('Upload failed; try again.'));
    fireEvent.click(screen.getByRole('button', { name: /Submit Report/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit File' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please select a report file');
    expect(h.upload).not.toHaveBeenCalled();
    const input = screen.getByLabelText('Report file');
    fireEvent.change(input, { target: { files: [new File(['text'], 'invalid.txt')] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit File' }));
    expect(screen.getByRole('alert')).toHaveTextContent('PDF, DOCX, or XLSX');
    expect(h.upload).not.toHaveBeenCalled();
    const file = reportFile();
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit File' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed; try again.');
    expect(input.files[0]).toBe(file);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(h.onRenderPage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Submit File' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(h.upload).toHaveBeenCalledTimes(2);
  });

  it('prevents repeat submissions while an upload is running', async () => {
    const h = openReports();
    let finish;
    h.upload.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    fireEvent.click(screen.getByRole('button', { name: /Submit Report/ }));
    fireEvent.change(screen.getByLabelText('Report file'), { target: { files: [reportFile()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit File' }));
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('button', { name: 'Submitting…' }).closest('form'));
    expect(h.upload).toHaveBeenCalledTimes(1);
    finish({});
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens an explanation for an unlinked event instead of leaving an unresponsive button', () => {
    const h = openReports({ linked: false });
    const trigger = screen.getByRole('button', { name: /Submit Report/ });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('no requesting client linked');
    expect(screen.getByRole('button', { name: 'Submit File' })).toBeDisabled();
    expect(h.upload).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
