import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSession } from '../../../store/slices/authSlice.js';
import useAutoRefresh from '../hooks/useAutoRefresh.js';
import useSupportRequests from '../hooks/useSupportRequests.js';
import SupportRequestForm from '../components/SupportRequestForm.jsx';
import SupportTicketTable from '../components/SupportTicketTable.jsx';
import TicketDetailsPage from './TicketDetailsPage.jsx';
export default function CustomerSupportPage({ onSignOut, onBack }) {
  const user = useSelector(selectSession);
  const requests = useSupportRequests(user);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selected = requests.tickets.find(ticket => ticket.ticketId === selectedId);
  useAutoRefresh(requests.refresh, {
    enabled: !editing && !selectedId && !requests.loading,
  });
  return (
    <>
      <div className="page-hd support-page-heading">
        <div className="page-hd-left">
          <div className="page-title">Customer Support</div>
          <div className="page-sub">
            Tell us what you need help with. Your ticket number, status, and support replies will be
            available here.
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-ghost btn-sm" type="button" onClick={onBack || onSignOut}>
            {onBack ? 'Back to Settings' : 'Sign out and return'}
          </button>
        </div>
      </div>
      <div className="support-layout">
        {requests.error && (
          <p className="support-feedback support-feedback-error" role="alert">
            Could not load support tickets: {requests.error}
          </p>
        )}
        <SupportRequestForm user={user} onSubmit={requests.create} onEditing={setEditing} />
        <SupportTicketTable tickets={requests.tickets} onView={setSelectedId} />
      </div>
      {selected && (
        <TicketDetailsPage
          key={selected.ticketId}
          ticket={selected}
          user={user}
          onClose={() => setSelectedId(null)}
          onFollowUp={requests.followUp}
          onDelete={async id => {
            await requests.remove(id);
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}
