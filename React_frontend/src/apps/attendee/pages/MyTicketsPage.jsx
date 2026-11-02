import React, { useMemo, useState } from 'react';
import TicketCard from '../components/TicketCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/PageFeedback.jsx';
import { ticketEvent, ticketView } from '../utils/ticket-view.js';

const stored = key => (typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(key));
const emptyLabels = {
  registered: 'registered or confirmed event tickets',
  pending_approval: 'registration requests awaiting organizer approval',
  pending_payment: 'tickets awaiting payment',
  refund: 'refund-required or refunded event tickets',
  cancelled: 'cancelled event tickets',
  rejected: 'declined registrations',
  'checked-in': 'checked-in event tickets',
};

function TicketControls({ tab, sort, filter, counts, onSortChange, onFilterChange }) {
  return (
    <>
      <label
        htmlFor="ticket-sort"
        className="small"
        style={{ fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}
      >
        Sort by:
      </label>
      <select
        className="form-control filter-select"
        id="ticket-sort"
        value={sort}
        onChange={event => onSortChange(event.target.value)}
        style={{ minWidth: 160 }}
      >
        <option value="newest">Recently registered</option>
        <option value="latest">Event date: latest first</option>
        <option value="earliest">Event date: earliest first</option>
      </select>
      <label
        htmlFor="ticket-filter"
        className="small"
        style={{ fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}
      >
        Filter Tickets:
      </label>
      <select
        className="form-control filter-select"
        id="ticket-filter"
        value={filter}
        onChange={event => onFilterChange(event.target.value)}
        style={{ minWidth: 240 }}
      >
        <option value="all">All Tickets ({counts.all})</option>
        <option value="registered">Registered / Confirmed ({counts.registered})</option>
        {tab === 'upcoming' ? (
          <>
            <option value="pending_approval">Approval Pending ({counts.pending_approval})</option>
            <option value="pending_payment">Payment Pending ({counts.pending_payment})</option>
          </>
        ) : (
          <>
            <option value="checked-in">Checked In / Attended ({counts['checked-in']})</option>
            <option value="cancelled">Cancelled Tickets ({counts.cancelled})</option>
            <option value="refund">Refund Status ({counts.refund})</option>
          </>
        )}
        <option value="rejected">Declined Registrations ({counts.rejected})</option>
      </select>
    </>
  );
}

export default function MyTicketsPage({
  registrations = [],
  events = [],
  user = {},
  loading = false,
  error = '',
  onRetry,
  onNavigate,
  onViewTicket,
  onPay,
  onCancel,
}) {
  const [tab, setTab] = useState(() => (stored('ticket_tab') === 'other' ? 'other' : 'upcoming'));
  const [filter, setFilter] = useState(() => stored('ticket_filter') || 'all');
  const [sort, setSort] = useState(() => {
    const saved = stored('ticket_sort');
    return ['earliest', 'latest'].includes(saved) ? saved : 'newest';
  });
  const data = useMemo(
    () => ticketView(registrations, events, tab, filter, sort),
    [registrations, events, tab, filter, sort]
  );

  const selectTab = value => {
    sessionStorage.setItem('ticket_tab', value);
    sessionStorage.setItem('ticket_filter', 'all');
    setTab(value);
    setFilter('all');
  };
  const selectFilter = value => {
    sessionStorage.setItem('ticket_filter', value);
    setFilter(value);
  };
  const selectSort = value => {
    sessionStorage.setItem('ticket_sort', value);
    setSort(value);
  };

  if (loading) return <LoadingState icon="🎟️" title="Loading registrations…" />;
  if (error)
    return (
      <>
        <PageHeader title="My Tickets" />
        <ErrorState title="Registrations could not be loaded" message={error} onRetry={onRetry} />
      </>
    );

  const emptyTitle =
    data.activeFilter === 'all'
      ? tab === 'upcoming'
        ? 'upcoming tickets'
        : 'other tickets'
      : emptyLabels[data.activeFilter];
  const emptyDescription =
    data.activeFilter === 'all'
      ? tab === 'upcoming'
        ? 'Browse events to book your next ticket.'
        : 'Attended, declined, cancelled, and past registrations will appear here.'
      : 'Try choosing a different filter.';

  return (
    <>
      <PageHeader
        title="My Tickets"
        subtitle={`${data.filtered.length} of ${data.counts.all} ${
          tab === 'upcoming' ? 'upcoming' : 'other'
        } ticket(s) shown`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
        actionStyle={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
        action={
          <TicketControls
            tab={tab}
            sort={sort}
            filter={data.activeFilter}
            counts={data.counts}
            onSortChange={selectSort}
            onFilterChange={selectFilter}
          />
        }
      />
      <div
        role="tablist"
        aria-label="Ticket groups"
        style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={`btn ${tab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => selectTab('upcoming')}
        >
          Upcoming Tickets ({data.upcoming.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'other'}
          className={`btn ${tab === 'other' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => selectTab('other')}
        >
          Other Tickets ({data.other.length})
        </button>
      </div>
      <div id="my-tickets-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.filtered.length ? (
          data.filtered.map(registration => (
            <TicketCard
              key={registration.registrationId || registration.id}
              compact
              registration={registration}
              event={ticketEvent(registration, events)}
              user={user}
              onViewTicket={onViewTicket}
              onPay={onPay}
              onCancel={onCancel}
            />
          ))
        ) : (
          <EmptyState
            icon="🎟️"
            title={`No ${emptyTitle} found`}
            description={emptyDescription}
            style={{ padding: '40px 20px' }}
            action={
              tab === 'upcoming' && data.activeFilter === 'all' ? (
                <button
                  className="btn btn-primary mt-16"
                  onClick={() => onNavigate?.('browse-events')}
                >
                  Browse Events
                </button>
              ) : null
            }
          />
        )}
      </div>
    </>
  );
}
