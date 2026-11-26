import EventChat from './EventChat.jsx';
import '../../styles/event-chat.css';

export default function EventDetailsLayout({ eventId, children }) {
  return (
    <div className={`event-details-layout${eventId ? ' event-details-with-chat' : ''}`}>
      {eventId && (
        <a className="btn btn-ghost btn-sm event-chat-jump" href="#event-chat">
          Jump to event chat
        </a>
      )}
      <div className="card event-details-card">{children}</div>
      {eventId && <EventChat key={eventId} eventId={eventId} />}
    </div>
  );
}
