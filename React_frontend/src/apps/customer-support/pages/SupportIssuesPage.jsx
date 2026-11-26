import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectSession } from '../../../store/slices/authSlice.js';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import useSupportRequests from '../hooks/useSupportRequests.js';
import SupportTicketTable from '../components/SupportTicketTable.jsx';

export default function SupportIssuesPage() {
  const context = useSupportExecutiveContext();
  const user = useSelector(selectSession);
  const getOptions = context.supportExecutiveRequestOptions;
  const { queueTitle } = getOptions();
  const { tickets: receivedTickets, loading, error, refresh, updateTicket } =
    useSupportRequests(user);
  const { onNavigate } = context.actions;
  const container = useRef(null);
  const dialog = useRef(null);
  const tickets = useMemo(() => {
    const ids = new Set(receivedTickets.map(ticket => String(ticket.ticketId)));
    return [
      ...receivedTickets,
      ...(context.additionalTickets || []).filter(ticket => !ids.has(String(ticket.ticketId))),
    ];
  }, [receivedTickets, context.additionalTickets]);

  useEffect(() => {
    const boundDialog = window.EventFlowSupport.bind(
      container.current,
      user,
      () => onNavigate('dashboard'),
      'Back to Dashboard',
      { ...getOptions(), management: true, nativeView: true, onRefresh: refresh, updateTicket }
    );
    dialog.current = boundDialog;
    return () => {
      boundDialog?.destroy();
      dialog.current = null;
    };
  }, [user, onNavigate, getOptions, refresh, updateTicket]);

  useEffect(() => {
    if (loading || !dialog.current) return;
    const ticketId = sessionStorage.getItem('support_request_id');
    if (!ticketId) return;
    sessionStorage.removeItem('support_request_id');
    const ticket = tickets.find(item => String(item.ticketId) === ticketId);
    if (ticket) dialog.current.openTicket(ticket);
  }, [loading, tickets]);
  return (
    <div ref={container}>
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
        <button type="button" className="btn btn-ghost" disabled={loading} onClick={() => refresh()}>
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
          title={queueTitle || 'Received Support Requests'}
          tickets={tickets}
          management
          onView={id => dialog.current?.openTicket(tickets.find(ticket => ticket.ticketId === id))}
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
