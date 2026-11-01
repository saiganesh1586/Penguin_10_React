import React, { useState } from 'react';

const statusColor = status =>
  ({ upcoming: 'purple', full: 'red', completed: 'green' }[status] || 'gray');

function registrationLabel(registration, event, closed) {
  if (registration)
    return (
      {
        pending_approval: 'Approval Pending',
        pending_payment: 'Payment Pending',
        rejected: 'Declined',
        attended: 'Attended',
      }[registration.status] || '✓ Registered'
    );
  if (event.status === 'full') return 'Event Full';
  if (closed) return 'Registration Closed';
  return event.visibility === 'private' ? 'Request Approval' : 'Register';
}

export default function EventCard({ event: item, registration, onRegister, onViewEvent }) {
  const [imageFailed, setImageFailed] = useState(false);
  const capacity = Number(item.capacity || 0);
  const percent = capacity
    ? Math.min(100, Math.round((Number(item.registered || 0) / capacity) * 100))
    : 0;
  const closed =
    item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date();
  const unavailable =
    !registration && (closed || ['full', 'completed', 'cancelled'].includes(item.status));

  return (
    <div className="ev-card">
      <div className="ev-banner" style={{ background: `${item.color || 'var(--accent)'}18` }}>
        {item.image ? (
          <>
            <img
              src={item.image}
              alt={item.title || 'Event'}
              className="ev-banner-img"
              style={imageFailed ? { display: 'none' } : undefined}
              onError={() => setImageFailed(true)}
            />
            <div
              className="ev-banner-fallback"
              style={{
                display: imageFailed ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 52,
                width: '100%',
                height: '100%',
              }}
            >
              {item.emoji || '📅'}
            </div>
            <div className="ev-banner-overlay" />
          </>
        ) : (
          <span style={{ fontSize: 52 }}>{item.emoji || '📅'}</span>
        )}
        <div className="ev-banner-tag">
          <span className={`badge badge-${statusColor(item.status)}`}>{item.status}</span>
          {item.visibility && (
            <span className={`badge badge-${item.visibility === 'private' ? 'yellow' : 'green'}`}>
              {item.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          )}
        </div>
        <div className="ev-banner-price">
          {Number(item.price) === 0 ? 'Free' : `₹${item.price}`}
        </div>
      </div>
      <div className="ev-body">
        <div className="ev-title">{item.title}</div>
        <div className="ev-meta">
          <div className="ev-meta-row">
            <span>📅</span>
            {item.date} · {item.time}
          </div>
          <div className="ev-meta-row">
            <span>📍</span>
            {item.venue}
          </div>
          <div className="ev-meta-row">
            <span>🏷️</span>
            {item.category}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="flex justify-between ev-cap mb-4">
            <span>
              {item.registered}/{item.capacity} registered
            </span>
            <span>{percent}%</span>
          </div>
          <div className="prog">
            <div className="prog-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="ev-footer">
          <div className="flex gap-6" style={{ width: '100%', justifyContent: 'space-between' }}>
            <button
              className={`btn btn-sm ${registration ? 'btn-ghost' : 'btn-primary'}`}
              disabled={unavailable}
              style={unavailable ? { opacity: 0.5 } : undefined}
              onClick={() => onRegister?.(item.id)}
            >
              {registrationLabel(registration, item, closed)}
            </button>
            <button
              className="btn btn-ghost btn-xs"
              title="View event details"
              onClick={() => onViewEvent?.(item.id)}
            >
              View Details
            </button>
          </div>
          <div className="tag-list" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {(item.tags || []).slice(0, 2).map(tag => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
