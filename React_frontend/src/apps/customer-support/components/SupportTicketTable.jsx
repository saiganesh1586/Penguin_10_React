import { statusLabel, ticketDate } from '../utils/supportConfig.js';

export default function SupportTicketTable({ tickets, onView }) {
  return (
    <div className="support-history">
      <section className="card support-ticket-section">
        <div className="support-section-heading">
          <h2>My Support Requests</h2>
          <span>{tickets.length}</span>
        </div>
        <div className="support-table-wrap">
          <table className="support-ticket-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Category</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tickets.length ? (
                tickets.map(ticket => (
                  <tr key={ticket.ticketId}>
                    <td>
                      <strong>{ticket.concern}</strong>
                      <small>{ticket.ticketId}</small>
                      {ticket.eventTitle && <small>Event: {ticket.eventTitle}</small>}
                    </td>
                    <td>{ticket.requestType}</td>
                    <td>
                      <span className={`support-status support-status-${ticket.status}`}>
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td>
                      {ticket.updatedLabel ||
                        ticketDate(ticket.updatedAt || ticket.createdAt, true)}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        data-ticket-view={ticket.ticketId}
                        onClick={() => onView(ticket.ticketId)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="support-table-empty" colSpan={5}>
                    No support requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
