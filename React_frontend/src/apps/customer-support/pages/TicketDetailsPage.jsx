import { useEffect, useRef, useState } from 'react';
import { downloadAttachment } from '../api/client.js';
import { statusLabel, ticketDate } from '../utils/supportConfig.js';
function Attachment({ attachment, user }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await downloadAttachment(attachment, user);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="support-file-link"
        type="button"
        disabled={busy}
        data-support-download={attachment.attachmentId}
        onClick={download}
      >
        {attachment.originalName}
      </button>
      {error && (
        <p className="support-feedback is-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export default function TicketDetailsPage({ ticket, user, onClose, onFollowUp }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current?.focus();
  }, []);
  const messages = [
    {
      sender: 'requester',
      message: ticket.description,
      createdAt: ticket.createdAt,
    },
    ...((ticket.messages || []).length
      ? ticket.messages
      : ticket.response
      ? [
          {
            sender: 'support',
            message: ticket.response,
            createdAt: ticket.updatedAt || ticket.createdAt,
          },
        ]
      : []),
  ];
  async function followUp(event) {
    event.preventDefault();
    if (pending.current) return;
    if (!message.trim()) {
      setError('Enter a follow-up message.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await onFollowUp(ticket.ticketId, message.trim());
      setMessage('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      className="support-modal-overlay"
      id="support-ticket-modal"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section
        ref={dialog}
        tabIndex={-1}
        className="support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
      >
        <div id="support-modal-content">
          <div className="support-modal-heading">
            <h2 id="support-modal-title">Support Request {ticket.ticketId}</h2>
            <button className="support-modal-x" type="button" aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="support-modal-body">
            <div className="support-modal-summary">
              <span>Subject</span>
              <strong>{ticket.concern}</strong>
            </div>
            {ticket.eventTitle && (
              <div className="support-modal-summary">
                <span>Event</span>
                <strong>{ticket.eventTitle}</strong>
              </div>
            )}
            <div className="support-modal-summary">
              <span>Status</span>
              <strong>
                <span className={`support-status support-status-${ticket.status}`}>
                  {statusLabel(ticket.status)}
                </span>
              </strong>
            </div>
            <div className="support-conversation">
              {messages.map((entry, index) => {
                const agent = entry.sender === 'support';
                const name = agent
                  ? entry.senderName
                    ? `Support - ${entry.senderName}`
                    : 'Support'
                  : user.name || 'You';
                return (
                  <article
                    key={entry.messageId || index}
                    className={`support-message ${
                      agent ? 'support-message-agent' : 'support-message-requester'
                    }`}
                  >
                    <div className="support-message-meta">
                      <span className="support-message-avatar">
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                      <strong>{name}</strong>
                      <time>{ticketDate(entry.createdAt, true)}</time>
                    </div>
                    <p>{entry.message}</p>
                    {!agent &&
                      entry.message === ticket.description &&
                      Boolean(ticket.attachments?.length) && (
                        <div className="support-attachments">
                          {ticket.attachments.map(attachment => (
                            <Attachment
                              key={attachment.attachmentId}
                              attachment={attachment}
                              user={user}
                            />
                          ))}
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
            <form
              className="support-follow-up"
              data-follow-up-form={ticket.ticketId}
              onSubmit={followUp}
            >
              <label htmlFor="support-follow-up-message">Follow-up message</label>
              <textarea
                className="form-control"
                id="support-follow-up-message"
                name="message"
                rows={4}
                maxLength={2000}
                required
                value={message}
                onChange={event => setMessage(event.target.value)}
              />
              <p
                className={`support-feedback${error ? ' is-error' : ''}`}
                data-follow-up-feedback
                role="status"
                aria-live="polite"
              >
                {error}
              </p>
              <div className="support-modal-footer">
                <button className="btn btn-ghost" type="button" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Send Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
