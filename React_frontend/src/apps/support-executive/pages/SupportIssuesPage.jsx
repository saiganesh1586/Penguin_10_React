import { useCallback, useEffect } from 'react';
import useSupportDialog from '../context/useSupportDialog.js';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import useSupportQueue from '../context/useSupportQueue.js';
import SupportTicketTable from '../../customer-support/components/SupportTicketTable.jsx';
export default function SupportIssuesPage() {
  const context = useSupportExecutiveContext();
  const user = context.CU;
  const getOptions = context.supportExecutiveRequestOptions;
  const options = getOptions();
  const { tickets, loading, error, refresh } = useSupportQueue(user, getOptions);
  const onBack = useCallback(() => context.actions.onNavigate('dashboard'), [context.actions]);
  const { setContainer, openTicket, ready } = useSupportDialog(user, getOptions, refresh, onBack);
  useEffect(() => {
    if (loading || !ready) return;
    const ticketId = sessionStorage.getItem('support_request_id');
    if (!ticketId) return;
    sessionStorage.removeItem('support_request_id');
    const ticket = tickets.find(item => String(item.ticketId) === ticketId);
    if (ticket) openTicket(ticket);
  }, [loading, tickets, ready, openTicket]);
  return (
    <div ref={setContainer}>
      <div className="page-hd support-page-heading">
        <div className="page-hd-left">
          <div className="page-title">Support &amp; Issue Management</div>
          <div className="page-sub">
            Review requester tickets, update their status, and send replies visible in My Tickets.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <button type="button" className="btn btn-ghost" disabled={loading} onClick={refresh}>
          Refresh Requests
        </button>
        <span className="support-status support-status-open">
          Open: {tickets.filter(ticket => ticket.status === 'open').length}
        </span>
        <span className="support-status support-status-in_progress">
          In progress: {tickets.filter(ticket => ticket.status === 'in_progress').length}
        </span>
        <span className="support-status support-status-resolved">
          Resolved: {tickets.filter(ticket => ticket.status === 'resolved').length}
        </span>
      </div>
      <div
        className="support-layout"
        style={{
          gridTemplateColumns: 'minmax(0,1fr)',
        }}
      >
        {error && (
          <p className="support-feedback support-feedback-error" role="alert">
            Could not load support tickets: {error}
          </p>
        )}
        <SupportTicketTable
          title={options.queueTitle || 'Received Support Requests'}
          tickets={tickets}
          management
          onView={id => openTicket(tickets.find(ticket => ticket.ticketId === id))}
        />
      </div>
      <div className="support-modal-overlay" id="support-ticket-modal" hidden>
        <section
          className="support-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
        >
          <div id="support-modal-content" />
        </section>
      </div>
    </div>
  );
}
