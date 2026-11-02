import { useClientContext } from '../context/ClientContext.jsx';
import OrganizerReviewForm from '../components/OrganizerReviewForm.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
import {
  WorkflowCancellation,
  WorkflowEventPolicy,
  WorkflowFileReports,
} from '../components/WorkflowDetails.jsx';
export default function RequestDetailsPage({ id }) {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    _workflowReturnPage,
    getClientAcceptedProposal,
    getClientBookingAmounts,
    isClientOwner,
    reqBadge,
    workflowEventPolicy,
    workflowPolicyDate,
  } = portalContext;
  const r = workspaceData.eventRequests.find(
    request =>
      String(request.id) === String(id) ||
      String(request.requestId) === String(id) ||
      (request.eventId && String(request.eventId) === String(id))
  );
  if (r && currentUser && currentUser.role === 'client' && !isClientOwner(r, currentUser)) {
    return (
      <div
        className="alert alert-danger"
        style={{
          margin: '24px 0',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <strong>Access Denied:</strong> You are not authorized to view the details of this event
        request.
        <br />
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
  const isNegotiating =
    ['counteroffer_received', 'changes_requested', 'plan_revision_requested'].includes(r.status) ||
    (r.negotiations && r.negotiations.length > 0);
  const isAccepted =
    ['awaiting_client', 'confirmed', 'completed'].includes(r.status) ||
    (r.proposals && r.proposals.some(proposal => proposal.status === 'accepted'));
  const isPaymentPending =
    ['awaiting_client'].includes(r.status) ||
    r.paymentStatus === 'deposit_pending' ||
    r.paymentStatus === 'deposit_paid';
  const isConfirmed = ['confirmed', 'completed'].includes(r.status);
  const isCompleted = r.status === 'completed';
  const timeline = [
    ['1. Submitted', true],
    ['2. Under Review', !['submitted', 'pending'].includes(r.status)],
    [
      '3. Proposal Sent',
      ['proposal_sent', 'planning', 'awaiting_client', 'confirmed', 'completed'].includes(
        r.status
      ) ||
        (r.proposals && r.proposals.length > 0),
    ],
    ['4. Negotiation', isNegotiating],
    ['5. Accepted', isAccepted],
    ['6. Payment Pending', isPaymentPending || isConfirmed],
    ['7. Confirmed', isConfirmed],
    ['8. Completed', isCompleted],
  ];
  const currentChange = [...(r.negotiations || [])]
    .reverse()
    .find(item => item.action === 'changes_requested');
  const plans = (workspaceData.eventPlans || [])
    .filter(item => item.requestId === r.requestId)
    .sort((a, b) => (b.revision || 0) - (a.revision || 0));
  const latestProposal =
    r.proposals && r.proposals.length > 0 ? r.proposals[r.proposals.length - 1] : null;
  const agreedProposal = getClientAcceptedProposal(r) || latestProposal;
  const planDeposit = Number(
    agreedProposal?.depositRequired ?? Math.round(Number(plan?.budget || r.budget || 0) * 0.3)
  );
  const planBalance = Math.max(
    0,
    Number(plan?.budget || agreedProposal?.amount || r.budget || 0) - planDeposit
  );
  const organizer =
    (workspaceData.organizers || []).find(
      item => String(item.organizerId || item.id) === String(r.organizerId || r.organizer)
    ) ||
    (workspaceData.users || []).find(
      item => String(item.id || item.userId) === String(r.organizerId || r.organizer)
    );
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
  const clientCancelBtn =
    currentUser.role === 'client' &&
    !['cancelled', 'withdrawn', 'rejected', 'completed'].includes(r.status) &&
    !r.eventId ? (
      <button
        className="btn btn-danger btn-sm"
        onClick={() => portalActions.onOpenClientCancelRequestModal(r.id)}
      >
        Cancel Request
      </button>
    ) : (
      ''
    );
  const clientActions = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'].includes(
    r.status
  ) ? (
    ''
  ) : r.status === 'changes_requested' ? (
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
      {clientCancelBtn}
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
        onClick={() => portalActions.onOpenWorkflowPlanAcceptanceModal(plan.eventPlanId, r.id)}
      >
        Accept Plan
      </button>
      <button
        className="btn btn-primary"
        onClick={() => portalActions.onOpenWorkflowPlanRevisionModal(plan.eventPlanId, r.id)}
      >
        Request Changes
      </button>
      <button
        className="btn btn-danger"
        onClick={() => portalActions.onOpenWorkflowPlanRejectionModal(plan.eventPlanId, r.id)}
      >
        Reject Plan
      </button>
    </div>
  ) : (r.status === 'awaiting_client' ||
      (r.paymentStatus === 'deposit_pending' &&
        (r.proposals || []).some(proposal => proposal.status === 'accepted'))) &&
    (plan?.approvalStatus === 'approved' ||
      (r.proposals || []).some(proposal => proposal.status === 'accepted')) ? (
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
        onClick={() => portalActions.onOpenClientPaymentModal(r.id)}
      >
        Proceed to Payment &amp; Confirmation
      </button>
      {clientCancelBtn}
    </div>
  ) : clientCancelBtn ? (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '16px',
      }}
    >
      {clientCancelBtn}
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
  const planDocFileName = plan?.documentFileName || latestProposal?.documentFileName;
  const planDocName = plan?.documentName || latestProposal?.documentName || planDocFileName;
  const planDocType = plan?.documentType || latestProposal?.documentType || 'application/pdf';
  const planDocSize = plan?.documentSize || latestProposal?.documentSize;
  const planDocDate =
    plan?.uploadedAt || latestProposal?.uploadedAt || plan?.createdAt || latestProposal?.sentAt;
  const planDocUploader = plan?.uploaderName || latestProposal?.uploaderName || 'Organizer';
  const planTargetId = plan?.eventPlanId || r.requestId || r.id;
  const planDocCard = planDocFileName ? (
    <div
      style={{
        marginTop: '12px',
        padding: '14px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: 'var(--surface)',
      }}
    >
      <div
        style={{
          fontWeight: '700',
          fontSize: '13.5px',
          color: 'var(--text)',
        }}
      >
        📎 {planDocName || 'event-plan.pdf'}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text2)',
          marginTop: '4px',
        }}
      >
        <span>{planDocType}</span>
        {planDocSize ? ` · ${(Number(planDocSize) / 1024).toFixed(1)} KB` : ''} ·{' '}
        <span>Uploaded {planDocDate ? new Date(planDocDate).toLocaleString() : 'Recently'}</span> ·{' '}
        <span>Revision {plan?.revision || latestProposal?.version || 1}</span> ·{' '}
        <span>By {planDocUploader}</span>
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
              planTargetId,
              encodeURIComponent(planDocName || 'event-plan.pdf'),
              true,
              ...(latestProposal?.version ? [latestProposal.version] : [])
            )
          }
        >
          👁️ View PDF / Preview
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            portalActions.onOpenEventPlanPdf(
              planTargetId,
              encodeURIComponent(planDocName || 'event-plan.pdf'),
              false,
              ...(latestProposal?.version ? [latestProposal.version] : [])
            )
          }
        >
          ⬇️ Download PDF
        </button>
      </div>
    </div>
  ) : (
    <div
      style={{
        marginTop: '12px',
        padding: '12px 14px',
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        background: 'var(--surface2)',
      }}
    >
      <div
        style={{
          fontSize: '12.5px',
          color: 'var(--text2)',
        }}
      >
        📝 <strong>Text-only plan proposal</strong> — no file attached by organizer. Proposal
        deliverables and terms are detailed above.
      </div>
    </div>
  );
  const planRevisionHistoryHtml =
    plans.length > 1 ? (
      <details
        style={{
          marginTop: '12px',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Plan revision history ({plans.length} versions, newest first)
        </summary>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {plans.map((item, index) => (
            <div
              style={{
                fontSize: '12px',
                padding: '8px 10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
              }}
              key={item?.title ?? index}
            >
              <div>
                <strong>Revision {item.revision || 1}:</strong> {item.title} —{' '}
                <span
                  className={`badge badge-${
                    item.approvalStatus === 'approved'
                      ? 'green'
                      : item.approvalStatus === 'revision_requested'
                      ? 'yellow'
                      : 'blue'
                  }`}
                >
                  {String(item.approvalStatus || 'pending').replaceAll('_', ' ')}
                </span>
                {item.uploadedAt || item.createdAt ? (
                  <div
                    className="small"
                    style={{
                      color: 'var(--text3)',
                    }}
                  >
                    Uploaded {new Date(item.uploadedAt || item.createdAt).toLocaleString()}
                  </div>
                ) : (
                  ''
                )}
              </div>
              {item.documentFileName ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                  }}
                >
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      portalActions.onOpenEventPlanPdf(
                        item.eventPlanId,
                        encodeURIComponent(item.documentName || item.documentFileName),
                        true
                      )
                    }
                  >
                    Preview
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      portalActions.onOpenEventPlanPdf(
                        item.eventPlanId,
                        encodeURIComponent(item.documentName || item.documentFileName),
                        false
                      )
                    }
                  >
                    Download
                  </button>
                </div>
              ) : (
                ''
              )}
            </div>
          ))}
        </div>
      </details>
    ) : r.proposals && r.proposals.length > 1 ? (
      <details
        style={{
          marginTop: '12px',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          Proposal version history ({r.proposals.length} versions, newest first)
        </summary>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          {[...r.proposals]
            .sort((proposal, b) => (b.version || 0) - (proposal.version || 0))
            .map(proposal => (
              <div
                style={{
                  fontSize: '12px',
                  padding: '8px 10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
                key={proposal.proposalId ?? proposal.id ?? proposal.version}
              >
                <div>
                  <strong>Version {proposal.version || 1}:</strong> ₹
                  {Number(proposal.amount || 0).toLocaleString()} —{' '}
                  <span className="badge badge-gray">{proposal.status || 'draft'}</span>
                  {proposal.uploadedAt || proposal.sentAt ? (
                    <div
                      className="small"
                      style={{
                        color: 'var(--text3)',
                      }}
                    >
                      {new Date(proposal.uploadedAt || proposal.sentAt).toLocaleString()}
                    </div>
                  ) : (
                    ''
                  )}
                </div>
                {proposal.documentFileName || proposal.documentName ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() =>
                        portalActions.onOpenEventPlanPdf(
                          r.requestId || r.id,
                          encodeURIComponent(proposal.documentName || proposal.documentFileName),
                          true,
                          proposal.version
                        )
                      }
                    >
                      Preview
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() =>
                        portalActions.onOpenEventPlanPdf(
                          r.requestId || r.id,
                          encodeURIComponent(proposal.documentName || proposal.documentFileName),
                          false,
                          proposal.version
                        )
                      }
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  ''
                )}
              </div>
            ))}
        </div>
      </details>
    ) : (
      ''
    );
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
        <span className="info-label">Total proposal amount</span>
        <span className="info-value">₹{Number(plan.budget || 0).toLocaleString()}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Advance deposit</span>
        <span className="info-value">₹{planDeposit.toLocaleString()}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Remaining balance</span>
        <span className="info-value">₹{planBalance.toLocaleString()}</span>
      </div>
      {plan.budgetBreakdown ? (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          <strong>Itemized cost breakdown</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
            }}
          >
            {plan.budgetBreakdown}
          </p>
        </div>
      ) : (
        ''
      )}
      {plan.services ? (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          <strong>Proposed services &amp; deliverables</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
            }}
          >
            {plan.services}
          </p>
        </div>
      ) : (
        ''
      )}
      {plan.arrangements ? (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          <strong>Venue &amp; execution arrangements</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
            }}
          >
            {plan.arrangements}
          </p>
        </div>
      ) : (
        ''
      )}
      {plan.schedule ? (
        <div
          style={{
            marginTop: '10px',
          }}
        >
          <strong>Event schedule &amp; execution timeline</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
            }}
          >
            {plan.schedule}
          </p>
        </div>
      ) : (
        ''
      )}
      <div
        style={{
          marginTop: '10px',
        }}
      >
        <strong>Payment terms</strong>
        <p
          style={{
            color: 'var(--text2)',
          }}
        >
          {agreedProposal?.paymentSchedule ||
            agreedProposal?.paymentTerms ||
            'Advance deposit payable now; remaining balance follows the accepted agreement.'}
        </p>
      </div>
      <div
        style={{
          marginTop: '10px',
        }}
      >
        <strong>Cancellation policy</strong>
        <p
          style={{
            color: 'var(--text2)',
          }}
        >
          {agreedProposal?.cancellationTerms ||
            agreedProposal?.cancellationPolicy ||
            'The event agreement cancellation policy applies.'}
        </p>
      </div>
      <div
        className="small"
        style={{
          color: 'var(--text3)',
          marginTop: '8px',
        }}
      >
        Submitted {workflowPolicyDate(plan.createdAt || plan.uploadedAt)} · Revision{' '}
        {plan.revision || 1}
      </div>
      {planDocCard}
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
      {planRevisionHistoryHtml}
    </div>
  ) : latestProposal ? (
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
        <strong>Event Proposal · Version {latestProposal.version || 1}</strong>
        <span className="badge badge-blue">
          {String(latestProposal.status || 'pending_client').replaceAll('_', ' ')}
        </span>
      </div>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text2)',
          lineHeight: '1.6',
          marginTop: '6px',
        }}
      >
        {latestProposal.eventPlan || latestProposal.terms || 'Event proposal details.'}
      </p>
      <div className="info-row">
        <span className="info-label">Proposed Price</span>
        <span className="info-value">₹{Number(latestProposal.amount || 0).toLocaleString()}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Advance Deposit</span>
        <span className="info-value">
          ₹
          {Number(
            latestProposal.depositRequired || Math.round((latestProposal.amount || 0) * 0.3)
          ).toLocaleString()}
        </span>
      </div>
      {planDocCard}
      {planRevisionHistoryHtml}
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
  const submittedReview = (workspaceData.clientOrganizerReviews || []).find(
    item => item.eventId === eventId
  );
  const isPaid = r.paymentStatus === 'fully_paid';
  const bookingAmounts = getClientBookingAmounts(r, plan);
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
  const reviewHtml =
    completionReport && !submittedReview ? (
      <OrganizerReviewForm
        key={eventId}
        onSubmitReview={review =>
          portalActions.onSubmitClientOrganizerReview(eventId, r.id, review)
        }
      />
    ) : submittedReview ? (
      <div
        style={{
          marginTop: '14px',
          color: 'var(--green)',
          fontWeight: '600',
        }}
      >
        Thank you. Your review has been published to the organizer profile.
      </div>
    ) : (
      ''
    );
  const lifecycleHtml =
    eventId && event && r.status !== 'cancelled' ? (
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
              color: isPaid ? 'var(--green)' : 'var(--yellow)',
            }}
          >
            {isPaid ? 'Paid' : r.paymentStatus === 'deposit_paid' ? 'Deposit Paid' : 'Unpaid'}
          </span>
        </div>
        {event.status === 'ongoing' && !isPaid && bookingAmounts.remainingAmount > 0 ? (
          <div
            style={{
              marginTop: '10px',
            }}
          >
            <strong>Final agreed amount: ₹{bookingAmounts.totalAmount.toLocaleString()}</strong>
            <div
              style={{
                marginTop: '6px',
              }}
            >
              Remaining amount: ₹{bookingAmounts.remainingAmount.toLocaleString()}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '8px',
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => portalActions.onOpenClientPaymentModal(r.id, eventId || '')}
              >
                💳 Pay Remaining Amount
              </button>
            </div>
          </div>
        ) : (
          ''
        )}
        {isPaid ? (
          <div
            style={{
              marginTop: '10px',
            }}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => portalActions.onOpenClientPaymentModal(r.id, eventId || '')}
            >
              📜 View Payment Receipt &amp; Transactions
            </button>
          </div>
        ) : (
          ''
        )}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '14px',
            flexWrap: 'wrap',
          }}
        >
          {event.status === 'ongoing' && currentUser.role === 'client' ? (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => portalActions.onOpenClientCancelRequestModal(r.requestId || r.id)}
            >
              Cancel Event
            </button>
          ) : (
            ''
          )}
        </div>
        {r.eventModifications && r.eventModifications.length > 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid var(--border)',
              marginTop: '14px',
            }}
          >
            <div
              style={{
                fontWeight: '700',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              📝 Event Modifications ({r.eventModifications.length})
            </div>
            {r.eventModifications.map(mod => (
              <div
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontSize: '12px',
                }}
                key={mod.id ?? JSON.stringify([mod.submittedAt, mod.reason, mod.newValues])}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: '600',
                    }}
                  >
                    Requested by {mod.requesterRole === 'client' ? 'Client' : 'Organizer'}
                  </span>
                  <span
                    className={`badge badge-${
                      mod.status === 'approved'
                        ? 'green'
                        : mod.status === 'rejected'
                        ? 'red'
                        : 'yellow'
                    }`}
                  >
                    {mod.status.replace('_', ' ')}
                  </span>
                </div>
                <div
                  style={{
                    color: 'var(--text2)',
                    marginBottom: '4px',
                  }}
                >
                  <strong>Reason:</strong> {mod.reason || '—'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text3)',
                    marginBottom: '6px',
                  }}
                >
                  Date: {mod.newValues?.date || '—'} · Capacity: {mod.newValues?.capacity || '—'} ·
                  Budget: ₹{(mod.newValues?.budget || 0).toLocaleString()}
                </div>
                {mod.status === 'pending_approval' ? (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                    }}
                  >
                    Booked event details are locked.
                  </div>
                ) : (
                  ''
                )}
              </div>
            ))}
          </div>
        ) : (
          ''
        )}
        {r.status !== 'cancelled' ? (
          <WorkflowCancellation
            events={portalContext.DB.events}
            users={portalContext.DB.users}
            user={portalContext.CU}
            workflowMoney={portalContext.workflowMoney}
            workflowPolicyDate={portalContext.workflowPolicyDate}
            cancellation={r.cancellation || event.cancellation}
            request={r}
          />
        ) : (
          ''
        )}
        <WorkflowFileReports
          eventFileReports={portalContext.DB.eventFileReports}
          onDownloadWorkflowEventReport={portalContext.actions.onDownloadWorkflowEventReport}
          eventId={eventId}
        />
        {completionReportHtml}
        {reviewHtml}
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
            {r.status === 'plan_submitted' ? 'Event Plan Review — ' : ''}
            {r.title}
          </div>
          <div className="page-sub">
            Original request details, organizer submission, pricing, terms, attachment, and history
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
          <div className="info-row">
            <span className="info-label">Organizer</span>
            <span className="info-value">
              {organizer?.name ||
                organizer?.businessName ||
                r.organizerName ||
                'Assigned Organizer'}
            </span>
          </div>
        </div>
        {r.status === 'cancelled' ? (
          <WorkflowCancellation
            events={portalContext.DB.events}
            users={portalContext.DB.users}
            user={portalContext.CU}
            workflowMoney={portalContext.workflowMoney}
            workflowPolicyDate={portalContext.workflowPolicyDate}
            cancellation={r.cancellation}
            request={r}
          />
        ) : (
          ''
        )}
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
              borderRadius: '8px',
            }}
          >
            <strong
              style={{
                color: 'var(--red)',
              }}
            >
              ✕ Reason for declining
            </strong>
            <p
              style={{
                margin: '6px 0 0',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {r.rejectionReason}
            </p>
            {r.rejectionComments ? (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '12px',
                  color: 'var(--text2)',
                }}
              >
                <strong>Additional comments:</strong> {r.rejectionComments}
              </p>
            ) : (
              ''
            )}
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
