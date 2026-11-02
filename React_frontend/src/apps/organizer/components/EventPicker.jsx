import { useState } from 'react';
export default function EventPicker({ events, selectedEvent, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const visibleEvents = events.filter(event =>
    String(event.title || '')
      .toLowerCase()
      .includes(query.toLowerCase())
  );
  const status =
    selectedEvent.status === 'published'
      ? 'Published'
      : selectedEvent.status === 'draft'
      ? 'Draft'
      : selectedEvent.status || 'Event';
  function selectEvent(eventId) {
    setOpen(false);
    setQuery('');
    onSelect(eventId);
  }
  return (
    <details
      className="org-event-picker"
      open={open}
      onToggle={event => setOpen(event.currentTarget.open)}
    >
      <summary
        onClick={event => {
          event.preventDefault();
          setOpen(current => !current);
        }}
      >
        <span>
          <strong>{selectedEvent.title}</strong>
          <small>
            {status} · {Number(selectedEvent.registered) || 0} registered
          </small>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="org-event-options">
        <div className="search-box input-group">
          <span className="input-icon">🔍</span>
          <input
            className="form-control"
            aria-label="Search your events"
            placeholder="Search events…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
        <div className="org-event-option-list" role="listbox" aria-label="Your events">
          {visibleEvents.map(event => (
            <button
              key={event.id || event.eventId}
              type="button"
              role="option"
              aria-selected={String(event.id) === String(selectedEvent.id)}
              data-event-name={event.title}
              onClick={() => selectEvent(event.id)}
            >
              <span>
                <strong>{event.title}</strong>
                <small>
                  {event.status === 'published' ? 'Published' : event.status || 'Event'}
                </small>
              </span>
              <span className="org-event-option-count">
                {Number(event.registered) || 0} registered
              </span>
            </button>
          ))}
        </div>
        <div className="org-event-no-match" hidden={visibleEvents.length > 0}>
          No matching events
        </div>
      </div>
    </details>
  );
}
