import FilterInput from '../../../app/FilterInput.jsx';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { EventCard } from '../components/EventCards.jsx';
export default function DashboardPage() {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    filterOrganizerDashboardEvents,
    isCancelledWorkflowEvent,
    organizerDashboardData,
    workflowEventPhase,
  } = portalContext;
  const esc = value => String(value ?? '');
  if (typeof organizerDashboardData !== 'undefined' && organizerDashboardData) {
    const d = organizerDashboardData;
    const counts = d.eventStatusCounts || {};
    const attentionCount =
      d.eventsNeedingAttention !== undefined
        ? d.eventsNeedingAttention
        : d.attentionEventIds?.length ?? 0;
    const actions = Array.isArray(d.priorityActions) ? d.priorityActions : [];
    const upcomingList = Array.isArray(d.upcomingSchedule) ? d.upcomingSchedule : [];
    return (
      <>
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Organizer Dashboard</div>
            <div className="page-sub">
              Hello {(currentUser && currentUser.name) || 'Organizer'}, manage your events.
            </div>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-primary" onClick={() => portalActions.onOpenAddEventModal()}>
              + Create Event
            </button>
          </div>
        </div>
        <div className="grid-4 mb-20">
          <div
            className="stat-card"
            onClick={() => portalActions.onOpenOrganizerEvents('all')}
            style={{
              cursor: 'pointer',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
              }}
            >
              🗓️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--accent)',
              }}
            >
              {d.totalEvents ?? (workspaceData.events || []).length}
            </div>
            <div className="stat-label">My Events</div>
            <div
              className="stat-sub neutral"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                fontSize: '11px',
                marginTop: '4px',
              }}
            >
              <span>
                Upcoming <strong>{counts.upcoming ?? 0}</strong>
              </span>
              <span>
                In Progress <strong>{counts.inProgress ?? 0}</strong>
              </span>
              <span>
                Completed <strong>{counts.completed ?? 0}</strong>
              </span>
              <span>
                Cancelled <strong>{counts.cancelled ?? 0}</strong>
              </span>
              <span>
                Needs Attention <strong>{counts.needsAttention ?? 0}</strong>
              </span>
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => portalActions.onOpenOrganizerRequests()}
            style={{
              cursor: 'pointer',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--blue-dim)',
                color: 'var(--blue)',
              }}
            >
              📋
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--blue)',
              }}
            >
              {d.pendingRequests ?? 0}
            </div>
            <div className="stat-label">Pending Event Requests</div>
            <div className="stat-sub neutral">Review client proposals</div>
          </div>
          <div
            className="stat-card"
            onClick={() => portalActions.onPageOrganizerFinancialRecords()}
            style={{
              cursor: 'pointer',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--green-dim)',
                color: 'var(--green)',
              }}
            >
              💰
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--green)',
              }}
            >
              ₹{Number(d.totalRevenue ?? 0).toLocaleString()}
            </div>
            <div className="stat-label">Event Revenue</div>
            <div className="stat-sub neutral">
              Gross: ₹{Number(d.grossRevenue ?? d.totalRevenue ?? 0).toLocaleString()}
              {d.refundedAmount ? ` (Refunded: ₹${Number(d.refundedAmount).toLocaleString()})` : ''}
            </div>
          </div>
          <div
            className="stat-card"
            onClick={() => portalActions.onOpenOrganizerEvents('attention')}
            style={{
              cursor: 'pointer',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--yellow-dim)',
                color: 'var(--yellow)',
              }}
            >
              ⚠️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--yellow)',
              }}
            >
              {attentionCount}
            </div>
            <div className="stat-label">Events Needing Attention</div>
            <div className="stat-sub neutral">Requires immediate action</div>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div className="card">
            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '12px',
              }}
            >
              Priority Actions
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {actions.length === 0 ? (
                <div className="small text-muted">No pending priority actions.</div>
              ) : (
                actions.map((act, index) => (
                  <div
                    style={{
                      padding: '10px',
                      background: 'var(--surface2)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={
                      act.type === 'preparation'
                        ? () =>
                            portalActions.onOrganizerEventSection(
                              act.eventId || act.id,
                              'preparation'
                            )
                        : act.type === 'request'
                        ? () => portalActions.onViewWorkflowRequestDrawer(act.id)
                        : () => portalActions.onOpenOrganizerIssue(act.id)
                    }
                    key={act?.id ?? act?.eventId ?? act?.title ?? index}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '13.5px',
                        }}
                      >
                        {esc(act.title)}
                      </div>
                      <div className="small text-muted">{esc(act.detail || '')}</div>
                    </div>
                    <span
                      className={`badge badge-${
                        act.type === 'preparation'
                          ? 'yellow'
                          : act.type === 'request'
                          ? 'blue'
                          : 'red'
                      }`}
                    >
                      {act.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card">
            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '12px',
              }}
            >
              Upcoming Schedule
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {upcomingList.length === 0 ? (
                <div className="small text-muted">No upcoming events scheduled.</div>
              ) : (
                upcomingList.map((event, index) => (
                  <div
                    style={{
                      padding: '10px',
                      background: 'var(--surface2)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => portalActions.onOpenViewEventDrawer(event.eventId || event.id)}
                    key={event?.date ?? event?.title ?? index}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '13.5px',
                        }}
                      >
                        {esc(event.title)}
                      </div>
                      <div className="small text-muted">
                        📅 {esc(event.date || '')} {esc(event.time || '')} · 📍{' '}
                        {esc(event.location || '')}
                      </div>
                    </div>
                    <span className="badge badge-green">{esc(event.status || 'published')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
  const myEventsList = (workspaceData && workspaceData.events) || [];
  const myEv = myEventsList.filter(e => String(e.organizer) === String(currentUser.id));
  const activeEvents = myEv.filter(e => !isCancelledWorkflowEvent(e));
  const upcoming = activeEvents.filter(event => workflowEventPhase(event) === 'upcoming');
  const allRegs = (workspaceData && workspaceData.registrations) || [];
  const totalAttendees = allRegs.filter(registration =>
    myEv.some(e => String(e.id) === String(registration.eventId))
  ).length;
  const allReqs = (workspaceData && workspaceData.eventRequests) || [];
  const inReviewCount = allReqs.filter(
    request =>
      String(request.organizer) === String(currentUser.id) &&
      request.status === 'plan_submitted' &&
      (workspaceData.eventPlans || []).some(
        plan =>
          String(plan.eventPlanId) === String(request.activeEventPlanId) &&
          plan.approvalStatus === 'pending'
      )
  ).length;
  const weeklyAttendees = allRegs.filter(
    registration =>
      myEv.some(e => String(e.id) === String(registration.eventId)) &&
      new Date(
        registration.registrationDate || registration.createdAt || registration.date
      ).getTime() >=
        Date.now() - 7 * 86400000
  ).length;
  const searchQuery = (sessionStorage.getItem('org_events_search') || '').toLowerCase();
  const statusFilter = sessionStorage.getItem('org_events_status') || '';
  const categoryFilter = sessionStorage.getItem('org_events_category') || '';
  const filteredEvents = filterOrganizerDashboardEvents(
    activeEvents,
    searchQuery,
    statusFilter,
    categoryFilter
  );
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Organizer Dashboard</div>
          <div className="page-sub">
            Hello {(currentUser && currentUser.name) || 'Organizer'}, manage your events.
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-primary" onClick={() => portalActions.onOpenAddEventModal()}>
            + Create Event
          </button>
        </div>
      </div>
      <div className="grid-4 mb-20">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            🗓️
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            {myEv.length}
          </div>
          <div className="stat-label">My Events</div>
          <div className="stat-sub neutral">{upcoming.length} upcoming</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            👥
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            {totalAttendees}
          </div>
          <div className="stat-label">Total Attendees</div>
          <div className="stat-sub up">↑ {weeklyAttendees} this week</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--blue-dim)',
              color: 'var(--blue)',
            }}
          >
            📋
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--blue)',
            }}
          >
            {inReviewCount}
          </div>
          <div className="stat-label">Plans in Review</div>
          <div className="stat-sub neutral">With clients</div>
        </div>
      </div>
      <div className="mb-16">
        <div className="mb-12 flex justify-between items-center">
          <span className="h4">My Events</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => portalActions.onOpenOrganizerEvents('cancelled')}
          >
            Cancelled Events
          </button>
        </div>
        <div
          className="search-box input-group"
          style={{
            marginBottom: '16px',
          }}
        >
          <span className="input-icon">🔍</span>
          <FilterInput
            className="form-control"
            id="org-events-search"
            placeholder="Search by event name or city..."
            value={searchQuery}
            onInput={event => portalActions.onSearchOrganizerEvents(event.currentTarget.value)}
          />
        </div>
        <div
          className="filter-row"
          style={{
            marginBottom: '16px',
          }}
        >
          <PortalSelect
            className="form-control filter-select"
            id="org-events-status"
            onChange={() => portalActions.onFilterOrganizerDashboardEventsFromControls()}
            value={statusFilter}
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
          </PortalSelect>
          <PortalSelect
            className="form-control filter-select"
            id="org-events-category"
            onChange={() => portalActions.onFilterOrganizerDashboardEventsFromControls()}
            value={categoryFilter}
          >
            <option value="">All Categories</option>
            {[...new Set(myEv.map((e, index) => e.category).filter(Boolean))]
              .sort()
              .map((category, index) => (
                <option
                  value={esc(category)}
                  key={
                    category?.id ??
                    category?.requestId ??
                    category?.eventId ??
                    category?.registrationId ??
                    category?.reportId ??
                    category?.label ??
                    (typeof category === 'string' || typeof category === 'number'
                      ? category
                      : index)
                  }
                >
                  {esc(category)}
                </option>
              ))}
          </PortalSelect>
        </div>
        <div className="events-grid" id="org-events-grid">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
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
                event={event}
                role={'organizer'}
                onViewWorkflowEventDetails={portalContext.actions.onViewWorkflowEventDetails}
                key={
                  event?.id ??
                  event?.requestId ??
                  event?.eventId ??
                  event?.registrationId ??
                  event?.reportId ??
                  event?.label ??
                  (typeof event === 'string' || typeof event === 'number' ? event : index)
                }
              />
            ))
          ) : activeEvents.length > 0 ? (
            <div
              className="empty"
              style={{
                gridColumn: '1/-1',
              }}
            >
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No events match</div>
              <p>Try adjusting your filters</p>
            </div>
          ) : myEv.length > 0 ? (
            <div
              className="empty"
              style={{
                gridColumn: '1/-1',
              }}
            >
              <div className="empty-icon">📁</div>
              <div className="empty-title">No active events</div>
              <button
                className="btn btn-ghost mt-16"
                onClick={() => portalActions.onOpenOrganizerEvents('cancelled')}
              >
                View Cancelled Events
              </button>
            </div>
          ) : (
            <div
              className="ev-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '240px',
                borderStyle: 'dashed',
                cursor: 'pointer',
              }}
              onClick={() => portalActions.onOpenAddEventModal()}
            >
              <div
                className="text-center"
                style={{
                  color: 'var(--text3)',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    marginBottom: '8px',
                  }}
                >
                  ➕
                </div>
                <div
                  style={{
                    fontSize: '13px',
                  }}
                >
                  Create Your First Event
                </div>
              </div>
            </div>
          )}
          {myEv.length > 0 ? (
            <div
              className="ev-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '240px',
                borderStyle: 'dashed',
                cursor: 'pointer',
              }}
              onClick={() => portalActions.onOpenAddEventModal()}
            >
              <div
                className="text-center"
                style={{
                  color: 'var(--text3)',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    marginBottom: '8px',
                  }}
                >
                  ➕
                </div>
                <div
                  style={{
                    fontSize: '13px',
                  }}
                >
                  Create New Event
                </div>
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </>
  );
}
