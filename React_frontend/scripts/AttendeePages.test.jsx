import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AttendeePageContainer from '../src/apps/attendee/app/AttendeePageContainer.jsx';
import BrowseEventsPage from '../src/apps/attendee/pages/BrowseEventsPage.jsx';
import DashboardPage from '../src/apps/attendee/pages/DashboardPage.jsx';
import MyTicketsPage from '../src/apps/attendee/pages/MyTicketsPage.jsx';
import NotificationsPage from '../src/apps/attendee/pages/NotificationsPage.jsx';
import ProfilePage from '../src/apps/attendee/pages/ProfilePage.jsx';
import SettingsPage from '../src/apps/attendee/pages/SettingsPage.jsx';
import EventDetailsPage from '../src/apps/attendee/pages/EventDetailsPage.jsx';
import TicketCard from '../src/apps/attendee/components/TicketCard.jsx';

const publicEvent = {
  id: 'public-1',
  title: 'Public Workshop',
  date: '2099-01-01',
  time: '09:00',
  venue: 'Hall',
  city: 'Chennai',
  category: 'Workshop',
  price: 0,
  capacity: 20,
  registered: 1,
  status: 'upcoming',
  visibility: 'public',
};
const privateEvent = {
  ...publicEvent,
  id: 'private-1',
  title: 'Private Meeting',
  visibility: 'private',
  category: 'Meeting',
  city: 'Mumbai',
  price: 100,
};
const registration = {
  id: 'reg-1',
  registrationId: 'reg-1',
  eventId: 'public-1',
  status: 'confirmed',
  ticketId: 'T-1',
  amount: 0,
};

function stubData({
  events = [publicEvent, privateEvent],
  registrations = [],
  notifications = [],
} = {}) {
  vi.stubGlobal('apiGetEvents', vi.fn().mockResolvedValue(events));
  vi.stubGlobal('apiGetAttendeeRegistrations', vi.fn().mockResolvedValue(registrations));
  vi.stubGlobal('apiGetNotifications', vi.fn().mockResolvedValue(notifications));
  vi.stubGlobal('EventFlowAttendeeData', {
    setEvents: vi.fn(rows => rows),
    setRegistrations: vi.fn(rows => rows),
    setNotifications: vi.fn(rows => rows),
    getEvents: vi.fn(() => events),
  });
  vi.stubGlobal('regForEvent', vi.fn());
  vi.stubGlobal('goNav', vi.fn());
  vi.stubGlobal('markAllRead', vi.fn());
}

describe('Attendee JSX pages', () => {
  it('loads backend data in the container and passes registration actions to Browse', async () => {
    stubData();
    render(<AttendeePageContainer page="browse-events" />);
    expect(screen.getByText('Loading events…')).toBeInTheDocument();
    expect(await screen.findByText('Public Workshop')).toBeInTheDocument();
    expect(screen.getByText('Private Meeting')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(window.regForEvent).toHaveBeenCalledWith('public-1');
    fireEvent.click(screen.getByRole('button', { name: 'Request Approval' }));
    expect(window.regForEvent).toHaveBeenCalledWith('private-1');
    fireEvent.change(screen.getByPlaceholderText('Search events…'), {
      target: { value: 'Private' },
    });
    expect(screen.queryByText('Public Workshop')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search events…'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('All Categories'), { target: { value: 'Meeting' } });
    fireEvent.change(screen.getByDisplayValue('Any Price'), { target: { value: 'paid' } });
    fireEvent.change(screen.getByDisplayValue('Any City'), { target: { value: 'Mumbai' } });
    expect(screen.getByText('Private Meeting')).toBeInTheDocument();
    expect(screen.queryByText('Public Workshop')).not.toBeInTheDocument();
  });

  it('excludes registered events from Browse and shows their ticket', () => {
    render(
      <BrowseEventsPage events={[publicEvent, privateEvent]} registrations={[registration]} />
    );
    expect(screen.queryByText('Public Workshop')).not.toBeInTheDocument();
    expect(screen.getByText('Private Meeting')).toBeInTheDocument();
    render(
      <MyTicketsPage
        events={[publicEvent]}
        registrations={[registration]}
        user={{ name: 'Attendee' }}
      />
    );
    expect(screen.getByText('Public Workshop')).toBeInTheDocument();
    expect(screen.getByText('T-1', { exact: false })).toBeInTheDocument();
  });

  it('loads ticket event details from the backend after a fresh page mount', async () => {
    stubData({ registrations: [registration] });
    render(<AttendeePageContainer page="my-tickets" user={{ name: 'Attendee' }} />);
    expect(await screen.findByText('Public Workshop')).toBeInTheDocument();
    expect(window.apiGetEvents).toHaveBeenCalled();
    expect(window.apiGetAttendeeRegistrations).toHaveBeenCalled();
  });

  it('keeps historical ticket details supplied by the registration response', () => {
    sessionStorage.setItem('ticket_tab', 'other');
    const pastEvent = {
      ...publicEvent,
      id: 'past-1',
      title: 'Past Workshop',
      date: '2020-01-01',
      status: 'completed',
    };
    render(
      <MyTicketsPage
        events={[]}
        registrations={[{ ...registration, eventId: 'past-1', event: pastEvent }]}
      />
    );
    expect(screen.getByText('Past Workshop')).toBeInTheDocument();
    sessionStorage.removeItem('ticket_tab');
  });

  it('does not show Browse cards when registration ownership cannot be loaded', async () => {
    stubData();
    window.apiGetAttendeeRegistrations.mockRejectedValueOnce(
      new Error('Registration lookup failed')
    );
    render(<AttendeePageContainer page="browse-events" />);
    expect(await screen.findByText('Registration lookup failed')).toBeInTheDocument();
    expect(screen.queryByText('Public Workshop')).not.toBeInTheDocument();
  });

  it('renders Dashboard, Notifications, Profile and Settings from props', () => {
    const notifications = [
      { id: 'n1', title: 'Update', msg: 'Event message', time: 'Now', read: false },
    ];
    const onMarkAllRead = vi.fn();
    const view = render(
      <DashboardPage
        events={[publicEvent]}
        registrations={[registration]}
        user={{ name: 'Attendee' }}
      />
    );
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    view.unmount();
    const alerts = render(
      <NotificationsPage notifications={notifications} onMarkAllRead={onMarkAllRead} />
    );
    expect(screen.getByText('Event message')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '✓ Mark All Read' }));
    expect(onMarkAllRead).toHaveBeenCalled();
    alerts.unmount();
    const profile = render(<ProfilePage user={{ name: 'Attendee', email: 'a@example.test' }} />);
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    profile.unmount();
    render(<SettingsPage user={{ name: 'Attendee', email: 'a@example.test' }} />);
    expect(screen.getByDisplayValue('a@example.test')).toBeInTheDocument();
  });

  it('shows an API error and retries through the container', async () => {
    stubData();
    window.apiGetEvents.mockRejectedValueOnce(new Error('Server unavailable'));
    render(<AttendeePageContainer page="browse-events" />);
    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await waitFor(() => expect(screen.getByText('Public Workshop')).toBeInTheDocument());
  });

  it('renders event details and ticket actions as JSX', () => {
    const details = render(
      <EventDetailsPage
        event={{ ...publicEvent, description: 'Workshop details', tags: ['Tech'] }}
        registrationCount={1}
      />
    );
    expect(screen.getByText('Workshop details')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    details.unmount();
    const onPay = vi.fn(),
      onCancel = vi.fn();
    const pending = { ...registration, status: 'pending_payment', payment: 'pending' };
    render(
      <TicketCard
        registration={pending}
        event={{ ...publicEvent, price: 100 }}
        user={{ name: 'Attendee' }}
        onPay={onPay}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Complete Demo Payment' }));
    expect(onPay).toHaveBeenCalledWith('reg-1');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Registration' }));
    expect(onCancel).toHaveBeenCalledWith('reg-1');
  });

  it('keeps Settings fields controlled and submits their current values', () => {
    const onSaveSettings = vi.fn(() => true),
      onChangePassword = vi.fn(() => true);
    render(
      <SettingsPage
        user={{ name: 'Attendee', email: 'a@example.test' }}
        onSaveSettings={onSaveSettings}
        onChangePassword={onChangePassword}
      />
    );
    fireEvent.change(screen.getByDisplayValue('Attendee'), {
      target: { value: 'Updated Attendee' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Attendee', email: 'a@example.test' })
    );
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min 6 characters'), {
      target: { value: 'newpass' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'newpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    expect(onChangePassword).toHaveBeenCalledWith({
      current: 'oldpass',
      next: 'newpass',
      confirm: 'newpass',
    });
  });
});
