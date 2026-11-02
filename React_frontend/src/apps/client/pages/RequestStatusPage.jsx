import { useClientContext } from '../context/ClientContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { WorkflowCancellation } from '../components/WorkflowDetails.jsx';
import { compareNewestFirst } from '../../../app/record-order.js';
export default function RequestStatusPage() {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData, reqBadge } = portalContext;
  const isOrganizer = currentUser.role === 'organizer';
  if (isOrganizer) {
    const tab = sessionStorage.getItem('reqstat_tab') || 'pending';
    const myOrgId = currentUser.id;
    const pendingReqs = workspaceData.eventRequests
      .filter(request => request.status === 'pending' || request.status === 'in_review')
      .sort(compareNewestFirst);
    const myEvents = workspaceData.events
      .filter(
        event =>
          event.organizer === myOrgId &&
          (event.status === 'upcoming' ||
            event.status === 'ongoing' ||
            event.status === 'confirmed')
      )
      .sort(compareNewestFirst);
    const pendingHtml =
      pendingReqs.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No pending requests</div>
          <p className="empty-desc">New client event requests will appear here.</p>
        </div>
      ) : (
        pendingReqs.map((request, index) => {
          const cl = workspaceData.users.find(
            user => String(user.id) === String(request.clientId)
          ) ||
            workspaceData.users.find(user => user.role === 'client') || {
              name: 'Michael Torres',
            };
          return (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                borderLeft: '4px solid var(--yellow)',
              }}
              key={request?.id ?? request?.date ?? request?.title ?? index}
            >
              <div
                style={{
                  flex: '1',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: 'var(--text)',
                    }}
                  >
                    {request.title}
                  </div>
                  <span
                    style={{
                      background: '#FEF3C7',
                      color: '#92400E',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Pending
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '24px',
                    fontSize: '13px',
                    color: 'var(--text2)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>👤 {cl.name}</span>
                  <span>📅 {request.date}</span>
                  <span>
                    📍 {request.venue || 'TBD'}
                    {request.city ? ', ' + request.city : ''}
                  </span>
                  <span>👥 {request.guests} expected attendees</span>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => portalActions.onViewRequestDetail(request.id)}
                style={{
                  whiteSpace: 'nowrap',
                  borderRadius: '8px',
                  padding: '10px 20px',
                }}
              >
                Review Request
              </button>
            </div>
          );
        })
      );
    const ongoingHtml =
      myEvents.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📅</div>
          <div className="empty-title">No ongoing events</div>
          <p className="empty-desc">
            Confirmed events will appear here once requests are approved.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: '20px',
          }}
        >
          {myEvents.map((event, index) => {
            const attendees = workspaceData.registrations.filter(
              registration => registration.eventId === event.id
            ).length;
            const isPrivate = event.access === 'private' || event.access === 'Private';
            return (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                key={event?.id ?? event?.date ?? event?.title ?? index}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: 'var(--green)',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    Confirmed
                  </span>
                  {isPrivate ? (
                    <span
                      style={{
                        background: 'var(--surface2)',
                        color: 'var(--text2)',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      Private
                    </span>
                  ) : (
                    ''
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--text)',
                      marginBottom: '3px',
                    }}
                  >
                    {event.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text3)',
                    }}
                  >
                    {event.type || event.category || 'Event'}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px',
                    color: 'var(--text2)',
                  }}
                >
                  <span>📅 {event.date}</span>
                  <span>📍 {event.venue || event.location || 'TBD'}</span>
                  <span>👥 {attendees || event.capacity || 0} attendees</span>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => portalActions.onViewOngoingEventDetail(event.id)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  👁 View Details
                </button>
              </div>
            );
          })}
        </div>
      );
    return (
      <div
        style={{
          padding: '28px',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text)',
              marginBottom: '4px',
            }}
          >
            {tab === 'pending' ? 'Pending Requests' : 'Ongoing Events'}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text2)',
            }}
          >
            {tab === 'pending'
              ? 'Review and accept or decline incoming event requests.'
              : 'Manage and track your confirmed and active events.'}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0',
            marginBottom: '28px',
            background: 'var(--surface2)',
            borderRadius: '10px',
            padding: '4px',
            width: 'fit-content',
          }}
        >
          <button
            onClick={() => portalActions.onSwitchReqStatTab('pending')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: tab === 'pending' ? 'var(--accent)' : 'transparent',
              color: tab === 'pending' ? '#fff' : 'var(--text2)',
            }}
          >
            Pending Requests{' '}
            <span
              style={{
                background: tab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--border2)',
                color: tab === 'pending' ? '#fff' : 'var(--text2)',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                marginLeft: '4px',
              }}
            >
              {pendingReqs.length}
            </span>
          </button>
          <button
            onClick={() => portalActions.onSwitchReqStatTab('ongoing')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: tab === 'ongoing' ? 'var(--accent)' : 'transparent',
              color: tab === 'ongoing' ? '#fff' : 'var(--text2)',
            }}
          >
            Ongoing Events{' '}
            <span
              style={{
                background: tab === 'ongoing' ? 'rgba(255,255,255,0.25)' : 'var(--border2)',
                color: tab === 'ongoing' ? '#fff' : 'var(--text2)',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                marginLeft: '4px',
              }}
            >
              {myEvents.length}
            </span>
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {tab === 'pending' ? pendingHtml : ongoingHtml}
        </div>
      </div>
    );
  } else {
    // CLIENT VIEW -- Status-filter dropdown
    // ─ Label map (readable labels for all backend status values) ─────
    const CLIENT_STATUS_LABELS = {
      all: 'All',
      submitted: 'Submitted / Pending',
      pending: 'Submitted / Pending',
      under_review: 'Under Review',
      in_review: 'Under Review',
      info_requested: 'Under Review',
      proposal_sent: 'Awaiting Client Response',
      awaiting_client: 'Awaiting Client Response',
      changes_requested: 'Changes Requested / Counteroffer',
      counteroffer_received: 'Changes Requested / Counteroffer',
      confirmed: 'Confirmed',
      approved: 'Confirmed',
      withdrawn: 'Withdrawn',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
      expired: 'Expired',
    };
    const CLIENT_STATUS_GROUPS = [
      {
        value: 'all',
        label: 'All Requests',
      },
      {
        value: 'submitted',
        label: 'Submitted / Pending',
      },
      {
        value: 'under_review',
        label: 'Under Review',
      },
      {
        value: 'proposal_sent',
        label: 'Awaiting Client Response',
      },
      {
        value: 'changes_requested',
        label: 'Changes Requested / Counteroffer',
      },
      {
        value: 'confirmed',
        label: 'Confirmed',
      },
      {
        value: 'withdrawn',
        label: 'Withdrawn',
      },
      {
        value: 'cancelled',
        label: 'Cancelled',
      },
      {
        value: 'rejected',
        label: 'Rejected',
      },
      {
        value: 'expired',
        label: 'Expired',
      },
    ];
    function clientStatusGroup(status) {
      const s = (status || '').toLowerCase();
      if (['submitted', 'pending'].includes(s)) return 'submitted';
      if (['under_review', 'in_review', 'info_requested'].includes(s)) return 'under_review';
      if (['proposal_sent', 'awaiting_client'].includes(s)) return 'proposal_sent';
      if (['changes_requested', 'counteroffer_received'].includes(s)) return 'changes_requested';
      if (['confirmed', 'approved'].includes(s)) return 'confirmed';
      return s || 'submitted';
    }
    function clientStatusReadable(status) {
      return (
        CLIENT_STATUS_LABELS[status] ||
        (status || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      );
    }
    function clientRequestActions(r) {
      const id = r.id;
      const s = (r.status || '').toLowerCase();
      const closed = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'].includes(s);
      const parts = [
        s === 'cancelled' ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => portalActions.onViewWorkflowRequestDrawer(id)}
          >
            View Cancellation Details
          </button>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => portalActions.onViewRequestDrawer(id)}
          >
            View Details
          </button>
        ),
      ];
      if (['submitted', 'pending', 'under_review', 'in_review', 'info_requested'].includes(s))
        parts.push(
          <button
            className="btn btn-danger btn-sm"
            onClick={() => portalActions.onOpenClientCancelRequestModal(id)}
          >
            Withdraw Request
          </button>
        );
      if (s === 'proposal_sent')
        parts.push(
          <button
            className="btn btn-primary btn-sm"
            onClick={() => portalActions.onOpenClientPlanReview(id)}
          >
            Review Plan
          </button>
        );
      if (s === 'plan_submitted')
        parts.push(
          <button
            className="btn btn-primary btn-sm"
            onClick={() => portalActions.onViewWorkflowRequestDrawer(id)}
          >
            View Plan
          </button>
        );
      if (
        !closed &&
        (s === 'awaiting_client' ||
          (r.paymentStatus === 'deposit_pending' &&
            (r.proposals || []).some(proposal => proposal.status === 'accepted')))
      )
        parts.push(
          <button
            className="btn btn-success btn-sm"
            onClick={() => portalActions.onOpenClientPaymentModal(id)}
          >
            Proceed to Payment &amp; Confirmation
          </button>
        );
      if (['changes_requested', 'counteroffer_received'].includes(s))
        parts.push(
          <button
            className="btn btn-primary btn-sm"
            onClick={() => portalActions.onOpenClientPlanReview(id)}
          >
            View &amp; Respond
          </button>
        );
      if (['confirmed', 'approved'].includes(s))
        parts.push(
          <button
            className="btn btn-danger btn-sm"
            onClick={() => portalActions.onOpenClientCancelRequestModal(id)}
          >
            Cancel Event
          </button>
        );
      return parts;
    }
    function clientRequestHistory(r) {
      const s = (r.status || '').toLowerCase();
      if (s === 'rejected' && r.rejectionReason)
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--red-dim)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong
              style={{
                color: 'var(--red)',
              }}
            >
              Declined:
            </strong>{' '}
            {r.rejectionReason}
            {r.rejectionComments ? (
              <div
                className="small mt-4"
                style={{
                  color: 'var(--text2)',
                }}
              >
                {r.rejectionComments}
              </div>
            ) : (
              ''
            )}
          </div>
        );
      if (s === 'withdrawn' && (r.withdrawalReason || r.withdrawReason))
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--surface2)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong>Withdrawn:</strong> {r.withdrawalReason || r.withdrawReason}
          </div>
        );
      if (s === 'cancelled')
        return (
          <WorkflowCancellation
            events={portalContext.DB.events}
            users={portalContext.DB.users}
            user={portalContext.CU}
            workflowMoney={portalContext.workflowMoney}
            workflowPolicyDate={portalContext.workflowPolicyDate}
            cancellation={r.cancellation}
            request={r}
            compact={true}
          />
        );
      if (s === 'expired')
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--red-dim)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong
              style={{
                color: 'var(--red)',
              }}
            >
              Proposal Expired:
            </strong>{' '}
            The organizer's proposal was not accepted in time.
          </div>
        );
      if (['changes_requested', 'counteroffer_received'].includes(s) && r.clientFeedback)
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--yellow-dim)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong>Your feedback:</strong> {r.clientFeedback}
          </div>
        );
      if (['confirmed', 'approved'].includes(s) && r.cancellationPolicy) {
        const pol = r.cancellationPolicy;
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--green-dim)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong
              style={{
                color: 'var(--green)',
              }}
            >
              ✓ Booking Confirmed
            </strong>
            {r.depositAmount
              ? ` \u00b7 Deposit paid \u20b9${Number(r.depositAmount).toLocaleString()}`
              : ''}
            {pol.deadlineText ? (
              <div
                className="small mt-4"
                style={{
                  color: 'var(--text2)',
                }}
              >
                Cancellation deadline: {pol.deadlineText}
              </div>
            ) : (
              ''
            )}
          </div>
        );
      }
      if (['proposal_sent', 'awaiting_client'].includes(s) && r.proposals && r.proposals.length) {
        const p = r.proposals[r.proposals.length - 1];
        return (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--accent-dim)',
              borderRadius: '6px',
              fontSize: '12.5px',
            }}
          >
            <strong
              style={{
                color: 'var(--accent)',
              }}
            >
              📄 Proposal v{p.version || 1}:
            </strong>{' '}
            ₹{Number(p.amount || 0).toLocaleString()} total
            {p.validUntil ? ` &middot; Valid until ${p.validUntil}` : ''}
          </div>
        );
      }
      return '';
    }
    const allReqs = workspaceData.eventRequests
      .filter(request => String(request.clientId) === String(currentUser.id))
      .sort(compareNewestFirst);
    const filterStatus = sessionStorage.getItem('client_req_filter') || 'all';
    const reqs =
      filterStatus === 'all'
        ? allReqs
        : allReqs.filter(request => clientStatusGroup(request.status) === filterStatus);
    const groupCounts = {};
    allReqs.forEach(request => {
      const eventRequest = clientStatusGroup(request.status);
      groupCounts[eventRequest] = (groupCounts[eventRequest] || 0) + 1;
    });
    const dropdownOptions = CLIENT_STATUS_GROUPS.map((sg, index) => {
      const cnt = sg.value === 'all' ? allReqs.length : groupCounts[sg.value] || 0;
      return (
        <option
          value={sg.value}
          {...(filterStatus === sg.value
            ? {
                selected: true,
              }
            : {})}
          key={sg?.label ?? sg?.value ?? index}
        >
          {sg.label} ({cnt})
        </option>
      );
    });
    return (
      <>
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Request Status</div>
            <div className="page-sub">
              {allReqs.length} event request{allReqs.length !== 1 ? 's' : ''} total
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
            <PortalSelect
              id="client-req-status-filter"
              className="form-control"
              style={{
                width: '270px',
                fontSize: '13px',
              }}
              onChange={event => {
                sessionStorage.setItem('client_req_filter', event.currentTarget.value);
                portalActions.onRenderPage('request-status');
              }}
              aria-label="Filter requests by status"
              value={''}
            >
              {dropdownOptions}
            </PortalSelect>
            <button
              className="btn btn-primary"
              onClick={() => portalActions.onNavigate('find-organizers')}
            >
              + New Request
            </button>
          </div>
        </div>
        {reqs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">
              No requests{filterStatus !== 'all' ? ' with this status' : ' yet'}
            </div>
            <p className="empty-desc">
              {filterStatus === 'all'
                ? 'Browse organizers and send them an event request to get started.'
                : 'Try a different status filter or create a new request.'}
            </p>
            {filterStatus === 'all' ? (
              <button
                className="btn btn-primary mt-16"
                onClick={() => portalActions.onNavigate('find-organizers')}
              >
                Find Organizers
              </button>
            ) : (
              <button
                className="btn btn-ghost mt-16"
                onClick={() => {
                  sessionStorage.setItem('client_req_filter', 'all');
                  portalActions.onRenderPage('request-status');
                }}
              >
                Show All Requests
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {reqs.map((request, index) => (
              <div className="card" key={request?.date ?? request?.title ?? index}>
                <div className="flex justify-between items-start">
                  <div
                    style={{
                      flex: '1',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        marginBottom: '5px',
                      }}
                    >
                      {request.title}
                    </div>
                    <div className="small mb-8">
                      {request.type || 'Event'} · {request.guests} guests · {request.date}
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text2)',
                        lineHeight: '1.6',
                        marginBottom: '12px',
                      }}
                    >
                      {request.desc || ''}
                    </p>
                    <span className={`badge badge-${reqBadge(request.status)}`}>
                      {clientStatusReadable(request.status)}
                    </span>
                    {clientRequestHistory(request)}
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      flexShrink: '0',
                      marginLeft: '20px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        color: 'var(--green)',
                      }}
                    >
                      ₹{(request.budget || 0).toLocaleString()}
                    </div>
                    <div className="small">Budget</div>
                  </div>
                </div>
                <div className="flex gap-8 mt-14">{clientRequestActions(request)}</div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }
}
