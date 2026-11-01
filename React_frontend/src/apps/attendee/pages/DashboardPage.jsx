import React, { useMemo } from 'react';
import EventCard from '../components/EventCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/PageFeedback.jsx';
import { summarizeDashboard } from '../utils/dashboard-data.js';

function StatCard({ icon, value, label, background, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background, color }}>
        {icon}
      </div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function UpcomingRegistration({ registration, event, onViewEvent, onViewTicket }) {
  const id = registration.id || registration.registrationId;
  return (
    <div
      className="card p-0"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 32, flexShrink: 0 }}>{event.emoji || '🎟️'}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{event.title}</div>
          <div className="small" style={{ color: 'var(--text2)' }}>
            📅 {event.date}
            {event.time && ` · ${event.time}`}
            {event.venue && ` · 📍 ${event.venue}`}
          </div>
          <div className="small mt-4">
            <span className="badge badge-green">{registration.ticketId || 'Confirmed'}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-xs" onClick={() => onViewEvent?.(event.id, id)}>
          👁️ View Details
        </button>
        <button className="btn btn-primary btn-xs" onClick={() => onViewTicket?.(id)}>
          🎫 View Ticket
        </button>
      </div>
    </div>
  );
}

function PaymentReminder({ registration, event, onPay, onNavigate }) {
  const expiry = registration.reservationExpiresAt;
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{event.title}</div>
        <div className="small" style={{ color: 'var(--yellow)' }}>
          Payment required to confirm your reservation.
          {expiry &&
            ` · Expires: ${new Date(expiry).toLocaleDateString()} ${new Date(
              expiry
            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </div>
      </div>
      <div className="flex gap-8">
        <button
          className="btn btn-primary btn-xs"
          onClick={() => onPay?.(registration.registrationId || registration.id)}
        >
          💳 Pay Now
        </button>
        <button className="btn btn-ghost btn-xs" onClick={() => onNavigate?.('my-tickets')}>
          Review →
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage({
  events = [],
  registrations = [],
  user = {},
  loading = false,
  error = '',
  onRetry,
  onNavigate,
  onRegister,
  onViewEvent,
  onViewTicket,
  onPay,
}) {
  const data = useMemo(() => summarizeDashboard(events, registrations), [events, registrations]);
  const stats = [
    {
      icon: '🎟️',
      value: data.confirmed.length,
      label: 'Confirmed Registrations',
      background: 'var(--green-dim)',
      color: 'var(--green)',
    },
    {
      icon: '⏳',
      value: data.awaiting.length,
      label: 'Awaiting Action',
      background: 'var(--yellow-dim)',
      color: 'var(--yellow)',
    },
    {
      icon: '✅',
      value: data.attended.length,
      label: 'Events Attended',
      background: 'var(--blue-dim,rgba(66,153,225,.12))',
      color: 'var(--blue,#4299e1)',
    },
    {
      icon: '💰',
      value: `₹${data.netSpent.toLocaleString('en-IN')}`,
      label: 'Net Spent',
      background: 'var(--yellow-dim)',
      color: 'var(--yellow)',
    },
  ];

  if (loading) return <LoadingState icon="📊" title="Loading dashboard…" />;
  if (error)
    return <ErrorState title="Dashboard could not be loaded" message={error} onRetry={onRetry} />;

  return (
    <>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome back, ${user.name || 'Attendee'}! Here are your event highlights.`}
        action={
          <button className="btn btn-primary" onClick={() => onNavigate?.('browse-events')}>
            🔍 Browse Events
          </button>
        }
      />
      <div className="grid-4 mb-20">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="h4 mb-16">✨ Recommended For You</div>
      <div className="events-grid">
        {data.recommended.length ? (
          data.recommended.map(event => (
            <EventCard
              key={event.id || event.eventId}
              event={event}
              onRegister={onRegister}
              onViewEvent={onViewEvent}
            />
          ))
        ) : (
          <EmptyState
            icon="✨"
            title="No recommendations right now"
            description="You are up to date on all available events."
            style={{ gridColumn: '1/-1' }}
          />
        )}
      </div>

      <div className="h4 mb-16 mt-24">📅 Upcoming Events</div>
      {data.upcoming.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.upcoming.map(registration => (
            <UpcomingRegistration
              key={registration.registrationId || registration.id}
              registration={registration}
              event={data.eventFor(registration)}
              onViewEvent={onViewEvent}
              onViewTicket={onViewTicket}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎟️"
          title="No upcoming events"
          description="Browse and register for events to see them here."
          action={
            <button className="btn btn-primary mt-16" onClick={() => onNavigate?.('browse-events')}>
              Browse Events
            </button>
          }
        />
      )}

      {data.awaiting.length > 0 && (
        <>
          <div className="h4 mb-12 mt-24">⚠️ Needs Attention</div>
          <div className="card p-0">
            {data.awaiting.map(registration => (
              <PaymentReminder
                key={registration.registrationId || registration.id}
                registration={registration}
                event={data.eventFor(registration)}
                onPay={onPay}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
