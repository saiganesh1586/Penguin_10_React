import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import attendeePageBridge from '../src/apps/attendee/app/attendeePageBridge.jsx';
import { attendeeSlice } from '../src/store/slices/attendeeSlice.js';
import { store } from '../src/store/store.js';

const event = {
  id: 'event-1', title: 'Bridge Workshop', category: 'Workshop', city: 'Chennai',
  date: '2099-01-01', time: '09:00', price: 0, status: 'upcoming', visibility: 'public',
};

afterEach(() => {
  const page = document.getElementById('attendee-bridge-page');
  if (page) attendeePageBridge.clear(page);
  attendeePageBridge.clearDetails();
  attendeePageBridge.clearTicket();
  document.body.replaceChildren();
  store.dispatch(attendeeSlice.actions.reset());
  vi.unstubAllGlobals();
});

describe('attendee page bridge', () => {
  it('keeps a mounted page and its filter state through a same-route refresh', async () => {
    vi.stubGlobal('EventFlowAttendeeData', {
      setEvents: rows => rows,
      setRegistrations: rows => rows,
      setNotifications: rows => rows,
    });
    const fetchRows = vi.fn(async url => new Response(
      JSON.stringify(String(url).endsWith('/events') ? [event] : []),
      { headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('EventFlowFetch', fetchRows);
    const container = document.createElement('div');
    container.id = 'attendee-bridge-page';
    document.body.append(container);
    expect(attendeePageBridge.hasPage('browse-events')).toBe(true);
    attendeePageBridge.render(container, 'browse-events');
    await screen.findByText('Bridge Workshop');
    const search = screen.getByPlaceholderText('Search events…');
    fireEvent.change(search, { target: { value: 'Bridge' } });
    attendeePageBridge.render(container, 'browse-events');
    expect(screen.getByPlaceholderText('Search events…')).toBe(search);
    expect(search.value).toBe('Bridge');
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(2));
    store.dispatch(attendeeSlice.actions.invalidate());
    await waitFor(() => expect(fetchRows).toHaveBeenCalledTimes(4));
    expect(screen.getByPlaceholderText('Search events…')).toBe(search);
    expect(search.value).toBe('Bridge');
  });

  it('renders event details and ticket actions in their legacy containers', () => {
    const drawer = document.createElement('div');
    const modal = document.createElement('div');
    document.body.append(drawer, modal);
    attendeePageBridge.renderDetails(drawer, { event, registrationCount: 1 });
    expect(screen.getByText('Registrations')).toBeInTheDocument();
    attendeePageBridge.clearDetails();

    const pay = vi.fn();
    vi.stubGlobal('completeDemoPayment', pay);
    attendeePageBridge.renderTicket(modal, {
      event: { ...event, price: 100 },
      registration: {
        id: 'registration-1', registrationId: 'registration-1', eventId: event.id,
        status: 'pending_payment', payment: 'pending', amount: 100,
      },
      user: { name: 'Attendee' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Complete Demo Payment' }));
    expect(pay).toHaveBeenCalledWith('registration-1');
  });
});
