import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import EventDetailsLayout from '../src/app/components/EventDetailsLayout.jsx';
import { SESSION_KEY } from '../src/app/config.js';
import { restoreSession } from '../src/store/slices/authSlice.js';
import PortalProvider from '../src/store/Provider.jsx';
import { store } from '../src/store/store.js';

it('sends from the event panel and shows replies without reloading the details', async () => {
  vi.useFakeTimers();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'test-token' }));
  store.dispatch(restoreSession());
  const messages = [];
  const createdAt = '2026-11-22T10:00:00Z';
  const fetchChat = vi.fn(async (_, { body }) => {
    if (body) {
      messages.push({ ...JSON.parse(body), isOwn: true, createdAt });
      return new Response(null, { status: 204 });
    }
    return { ok: true, json: async () => ({ participantName: 'Sarah', messages: [...messages] }) };
  });
  vi.stubGlobal('fetch', fetchChat);

  try {
    const { unmount } = render(
      <PortalProvider>
        <EventDetailsLayout eventId="booking-1">
          <h2>Event stages</h2>
        </EventDetailsLayout>
      </PortalProvider>
    );
    await act(async () => {});
    const panel = screen.getByRole('complementary', { name: 'Event chat' });
    expect(panel.previousElementSibling).toHaveTextContent('Event stages');
    expect(panel).toHaveTextContent('Conversation with Sarah');
    const send = within(panel).getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    const composer = within(panel).getByRole('textbox', { name: 'Message' });
    fireEvent.change(composer, { target: { value: '  Do we have a rehearsal time?  ' } });
    await act(async () => fireEvent.click(send));
    expect(composer).toHaveValue('');
    expect(panel).toHaveTextContent('Do we have a rehearsal time?');
    expect(fetchChat).toHaveBeenCalledWith(
      expect.stringMatching(/\/events\/booking-1\/chat$/),
      expect.objectContaining({ method: 'POST' })
    );

    messages.push({ id: 'reply', text: 'Yes, 5 pm.', isOwn: false, createdAt });
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(within(panel).getByRole('log')).toHaveTextContent('Yes, 5 pm.');
    expect(panel.previousElementSibling).toHaveTextContent('Event stages');

    unmount();
    const requestCount = fetchChat.mock.calls.length;
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(fetchChat).toHaveBeenCalledTimes(requestCount);
  } finally {
    vi.useRealTimers();
  }
});
