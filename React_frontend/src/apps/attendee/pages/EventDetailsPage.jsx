import React, { useState } from 'react';
import { EmptyState } from '../components/PageFeedback.jsx';

function InfoRow({ label, value, style }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value" style={style}>
        {value}
      </span>
    </div>
  );
}

export default function EventDetailsPage({ event: item, registrationCount = 0 }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!item) return <EmptyState icon="📅" title="Event not found" />;

  const badge = { upcoming: 'purple', full: 'red', completed: 'green' }[item.status] || 'gray';
  return (
    <>
      {item.image ? (
        <div
          style={{
            height: 140,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 16,
            position: 'relative',
            background: `${item.color || 'var(--accent)'}18`,
          }}
        >
          {imageFailed ? (
            <div style={{ fontSize: 52, textAlign: 'center', padding: '30px 0' }}>
              {item.emoji || '📅'}
            </div>
          ) : (
            <img
              src={item.image}
              alt={item.title || 'Event'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      ) : (
        <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>
          {item.emoji || '📅'}
        </div>
      )}
      <span className={`badge badge-${badge} mb-16`}>{item.status}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
        <InfoRow label="Category" value={item.category} />
        <InfoRow label="Date & Time" value={`${item.date} · ${item.time}`} />
        <InfoRow label="Venue" value={item.venue} style={{ maxWidth: 200, textAlign: 'right' }} />
        <InfoRow label="City" value={item.city || '—'} />
        <InfoRow label="Capacity" value={`${item.registered} / ${item.capacity}`} />
        <InfoRow
          label="Price"
          value={Number(item.price) === 0 ? 'Free' : `₹${item.price}`}
          style={{ color: 'var(--green)' }}
        />
        <InfoRow label="Registrations" value={registrationCount} />
      </div>
      {item.description && (
        <>
          <div className="label mb-8">Description</div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
            {item.description}
          </p>
        </>
      )}
      {item.tags?.length > 0 && (
        <>
          <div className="label mt-16 mb-8">Tags</div>
          <div className="tag-list">
            {item.tags.map(tag => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}
