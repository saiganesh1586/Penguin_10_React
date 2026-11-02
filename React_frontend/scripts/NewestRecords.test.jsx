import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { newestRecords } from '../src/app/record-order.js';
import { OrganizerContext } from '../src/apps/organizer/context/OrganizerContext.jsx';
import { ClientContext } from '../src/apps/client/context/ClientContext.jsx';
import EventsPage from '../src/apps/organizer/pages/EventsPage.jsx';
import EventRequestsPage from '../src/apps/organizer/pages/EventRequestsPage.jsx';
import RequestStatusPage from '../src/apps/client/pages/RequestStatusPage.jsx';
import MyTicketsPage from '../src/apps/attendee/pages/MyTicketsPage.jsx';
import fixtures from './role-fixtures.cjs';

const firstBeforeSecond = (first, second) => {
  expect(
    screen.getByText(first).compareDocumentPosition(screen.getByText(second)) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
};
const oldCreated = '2026-01-01T10:00:00Z';
const newCreated = '2026-11-02T10:00:00Z';

describe('Newest records first', () => {
  it('uses creation time rather than scheduled dates or later updates and does not mutate input', () => {
    const rows = [
      { id: 'old', createdAt: oldCreated, updatedAt: '2099-01-01', date: '2099-12-01' },
      { id: 'new', createdAt: newCreated, date: '2099-01-01' },
    ];
    expect(newestRecords(rows).map(row => row.id)).toEqual(['new', 'old']);
    expect(rows.map(row => row.id)).toEqual(['old', 'new']);
    expect(newestRecords([{ createdAt: 'invalid' }, rows[1]])[0]).toBe(rows[1]);
  });

  it('keeps a newly created organizer event first when filters are cleared', () => {
    const { data, records, event } = fixtures.roleFixture('organizer', document, sessionStorage);
    records.events.splice(
      0,
      records.events.length,
      {
        ...event,
        id: 'old',
        eventId: 'old',
        title: 'Old event',
        createdAt: oldCreated,
        date: '2099-12-01',
      },
      {
        ...event,
        id: 'new',
        eventId: 'new',
        title: 'New event',
        createdAt: newCreated,
        date: '2099-01-01',
      }
    );
    render(
      <OrganizerContext.Provider value={data}>
        <EventsPage />
      </OrganizerContext.Provider>
    );
    firstBeforeSecond('New event', 'Old event');
    fireEvent.change(screen.getByPlaceholderText('Search events…'), { target: { value: 'Old' } });
    expect(screen.queryByText('New event')).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search events…'), { target: { value: '' } });
    firstBeforeSecond('New event', 'Old event');
  });

  for (const [role, Context, Page] of [
    ['client', ClientContext, RequestStatusPage],
    ['organizer', OrganizerContext, EventRequestsPage],
  ]) {
    it(`${role} shows a new request before an older request with a newer update`, () => {
      const { data, records, request } = fixtures.roleFixture(role, document, sessionStorage);
      records.eventRequests.splice(
        0,
        records.eventRequests.length,
        {
          ...request,
          id: 'old',
          requestId: 'old',
          title: 'Old request',
          eventName: 'Old request',
          status: 'submitted',
          createdAt: oldCreated,
          updatedAt: '2099-01-01',
        },
        {
          ...request,
          id: 'new',
          requestId: 'new',
          title: 'New request',
          eventName: 'New request',
          status: 'submitted',
          createdAt: newCreated,
        }
      );
      render(
        <Context.Provider value={data}>
          <Page />
        </Context.Provider>
      );
      firstBeforeSecond('New request', 'Old request');
    });
  }

  it('puts a new registration first and keeps explicit event-date sorting available', () => {
    const events = [
      { id: 'late', title: 'Older registration', date: '2099-12-01', status: 'upcoming' },
      { id: 'early', title: 'New registration', date: '2099-01-01', status: 'upcoming' },
    ];
    const registrations = [
      { id: 'old-reg', eventId: 'late', status: 'confirmed', createdAt: oldCreated },
      { id: 'new-reg', eventId: 'early', status: 'confirmed', createdAt: newCreated },
    ];
    const view = render(<MyTicketsPage events={events} registrations={registrations} />);
    expect(screen.getByLabelText('Sort by:')).toHaveValue('newest');
    firstBeforeSecond('New registration', 'Older registration');
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'latest' } });
    firstBeforeSecond('Older registration', 'New registration');
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'newest' } });
    view.rerender(<MyTicketsPage events={events} registrations={[...registrations]} />);
    firstBeforeSecond('New registration', 'Older registration');
  });
});
