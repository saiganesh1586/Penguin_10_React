import React from 'react';
import TicketQR from './TicketQR.jsx';
const eventBadge = status =>
  ({
    upcoming: 'purple',
    full: 'red',
    completed: 'green',
  }[status] || 'gray');
const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
function RefundBadge({ registration, cancelled }) {
  const { refundStatus, refundObj, amount } = registration;
  if (refundStatus === 'pending')
    return (
      <span className="badge badge-yellow">
        ↩️ Simulated Refund: Pending ({money(refundObj?.amount ?? amount)})
      </span>
    );
  if (refundStatus === 'completed')
    return (
      <span className="badge badge-blue">
        ↩️ Simulated Refund: Completed ({money(refundObj?.amount ?? amount)})
      </span>
    );
  if (cancelled && refundStatus === 'not_applicable')
    return <span className="badge badge-gray">No Refund (Policy Expired)</span>;
  return null;
}
function ApprovalNotice({ registration, event, awaitingApproval, declined }) {
  if (awaitingApproval) {
    const early =
      registration.status === 'pending_approval' ||
      (event.visibility === 'private' && registration.status === 'pending_payment');
    const message = early
      ? 'Your registration request is awaiting organizer approval. No payment is required until approval.'
      : `${
          ['completed', 'paid'].includes(registration.payment) ? 'Your payment is confirmed. ' : ''
        }Your registration is awaiting organizer approval.`;
    return (
      <div
        className="small mt-12"
        role="status"
        style={{
          padding: '10px 12px',
          border: '1px solid var(--yellow)',
          color: 'var(--yellow)',
          borderRadius: 8,
        }}
      >
        {message}
      </div>
    );
  }
  if (declined)
    return (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: 'var(--red-dim)',
          border: '1px solid var(--red)',
          borderRadius: 8,
        }}
      >
        <strong
          style={{
            color: 'var(--red)',
          }}
        >
          Registration declined
          {registration.reviewedAt
            ? ` on ${new Date(registration.reviewedAt).toLocaleDateString()}`
            : ''}
        </strong>
        <div
          className="small mt-8"
          style={{
            color: 'var(--text2)',
          }}
        >
          Reason from organizer
        </div>
        <p
          style={{
            margin: '4px 0 0',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {registration.rejectionReason || 'Please contact the organizer for more information.'}
        </p>
      </div>
    );
  return null;
}
function TicketCode({ registration, event, inactive, declined, awaitingApproval }) {
  const valid =
    !inactive &&
    registration.status === 'confirmed' &&
    registration.verificationId &&
    (event.visibility !== 'private' || registration.reviewStatus === 'approved');
  if (valid) return <TicketQR value={registration.verificationId} />;
  if (inactive)
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '12px 8px',
          border: '1px dashed var(--red)',
          borderRadius: 8,
          background: 'var(--red-dim, rgba(239,68,68,0.08))',
        }}
      >
        <div
          style={{
            fontSize: 24,
          }}
        >
          🚫
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--red)',
            textTransform: 'uppercase',
            letterSpacing: '.5px',
          }}
        >
          {declined ? 'Declined' : 'Cancelled'}
        </div>
        <div
          className="small"
          style={{
            fontSize: 10,
            color: 'var(--text3)',
          }}
        >
          QR Disabled
        </div>
      </div>
    );
  return (
    <span className="small">
      {awaitingApproval ? 'Ticket available after approval' : 'No valid ticket'}
    </span>
  );
}
function paymentLabel(registration) {
  if (registration.status === 'pending_approval') return 'No Payment Collected';
  if (registration.refundStatus === 'completed' || registration.payment === 'refunded')
    return '↩️ Demo Refund Completed';
  if (registration.refundStatus === 'pending') return '⏳ Demo Refund Pending';
  if (registration.refundStatus === 'not_applicable') return 'Policy Expired (No Refund)';
  if (registration.payment === 'free') return 'Free Ticket';
  if (['completed', 'paid'].includes(registration.payment)) return '✓ Demo Payment Confirmed';
  if (registration.status === 'pending_payment' || registration.payment === 'pending')
    return 'Payment Pending';
  return 'No Payment Due';
}
export default function TicketCard({
  registration: r = {},
  event: e = {},
  user = {},
  compact = false,
  onViewTicket,
  onPay,
  onCancel,
}) {
  const cancelled = r.status === 'cancelled';
  const declined = r.status === 'rejected';
  const inactive = cancelled || declined;
  const registered = ['confirmed', 'registered', 'booked'].includes(r.status);
  const awaitingApproval =
    r.status === 'pending_approval' ||
    (e.visibility !== 'public' &&
      r.reviewStatus !== 'approved' &&
      !r.checkedIn &&
      (registered || (e.visibility === 'private' && r.status === 'pending_payment')));
  const canPay =
    r.status === 'pending_payment' && (e.visibility !== 'private' || r.reviewStatus === 'approved');
  const label = declined
    ? 'Declined'
    : cancelled
    ? 'Cancelled'
    : awaitingApproval
    ? 'Pending Organizer Approval'
    : registered && e.visibility === 'public'
    ? 'Confirmed'
    : registered && r.reviewStatus === 'approved'
    ? 'Organizer Approved'
    : r.status === 'pending_payment'
    ? 'Payment Pending'
    : r.status;
  const color = inactive
    ? 'red'
    : awaitingApproval || r.status === 'pending_payment'
    ? 'yellow'
    : registered || r.status === 'attended'
    ? 'green'
    : 'yellow';
  const id = r.registrationId || r.id;
  const notice = (
    <ApprovalNotice
      registration={r}
      event={e}
      awaitingApproval={awaitingApproval}
      declined={declined}
    />
  );
  if (compact)
    return (
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 18px',
          borderLeft: `4px solid ${inactive ? 'var(--red)' : 'var(--accent)'}`,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              fontSize: 28,
              flexShrink: 0,
            }}
          >
            {e.emoji || '🎟️'}
          </span>
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 4,
              }}
            >
              <strong
                style={{
                  fontSize: 14,
                }}
              >
                {e.title}
              </strong>
              <span className={`badge badge-${color}`}>{label}</span>
              <RefundBadge registration={r} cancelled={cancelled} />
            </div>
            <div className="small muted">
              📅 {e.date || 'Date TBD'} · 📍 {e.venue || 'Venue TBD'} · Ticket {r.ticketId || '—'}
            </div>
            {notice}
            {declined && !r.declineViewedAt && (
              <div
                className="small mt-8"
                style={{
                  color: 'var(--text2)',
                }}
              >
                View Details to move this ticket to Other Tickets.
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onViewTicket?.(id)}>
          View Details
        </button>
        {canPay && (
          <button className="btn btn-primary btn-sm" onClick={() => onPay?.(id)}>
            Pay {money(e.price)}
          </button>
        )}
      </div>
    );
  const canCancel =
    !r.checkedIn &&
    !['attended', 'no-show', 'cancelled'].includes(r.status) &&
    ['confirmed', 'pending_approval', 'pending_payment'].includes(r.status);
  const paid = ['completed', 'paid', 'free'].includes(r.payment);
  const ticketPrice = ['pending_approval', 'pending_payment'].includes(r.status);
  return (
    <div
      className="ticket"
      style={
        inactive
          ? {
              opacity: 0.85,
              borderColor: 'var(--border)',
            }
          : undefined
      }
    >
      <div className="ticket-top">
        <div className="flex justify-between items-start">
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 28,
                }}
              >
                {e.emoji || '🎟️'}
              </span>
              <span className={`badge badge-${eventBadge(e.status)}`}>{e.status}</span>
              <span className={`badge badge-${color}`}>{label}</span>
              {r.status === 'pending_payment' &&
                r.reviewStatus === 'approved' &&
                e.visibility !== 'public' && (
                  <span className="badge badge-green">Organizer Approved</span>
                )}
              {(r.checkedIn || r.status === 'attended') && (
                <span className="badge badge-green">✅ Checked In</span>
              )}
              <RefundBadge registration={r} cancelled={cancelled} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 8,
              }}
            >
              {e.title}
            </div>
            <div
              className="small"
              style={{
                marginBottom: 2,
              }}
            >
              📅 {e.date} · {e.time}
            </div>
            <div className="small">📍 {e.venue}</div>
          </div>
          <div
            className="qr-box ticket-qr"
            style={{
              marginLeft: 16,
            }}
          >
            <TicketCode
              registration={r}
              event={e}
              inactive={inactive}
              declined={declined}
              awaitingApproval={awaitingApproval}
            />
          </div>
        </div>
      </div>
      <div className="ticket-divider">
        <div className="ticket-notch-l" />
        <div className="ticket-notch-r" />
      </div>
      <div className="ticket-bot">
        <div
          className="grid-2"
          style={{
            gap: 8,
          }}
        >
          <div>
            <div className="label mb-4">Attendee</div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13.5,
              }}
            >
              {user.name}
            </div>
          </div>
          <div>
            <div className="label mb-4">Ticket ID</div>
            <div
              className="mono"
              style={
                inactive
                  ? {
                      textDecoration: 'line-through',
                      color: 'var(--text3)',
                    }
                  : undefined
              }
            >
              {r.ticketId || '—'}
            </div>
          </div>
          <div>
            <div className="label mb-4">Seat / Zone</div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13.5,
              }}
            >
              {r.seat || 'GA'}
            </div>
          </div>
          <div>
            <div className="label mb-4">{ticketPrice ? 'Ticket Price' : 'Amount Paid'}</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--green)',
              }}
            >
              {ticketPrice
                ? Number(e.price || 0) === 0
                  ? 'Free'
                  : money(e.price)
                : r.amount === 0
                ? 'Free'
                : `₹${r.amount}`}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-12 flex-wrap gap-8">
          <span
            className={`badge badge-${
              r.checkedIn || r.status === 'attended' ? 'green' : inactive ? 'red' : 'purple'
            }`}
          >
            {r.checkedIn || r.status === 'attended'
              ? '✅ Checked In'
              : inactive
              ? '🚫 Ticket Invalidated'
              : '⏳ Not Yet Checked In'}
          </span>
          <span
            className={`badge badge-${
              paid ? 'green' : r.refundStatus === 'pending' ? 'yellow' : 'gray'
            }`}
          >
            {paymentLabel(r)}
          </span>
        </div>
        {notice}
        {canPay && r.reservationExpiresAt && (
          <p className="small mt-12">
            Payment deadline: {new Date(r.reservationExpiresAt).toLocaleString('en-IN')}
          </p>
        )}
        {canPay && (
          <button
            className="btn btn-primary btn-sm mt-12"
            onClick={() => onPay?.(r.registrationId)}
          >
            Complete Demo Payment
          </button>
        )}
        {canCancel && (
          <button className="btn btn-danger btn-sm mt-12" onClick={() => onCancel?.(id)}>
            {r.status === 'pending_approval' ? 'Cancel Request' : 'Cancel Registration'}
          </button>
        )}
        {cancelled && (
          <div
            className="small mt-12"
            style={{
              color: 'var(--text3)',
              fontStyle: 'italic',
            }}
          >
            ❌ Registration cancelled
            {r.cancelledAt ? ` on ${new Date(r.cancelledAt).toLocaleDateString()}` : ''}. Ticket QR
            and seat capacity are invalidated.
          </div>
        )}
      </div>
    </div>
  );
}
