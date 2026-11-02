import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import FilterInput from '../../../app/FilterInput.jsx';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { OrganizerRowActions } from '../components/EventActions.jsx';
export default function EventRequestsPage() {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    agreementBadgeInfo,
    normalizeEventRequest,
    paymentBadgeInfo,
    reqBadgeColor,
  } = portalContext;
  // Normalize all requests
  workspaceData.eventRequests.forEach(normalizeEventRequest);
  const filterTab = sessionStorage.getItem('org_reqs_tab') || 'all';
  const search = (sessionStorage.getItem('org_reqs_search') || '').toLowerCase().trim();

  // Show requests relevant to this organizer (or all for superuser)
  const myReqs = workspaceData.eventRequests.filter(request => {
    if (currentUser.role === 'superuser') return true;
    return (
      String(request.organizer) === String(currentUser.id) ||
      String(request.organizerId) === String(currentUser.id) ||
      String(request.organizerUserId) === String(currentUser.id) ||
      !request.organizer
    );
  });

  // 5 functional status groups per specification:
  // 1. All Requests: All requests
  // 2. Action Required: Submitted/pending requests, proposals awaiting client response, and counteroffers/requested changes requiring action
  const actionRequiredStatuses = [
    'submitted',
    'pending',
    'proposal_sent',
    'awaiting_client',
    'changes_requested',
    'counteroffer_received',
    'planning',
    'plan_submitted',
    'plan_revision_requested',
  ];
  // 3. Under Review: Requests currently being reviewed by the organizer
  const underReviewStatuses = ['under_review', 'in_review', 'info_requested'];
  // 4. Confirmed Bookings: Successfully confirmed bookings only
  const confirmedStatuses = ['confirmed', 'approved'];
  // 5. Closed Requests: Withdrawn, cancelled, rejected, and expired requests
  const closedStatuses = ['withdrawn', 'cancelled', 'rejected', 'expired', 'completed'];
  const allCount = myReqs.length;
  const actionRequiredCount = myReqs.filter(request =>
    actionRequiredStatuses.includes(request.status)
  ).length;
  const underReviewCount = myReqs.filter(request =>
    underReviewStatuses.includes(request.status)
  ).length;
  const confirmedCount = myReqs.filter(request =>
    confirmedStatuses.includes(request.status)
  ).length;
  const closedCount = myReqs.filter(request => closedStatuses.includes(request.status)).length;
  const actionableLegacyCount = myReqs.filter(request =>
    [
      'submitted',
      'pending',
      'changes_requested',
      'counteroffer_received',
      'planning',
      'plan_submitted',
      'plan_revision_requested',
    ].includes(request.status)
  ).length;
  const needsReviewLegacyCount = myReqs.filter(request =>
    ['submitted', 'pending', 'under_review', 'info_requested'].includes(request.status)
  ).length;
  const proposalsLegacyCount = myReqs.filter(request =>
    ['proposal_sent', 'awaiting_client'].includes(request.status)
  ).length;
  let filtered = myReqs.filter(request => {
    if (
      filterTab === 'action_required' ||
      filterTab === 'actionable' ||
      filterTab === 'needs_review' ||
      filterTab === 'proposals'
    ) {
      return actionRequiredStatuses.includes(request.status);
    }
    if (filterTab === 'under_review') {
      return underReviewStatuses.includes(request.status);
    }
    if (filterTab === 'confirmed') {
      return confirmedStatuses.includes(request.status);
    }
    if (filterTab === 'closed') {
      return closedStatuses.includes(request.status);
    }
    return true;
  });
  const reqStatusFilter = sessionStorage.getItem('org_reqs_status');
  const reqTypeFilter = sessionStorage.getItem('org_reqs_type');
  const reqPaymentFilter = sessionStorage.getItem('org_reqs_payment');
  const reqDateFrom = sessionStorage.getItem('org_reqs_date_from');
  const reqDateTo = sessionStorage.getItem('org_reqs_date_to');
  if (reqStatusFilter) {
    filtered = filtered.filter(r => r.status === reqStatusFilter);
  }
  if (reqTypeFilter) {
    filtered = filtered.filter(r => (r.type || r.eventType) === reqTypeFilter);
  }
  if (reqPaymentFilter) {
    filtered = filtered.filter(r => r.paymentStatus === reqPaymentFilter);
  }
  if (reqDateFrom) {
    filtered = filtered.filter(r => (r.date || r.eventDate) >= reqDateFrom);
  }
  if (reqDateTo) {
    filtered = filtered.filter(r => (r.date || r.eventDate) <= reqDateTo);
  }
  if (search) {
    filtered = filtered.filter(r => {
      const cl =
        (workspaceData.users &&
          workspaceData.users.find(user => String(user.id) === String(r.clientId))) ||
        {};
      const clientDetails = r.clientDetails || {};
      return (
        (r.title && r.title.toLowerCase().includes(search)) ||
        (r.type && r.type.toLowerCase().includes(search)) ||
        (r.eventType && r.eventType.toLowerCase().includes(search)) ||
        (cl.name && cl.name.toLowerCase().includes(search)) ||
        (cl.email && cl.email.toLowerCase().includes(search)) ||
        (clientDetails.name && clientDetails.name.toLowerCase().includes(search)) ||
        (clientDetails.email && clientDetails.email.toLowerCase().includes(search)) ||
        (clientDetails.companyName && clientDetails.companyName.toLowerCase().includes(search))
      );
    });
  }
  const getReqTime = request => {
    const u = request.updatedAt ? new Date(request.updatedAt).getTime() : 0;
    const c = request.createdAt ? new Date(request.createdAt).getTime() : 0;
    const cr = request.created ? new Date(request.created).getTime() : 0;
    let p = 0;
    if (Array.isArray(request.proposals) && request.proposals.length > 0) {
      const lastP = request.proposals[request.proposals.length - 1];
      p = lastP?.sentAt ? new Date(lastP.sentAt).getTime() : 0;
    }
    return Math.max(u, c, cr, p);
  };
  filtered.sort((a, b) => {
    const diff = getReqTime(b) - getReqTime(a);
    if (diff !== 0) return diff;
    return String(b.id || b.requestId || '').localeCompare(String(a.id || a.requestId || ''));
  });
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Event Requests</div>
          <div className="page-sub">
            Review incoming requests and track negotiation, event plans, and client approval.
          </div>
        </div>
        <div
          className="page-hd-right"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <div
            className="input-group"
            style={{
              width: '240px',
            }}
          >
            <span className="input-icon">🔍</span>
            <FilterInput
              className="form-control"
              placeholder="Search requests..."
              value={search}
              onInput={event => {
                sessionStorage.setItem('org_reqs_search', event.currentTarget.value);
                portalActions.onRenderPage('event-requests');
              }}
            />
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => {
              sessionStorage.setItem('org_reqs_tab', 'all');
              portalActions.onRenderPage('event-requests');
            }}
            className={`btn btn-sm ${
              filterTab === 'all' || !filterTab ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            All Requests ({allCount})
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('org_reqs_tab', 'action_required');
              portalActions.onRenderPage('event-requests');
            }}
            className={`btn btn-sm ${
              filterTab === 'action_required' || filterTab === 'actionable'
                ? 'btn-primary'
                : 'btn-ghost'
            }`}
          >
            Action Required ({actionRequiredCount})
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('org_reqs_tab', 'under_review');
              portalActions.onRenderPage('event-requests');
            }}
            className={`btn btn-sm ${filterTab === 'under_review' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Under Review ({underReviewCount})
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('org_reqs_tab', 'confirmed');
              portalActions.onRenderPage('event-requests');
            }}
            className={`btn btn-sm ${filterTab === 'confirmed' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Confirmed Bookings ({confirmedCount})
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('org_reqs_tab', 'closed');
              portalActions.onRenderPage('event-requests');
            }}
            className={`btn btn-sm ${filterTab === 'closed' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Closed Requests ({closedCount})
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <label
            htmlFor="org-filter-dropdown"
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text3)',
            }}
          >
            Filter by Status:
          </label>
          <PortalSelect
            id="org-filter-dropdown"
            className="form-control"
            style={{
              width: 'auto',
              height: '32px',
              padding: '4px 8px',
              fontSize: '12.5px',
            }}
            onChange={event => {
              sessionStorage.setItem('org_reqs_tab', event.currentTarget.value);
              portalActions.onRenderPage('event-requests');
            }}
            value={filterTab}
          >
            <option value="all">All Requests ({allCount})</option>
            <option value="action_required">Action Required ({actionRequiredCount})</option>
            <option value="under_review">Under Review ({underReviewCount})</option>
            <option value="confirmed">Confirmed Bookings ({confirmedCount})</option>
            <option value="closed">Closed Requests ({closedCount})</option>
          </PortalSelect>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '13px',
          color: 'var(--text3)',
        }}
      >
        <span>
          Showing {filtered.length} of {myReqs.length} requests
        </span>
        <span
          style={{
            display: 'none',
          }}
        >
          Actionable ({actionableLegacyCount}) Needs Review ({needsReviewLegacyCount}) Proposals
          &amp; Client ({proposalsLegacyCount}) DEMO DATA
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Event Details</th>
              <th>Requested Date</th>
              <th>Budget</th>
              <th>Lifecycle Status</th>
              <th>Agreement</th>
              <th>Deposit / Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: 'center',
                    padding: '36px',
                    color: 'var(--text3)',
                  }}
                >
                  No event requests match the selected view.
                </td>
              </tr>
            ) : (
              ''
            )}
            {filtered.map((r, index) => {
              const cl = (workspaceData.users &&
                workspaceData.users.find(user => String(user.id) === String(r.clientId))) ||
                (workspaceData.users && workspaceData.users.find(user => user.role === 'client')) ||
                r.clientDetails || {
                  name: 'Michael Torres',
                  avatar: 'MT',
                  avatarImage: '/assets/images/avatars/user-michael-torres.jpg',
                };
              const clientAv = cl.avatarImage ? (
                <div className="av av-xs">
                  <ImageWithFallback
                    src={cl.avatarImage}
                    alt={cl.name}
                    fallbackTag="span"
                    fallbackProps={{
                      style: {
                        display: 'block',
                      },
                    }}
                  >
                    {cl.avatar || cl.name?.[0] || 'C'}
                  </ImageWithFallback>
                </div>
              ) : (
                <div className="av av-xs">{cl.avatar || cl.name?.[0] || 'C'}</div>
              );
              const ag = agreementBadgeInfo(r.agreementStatus);
              const pay = paymentBadgeInfo(r.paymentStatus);
              const stBadge =
                typeof reqBadgeColor === 'function' ? reqBadgeColor(r.status) : 'gray';
              return (
                <tr key={r?.date ?? r?.title ?? index}>
                  <td>
                    <div className="flex items-center gap-8">
                      {clientAv}
                      <div>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '13.5px',
                          }}
                        >
                          {cl.name || 'Client'}
                        </div>
                        <div className="small text-muted">
                          {cl.company || cl.companyName || cl.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: 'var(--text)',
                      }}
                    >
                      {r.title || r.eventName || 'Event'}
                      {r.demoScenario ? (
                        <>
                          {' '}
                          <span
                            className="badge badge-warning"
                            style={{
                              fontSize: '10px',
                            }}
                          >
                            DEMO DATA
                          </span>
                        </>
                      ) : (
                        ''
                      )}
                    </div>
                    <div className="small text-muted">
                      {r.type || r.eventType || 'Corporate'} · {r.guests || r.capacity || 100}{' '}
                      guests
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        marginBottom: '3px',
                      }}
                    >
                      {r.date || r.eventDate || ''}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        color: 'var(--green)',
                        fontWeight: '700',
                        fontSize: '14px',
                      }}
                    >
                      ₹{(Number(r.budget) || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${stBadge}`}
                      style={{
                        textTransform: 'capitalize',
                      }}
                    >
                      {(r.status || 'submitted').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${ag.cls}`}>{ag.lbl}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${pay.cls}`}>{pay.lbl}</span>
                  </td>
                  <td>
                    <OrganizerRowActions
                      onViewRequestDetail={portalContext.actions.onViewRequestDetail}
                      onNavigate={portalContext.actions.onNavigate}
                      onViewWorkflowRequestDrawer={
                        portalContext.actions.onViewWorkflowRequestDrawer
                      }
                      request={r}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
