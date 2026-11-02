import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
import {
  WorkflowCancellation,
  WorkflowEventPolicy,
  WorkflowFileReports,
} from '../components/WorkflowDetails.jsx';
export default function RequestDetailsPage({ id }) {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    _workflowReturnPage,
    reqBadge,
    workflowEventPolicy,
    workflowPolicyDate,
  } = portalContext;
  const r = workspaceData.eventRequests.find(request => String(request.id) === String(id));
  if (!r) {
    return (
      <div className="empty">
        <div className="empty-title">Request not found</div>
        <button
          className="btn btn-primary mt-16"
          onClick={() => portalActions.onNavigate('request-status')}
        >
          Back to requests
        </button>
      </div>
    );
    return;
  }
  const plan =
    (workspaceData.eventPlans || []).find(item => item.eventPlanId === r.activeEventPlanId) ||
    (workspaceData.eventPlans || [])
      .filter(item => item.requestId === r.requestId)
      .sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
  const organizerRole = currentUser.role === 'organizer';
  const timeline = [
    ['Request sent', true],
    ['Organizer review', !['submitted', 'pending'].includes(r.status)],
    [
      'Budget and date agreed',
      ['planning', 'plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status),
    ],
    [
      'Event plan submitted',
      ['plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status),
    ],
    ['Plan approved', ['confirmed', 'approved', 'completed'].includes(r.status)],
    ['Ongoing event', ['confirmed', 'approved', 'completed'].includes(r.status)],
    ['Event completed', r.status === 'completed'],
  ];
  const currentChange = [...(r.negotiations || [])]
    .reverse()
    .find(item => item.action === 'changes_requested');
  const pendingCounteroffer = [...(r.negotiations || [])]
    .reverse()
    .find(item => item.action === 'counteroffer');
  const plans = (workspaceData.eventPlans || [])
    .filter(item => item.requestId === r.requestId)
    .sort((a, b) => (a.revision || 0) - (b.revision || 0));
  const organizerActions = ['submitted', 'pending', 'under_review', 'info_requested'].includes(
    r.status
  ) ? (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        marginTop: '16px',
      }}
    >
      <button
        className="btn btn-success w-full"
        onClick={() => portalActions.onAcceptWorkflowRequest(r.id)}
      >
        Accept
      </button>
      <button
        className="btn btn-danger w-full"
        onClick={() => portalActions.onOpenWorkflowRejectModal(r.id)}
      >
        Reject
      </button>
    </div>
  ) : r.status === 'counteroffer_received' ? (
    <div
      style={{
        display: 'flex',
        gap: '10px',
        marginTop: '16px',
      }}
    >
      <button
        className="btn btn-success w-full"
        onClick={() => portalActions.onAcceptWorkflowCounteroffer(r.id)}
      >
        Accept Counteroffer
      </button>
      <button
        className="btn btn-danger w-full"
        onClick={() => portalActions.onOpenWorkflowRejectModal(r.id)}
      >
        Reject / Propose Changes
      </button>
    </div>
  ) : ['planning', 'plan_revision_requested'].includes(r.status) ? (
    <button
      className="btn btn-primary w-full"
      style={{
        marginTop: '16px',
      }}
      onClick={() => portalActions.onOpenWorkflowPlanModal(r.id)}
    >
      {r.status === 'plan_revision_requested' ? 'Edit and Resubmit Plan' : 'Create Event Plan'}
    </button>
  ) : (
    ''
  );
  const clientActions =
    r.status === 'changes_requested' ? (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}
      >
        <button
          className="btn btn-success"
          onClick={() => portalActions.onRespondToWorkflowChanges(r.id, 'accept_changes')}
        >
          Accept Changes
        </button>
        <button
          className="btn btn-danger"
          onClick={() => portalActions.onRespondToWorkflowChanges(r.id, 'reject_changes')}
        >
          Reject Changes
        </button>
        <button
          className="btn btn-primary"
          onClick={() => portalActions.onOpenWorkflowCounterofferModal(r.id)}
        >
          Send Counteroffer
        </button>
      </div>
    ) : r.status === 'plan_submitted' && plan?.approvalStatus === 'pending' ? (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}
      >
        <button
          className="btn btn-success"
          onClick={() => portalActions.onReviewWorkflowPlan(plan.eventPlanId, 'approved', r.id)}
        >
          Accept Plan
        </button>
        <button
          className="btn btn-primary"
          onClick={() => portalActions.onOpenWorkflowPlanRevisionModal(plan.eventPlanId, r.id)}
        >
          Request New Plan
        </button>
      </div>
    ) : (
      ''
    );
  const negotiationHtml = (r.negotiations || []).map((item, index) => (
    <div
      style={{
        padding: '10px',
        borderLeft: '3px solid var(--accent)',
        background: 'var(--surface2)',
        borderRadius: '6px',
        marginTop: '8px',
      }}
      key={
        item?.id ??
        item?.eventReportId ??
        item?.requestId ??
        item?.registrationId ??
        item?.ticketId ??
        item?.eventId ??
        item?.reportId ??
        item?.paymentId ??
        item?.refundId ??
        item?.notificationId ??
        item?.label ??
        item?.fileName ??
        index
      }
    >
      <strong>{String(item.action || '').replaceAll('_', ' ')}</strong>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text2)',
          marginTop: '4px',
        }}
      >
        {item.reason}
        {item.budget ? ` · Budget ₹${Number(item.budget).toLocaleString()}` : ''}
        {item.eventDate ? ` · Date ${item.eventDate}` : ''}
      </div>
    </div>
  ));
  const planHtml = plan ? (
    <div
      style={{
        marginTop: '12px',
        padding: '14px',
        background: 'var(--surface2)',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <strong>
          {plan.title} · Revision {plan.revision || 1}
        </strong>
        <span
          className={`badge badge-${
            plan.approvalStatus === 'approved'
              ? 'green'
              : plan.approvalStatus === 'revision_requested'
              ? 'yellow'
              : 'blue'
          }`}
        >
          {String(plan.approvalStatus || 'pending').replaceAll('_', ' ')}
        </span>
      </div>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text2)',
          lineHeight: '1.6',
        }}
      >
        {plan.description}
      </p>
      <div className="info-row">
        <span className="info-label">Budget</span>
        <span className="info-value">₹{Number(plan.budget || 0).toLocaleString()}</span>
      </div>
      <div
        style={{
          marginTop: '12px',
          padding: '14px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <strong>Event plan document</strong>
        {plan.documentFileName ? (
          <>
            <div
              style={{
                marginTop: '6px',
                color: 'var(--text2)',
              }}
            >
              {plan.documentName || 'Event plan PDF'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  portalActions.onOpenEventPlanPdf(
                    plan.eventPlanId,
                    encodeURIComponent(plan.documentName || 'event-plan.pdf'),
                    true
                  )
                }
              >
                View PDF
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  portalActions.onOpenEventPlanPdf(
                    plan.eventPlanId,
                    encodeURIComponent(plan.documentName || 'event-plan.pdf'),
                    false
                  )
                }
              >
                Download PDF
              </button>
            </div>
          </>
        ) : (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text3)',
            }}
          >
            No PDF was attached to this plan.
          </p>
        )}
      </div>
      {plan.revisionReason ? (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--yellow)',
            marginTop: '8px',
          }}
        >
          Requested revision: {plan.revisionReason}
        </div>
      ) : (
        ''
      )}
      {plans.length > 1 ? (
        <details
          style={{
            marginTop: '10px',
          }}
        >
          <summary>Plan revision history ({plans.length})</summary>
          {plans.map((item, index) => (
            <div
              style={{
                fontSize: '12px',
                padding: '6px 0',
                borderBottom: '1px solid var(--border2)',
              }}
              key={item?.title ?? index}
            >
              Revision {item.revision || 1}: {item.title} —{' '}
              {String(item.approvalStatus).replaceAll('_', ' ')}
            </div>
          ))}
        </details>
      ) : (
        ''
      )}
    </div>
  ) : (
    <p
      style={{
        color: 'var(--text3)',
        fontSize: '13px',
      }}
    >
      The organizer has not submitted an event plan yet.
    </p>
  );
  const eventId = r.eventId;
  const event =
    eventId &&
    workspaceData.events.find(item => String(item.eventId || item.id) === String(eventId));
  const completionReport = (workspaceData.eventCompletionReports || []).find(
    item => item.eventId === eventId
  );
  const isPaid = r.paymentStatus === 'fully_paid';
  const isDepositPaid = r.paymentStatus === 'deposit_paid';
  const eventDatePassed = new Date(`${r.eventDate || r.date}T23:59:59`) <= new Date();
  const reportPhotos = (completionReport?.photos || []).map((photo, index) => (
    <button
      className="btn btn-ghost btn-xs"
      onClick={() =>
        portalActions.onOpenEventCompletionPhoto(eventId, encodeURIComponent(photo.fileName))
      }
      key={photo?.fileName ?? index}
    >
      View {photo.originalName}
    </button>
  ));
  const completionReportHtml = completionReport ? (
    <div
      style={{
        marginTop: '16px',
        padding: '16px',
        border: '1px solid var(--border)',
        borderRadius: '10px',
      }}
    >
      <h3
        style={{
          margin: '0 0 10px',
        }}
      >
        Event Completion Report
      </h3>
      <div className="info-row">
        <span className="info-label">Event</span>
        <span className="info-value">
          {completionReport.eventName} · {completionReport.eventDate}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">Venue</span>
        <span className="info-value">{completionReport.venue || '—'}</span>
      </div>
      <div
        style={{
          marginTop: '10px',
        }}
      >
        <strong>Services provided</strong>
        <p
          style={{
            whiteSpace: 'pre-wrap',
            color: 'var(--text2)',
          }}
        >
          {completionReport.servicesProvided}
        </p>
      </div>
      <div
        style={{
          marginTop: '10px',
        }}
      >
        <strong>Expenses</strong>
        <p
          style={{
            whiteSpace: 'pre-wrap',
            color: 'var(--text2)',
          }}
        >
          {completionReport.expenses}
        </p>
      </div>
      <div
        style={{
          marginTop: '10px',
        }}
      >
        <strong>Completion notes</strong>
        <p
          style={{
            whiteSpace: 'pre-wrap',
            color: 'var(--text2)',
          }}
        >
          {completionReport.completionNotes}
        </p>
      </div>
      {reportPhotos ? (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          <strong>Photos</strong>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '6px',
            }}
          >
            {reportPhotos}
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  ) : (
    ''
  );
  const lifecycleActions =
    event?.status === 'ongoing' ? (
      isPaid ? (
        eventDatePassed ? (
          <button
            className="btn btn-primary"
            style={{
              marginTop: '10px',
            }}
            onClick={() => portalActions.onCompleteWorkflowEvent(eventId, r.id)}
          >
            Mark Event as Completed
          </button>
        ) : (
          <p
            style={{
              marginTop: '10px',
              color: 'var(--text3)',
            }}
          >
            Completion is available after the event date.
          </p>
        )
      ) : (
        <p
          style={{
            marginTop: '10px',
            color: 'var(--yellow)',
          }}
        >
          {isDepositPaid
            ? 'Deposit received. The remaining balance must be paid before the event can be marked completed.'
            : 'The client must complete full payment before the event can be marked completed.'}
        </p>
      )
    ) : (
      ''
    );
  const completionReportAction =
    event?.status === 'completed' && !completionReport ? (
      <button
        className="btn btn-primary"
        style={{
          marginTop: '12px',
        }}
        onClick={() => portalActions.onOpenCompletionReportModal(eventId, r.id, r.title)}
      >
        Create Event Completion Report
      </button>
    ) : (
      ''
    );
  const lifecycleHtml =
    eventId && event ? (
      <section
        style={{
          marginTop: '18px',
          padding: '16px',
          background: 'var(--surface2)',
          borderRadius: '10px',
        }}
      >
        <h3
          style={{
            margin: '0 0 10px',
          }}
        >
          Ongoing Event Workflow
        </h3>
        <div className="info-row">
          <span className="info-label">Event status</span>
          <span className="info-value">{event.status}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Payment status</span>
          <span
            className="info-value"
            style={{
              color: isPaid ? 'var(--green)' : isDepositPaid ? 'var(--blue)' : 'var(--yellow)',
            }}
          >
            {isPaid ? 'Paid' : isDepositPaid ? 'Deposit Paid' : 'Unpaid'}
          </span>
        </div>
        {lifecycleActions}
        {completionReportAction}
        {completionReportHtml}
        <WorkflowFileReports
          eventFileReports={portalContext.DB.eventFileReports}
          onDownloadWorkflowEventReport={portalContext.actions.onDownloadWorkflowEventReport}
          eventId={eventId}
        />
        <WorkflowCancellation
          workflowMoney={portalContext.workflowMoney}
          workflowPolicyDate={portalContext.workflowPolicyDate}
          cancellation={r.cancellation || event.cancellation}
        />
      </section>
    ) : (
      ''
    );
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => portalActions.onNavigate(_workflowReturnPage)}
          >
            ← Back to{' '}
            {_workflowReturnPage === 'my-events'
              ? 'Events'
              : _workflowReturnPage === 'ongoing-events'
              ? 'Ongoing Events'
              : _workflowReturnPage === 'completed-events'
              ? 'Completed Events'
              : _workflowReturnPage === 'event-requests'
              ? 'Event Requests'
              : _workflowReturnPage === 'dashboard'
              ? 'Dashboard'
              : 'Request Status'}
          </button>
          <div
            className="page-title"
            style={{
              marginTop: '12px',
            }}
          >
            {r.title}
          </div>
          <div className="page-sub">
            Request details, workflow progress, negotiation, and event plan
          </div>
        </div>
      </div>
      <div
        className="card"
        style={{
          maxWidth: '1000px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span
            className={`badge badge-${reqBadge(r.status)}`}
            style={{
              textTransform: 'capitalize',
            }}
          >
            {String(r.status).replaceAll('_', ' ')}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text3)',
            }}
          >
            Request ID: {r.requestId}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            margin: '16px 0',
          }}
        >
          {timeline.map(([label, complete]) => (
            <div
              style={{
                flex: '1',
                minWidth: '105px',
                padding: '8px',
                borderRadius: '8px',
                background: complete ? 'var(--accent-dim)' : 'var(--surface2)',
                color: complete ? 'var(--accent)' : 'var(--text3)',
                fontSize: '11px',
                fontWeight: '600',
              }}
              key={label}
            >
              {complete ? '✓ ' : '○ '}
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}
        >
          <div className="info-row">
            <span className="info-label">Event date</span>
            <span className="info-value">{r.eventDate || r.date}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Budget</span>
            <span className="info-value">₹{Number(r.budget || 0).toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Ticket price per attendee</span>
            <span className="info-value">
              {Number(r.ticketPrice || 0) === 0
                ? 'Free'
                : '₹' + Number(r.ticketPrice).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Event access</span>
            <span className="info-value">
              {r.visibility === 'private'
                ? 'Private — approval before payment'
                : 'Public — direct registration'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Guests</span>
            <span className="info-value">{r.capacity || r.guests}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Event type</span>
            <span className="info-value">{r.eventType || r.type}</span>
          </div>
        </div>
        <div
          style={{
            margin: '12px 0',
          }}
        >
          <strong>Event details</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
              lineHeight: '1.6',
            }}
          >
            {r.requirements || r.desc || '—'}
          </p>
        </div>
        {r.status === 'rejected' && r.rejectionReason ? (
          <div
            style={{
              padding: '12px',
              background: 'var(--red-dim)',
              margin: '12px 0',
            }}
          >
            <strong>Reason for declining</strong>
            <p
              style={{
                margin: '6px 0 0',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {r.rejectionReason}
            </p>
          </div>
        ) : (
          ''
        )}
        {currentChange ? (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(245,158,11,.1)',
              margin: '12px 0',
            }}
          >
            <strong>Organizer requested changes</strong>
            <div
              style={{
                fontSize: '13px',
                marginTop: '5px',
              }}
            >
              {currentChange.reason}
            </div>
            {currentChange.budget ? (
              <div>Proposed budget: ₹{Number(currentChange.budget).toLocaleString()}</div>
            ) : (
              ''
            )}
            {currentChange.eventDate ? <div>Proposed date: {currentChange.eventDate}</div> : ''}
          </div>
        ) : (
          ''
        )}
        {r.status === 'counteroffer_received' && pendingCounteroffer ? (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(124,111,247,.1)',
              margin: '12px 0',
            }}
          >
            <strong>Client counteroffer — review proposed event details</strong>
            {pendingCounteroffer.reason ? (
              <div
                style={{
                  fontSize: '13px',
                  marginTop: '5px',
                }}
              >
                {pendingCounteroffer.reason}
              </div>
            ) : (
              ''
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '8px',
                fontSize: '13px',
              }}
            >
              {pendingCounteroffer.eventName ? (
                <div>
                  <strong>Event:</strong> {pendingCounteroffer.eventName}
                </div>
              ) : (
                ''
              )}
              {pendingCounteroffer.eventType ? (
                <div>
                  <strong>Type:</strong> {pendingCounteroffer.eventType}
                </div>
              ) : (
                ''
              )}
              {pendingCounteroffer.eventDate ? (
                <div>
                  <strong>Date:</strong> {pendingCounteroffer.eventDate}
                </div>
              ) : (
                ''
              )}
              {pendingCounteroffer.budget ? (
                <div>
                  <strong>Budget:</strong> ₹{Number(pendingCounteroffer.budget).toLocaleString()}
                </div>
              ) : (
                ''
              )}
              {pendingCounteroffer.capacity !== undefined ? (
                <div>
                  <strong>Guests:</strong> {pendingCounteroffer.capacity}
                </div>
              ) : (
                ''
              )}
              {pendingCounteroffer.venue !== undefined ? (
                <div>
                  <strong>Venue:</strong> {pendingCounteroffer.venue || 'Not specified'}
                </div>
              ) : (
                ''
              )}
            </div>
            {pendingCounteroffer.requirements !== undefined ? (
              <div
                style={{
                  marginTop: '8px',
                }}
              >
                <strong>Requirements:</strong>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {pendingCounteroffer.requirements || 'Not specified'}
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        ) : (
          ''
        )}
        <div
          style={{
            marginTop: '16px',
          }}
        >
          <strong>Event plan</strong>
          {planHtml}
        </div>
        <WorkflowEventPolicy
          onOpenWorkflowPolicyDocument={portalContext.actions.onOpenWorkflowPolicyDocument}
          workflowPolicyDocuments={portalContext.workflowPolicyDocuments}
          policy={r.policySnapshot || workflowEventPolicy}
        />
        <p className="small">
          Client acknowledgement: {workflowPolicyDate(r.clientPolicyAcceptedAt)}
          <br />
          Organizer acknowledgement: {workflowPolicyDate(r.organizerPolicyAcceptedAt)}
        </p>
        {organizerRole ? organizerActions : clientActions}
        {lifecycleHtml}
        {negotiationHtml ? (
          <div
            style={{
              marginTop: '18px',
            }}
          >
            <strong>Negotiation history</strong>
            {negotiationHtml}
          </div>
        ) : (
          ''
        )}
        <div
          style={{
            marginTop: '18px',
          }}
        >
          <strong>Progress history</strong>
          {listOrEmpty(
            (r.auditHistory || [])
              .slice()
              .reverse()
              .map(entry => (
                <div
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border2)',
                    fontSize: '12px',
                  }}
                  key={entry.id ?? JSON.stringify([entry.timestamp, entry.action, entry.performedBy, entry.role, entry.details])}
                >
                  <strong>{entry.action}</strong>
                  <div
                    style={{
                      color: 'var(--text3)',
                    }}
                  >
                    {entry.timestamp ? String(entry.timestamp).replace('T', ' ').slice(0, 16) : ''}{' '}
                    · {entry.role}
                  </div>
                </div>
              )),
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text3)',
              }}
            >
              No workflow actions yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
