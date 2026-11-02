import { useState } from 'react';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { EventCard } from '../components/EventCards.jsx';
import { EventReportsOverview } from '../components/AnalyticsCharts.jsx';
import { compareNewestFirst } from '../../../app/record-order.js';
export default function EventsPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    isCancelledWorkflowEvent,
    ownsOrganizerEvent,
  } = portalContext;
  if (currentUser.role === 'superuser')
    return (
      <EventReportsOverview
        events={portalContext.DB.events}
        onFilterEventReportsStage={portalContext.actions.onFilterEventReportsStage}
      />
    );
  if (currentUser.role === 'client') {
    return (
      <div className="empty">
        <div className="empty-icon">🚫</div>
        <div className="empty-title">Access Denied</div>
        <p className="empty-desc">
          This page is not available for clients. Please use Find Organizers to request events.
        </p>
        <button
          className="btn btn-primary mt-16"
          onClick={() => portalActions.onNavigate('find-organizers')}
        >
          Find Organizers
        </button>
      </div>
    );
  }
  const isOrg = currentUser.role === 'organizer';
  const list = (
    isOrg ? workspaceData.events.filter(event => ownsOrganizerEvent(event)) : workspaceData.events
  )
    .filter(event => {
      const displayedStatus = portalContext.organizerEventCardStatus(event);
      return (
        (!query ||
          String(event.title || event.name || '')
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!status ||
          displayedStatus === status ||
          (status === 'full' &&
            event.status === 'full' &&
            !['completed', 'cancelled'].includes(displayedStatus))) &&
        (!category || event.category === category)
      );
    })
    .sort(compareNewestFirst);
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">{isOrg ? 'My Events' : 'All Events'}</div>
          <div className="page-sub">{list.length} event(s)</div>
        </div>
        <div className="page-hd-right">
          {isOrg ? (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => portalActions.onSetWorkflowEventTab('cancelled')}
              >
                Cancelled Events ({list.filter(isCancelledWorkflowEvent).length})
              </button>
              <button
                className="btn btn-primary"
                onClick={() => portalActions.onOpenAddEventModal()}
              >
                + Create Event
              </button>
            </>
          ) : (
            ''
          )}
        </div>
      </div>
      <div className="filter-row">
        <div className="search-box input-group">
          <span className="input-icon">🔍</span>
          <input
            className="form-control"
            id="ev-q"
            placeholder="Search events…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
        <PortalSelect
          className="form-control filter-select"
          id="ev-st"
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          {isOrg ? (
            <>
              <option value="ongoing">In Progress</option>
              <option value="draft">Draft</option>
            </>
          ) : (
            ''
          )}
          <option value="full">Full</option>
          <option value="completed">Completed</option>
          {isOrg ? <option value="cancelled">Cancelled</option> : ''}
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="ev-cat"
          value={category}
          onChange={event => setCategory(event.target.value)}
        >
          <option value="">All Categories</option>
          <option>Conference</option>
          <option>Corporate</option>
          <option>Concert</option>
          <option>Workshop</option>
          <option>Networking</option>
        </PortalSelect>
      </div>
      <div className="events-grid" id="ev-grid">
        {list.map((e, index) => (
          <EventCard
            registrations={portalContext.DB.registrations}
            onRegForEvent={portalContext.actions.onRegForEvent}
            onOpenViewEventDrawer={portalContext.actions.onOpenViewEventDrawer}
            user={portalContext.CU}
            evStatBadge={portalContext.evStatBadge}
            isCancelledWorkflowEvent={portalContext.isCancelledWorkflowEvent}
            organizerEventCardStatus={portalContext.organizerEventCardStatus}
            organizerEventRequest={portalContext.organizerEventRequest}
            onOpenEditEventModal={portalContext.actions.onOpenEditEventModal}
            payments={portalContext.DB.payments}
            eventWorkflowPayments={portalContext.DB.eventWorkflowPayments}
            onHandleOrganizerDeleteEvent={portalContext.actions.onHandleOrganizerDeleteEvent}
            onOpenOrganizerEventCancellationModal={
              portalContext.actions.onOpenOrganizerEventCancellationModal
            }
            ownsOrganizerEvent={portalContext.ownsOrganizerEvent}
            event={e}
            role={currentUser.role}
            onViewWorkflowEventDetails={portalContext.actions.onViewWorkflowEventDetails}
            key={
              e?.id ??
              e?.requestId ??
              e?.eventId ??
              e?.registrationId ??
              e?.reportId ??
              e?.label ??
              (typeof e === 'string' || typeof e === 'number' ? e : index)
            }
          />
        ))}
      </div>
    </>
  );
}
