import { useEffect, useState } from 'react';
export function WorkflowCancellation({
  events,
  users,
  user: currentUser,
  workflowMoney,
  workflowPolicyDate,
  cancellation,
  request = {},
  compact = false,
}) {
  const event = (events || []).find(
    item => request.eventId && String(item.eventId || item.id) === String(request.eventId)
  );
  const record = cancellation || event?.cancellation;
  if (!record && request.status !== 'cancelled') return '';
  const cancellationRecord = record || {};
  const actor = (users || []).find(
    user =>
      cancellationRecord.cancelledBy &&
      String(user.userId || user.id) === String(cancellationRecord.cancelledBy)
  );
  const role = cancellationRecord.cancelledByRole || actor?.role || actor?.userRole;
  const matchesActor = id =>
    id != null &&
    cancellationRecord.cancelledBy != null &&
    String(id) === String(cancellationRecord.cancelledBy);
  const organizer =
    ['organizer', 'event_organizer'].includes(role) ||
    [
      request.organizerUserId,
      request.organizer,
      request.organizerId,
      request.backendOrganizerId,
    ].some(matchesActor);
  const client =
    role === 'client' ||
    [request.clientUserId, request.clientId, request.backendClientId, currentUser?.id].some(
      matchesActor
    );
  const heading = organizer
    ? 'Cancelled by organizer'
    : client
    ? 'Cancelled by you'
    : ['super_admin', 'superuser'].includes(role)
    ? 'Cancelled by administrator'
    : 'Event cancelled';
  const actorName =
    cancellationRecord.cancelledByName ||
    actor?.name ||
    (organizer ? request.organizerName : client ? currentUser?.name : '');
  const reason =
    cancellationRecord.reason ||
    request.cancelReason ||
    request.cancellationReason ||
    event?.cancellationReason ||
    'A cancellation reason was not recorded. Contact the organizer for details.';
  const explanation = cancellationRecord.explanation || request.cancelExplanation;
  const hasAmounts = ['paidAmount', 'cancellationFee', 'refundAmount'].every(
    key =>
      cancellationRecord[key] != null &&
      cancellationRecord[key] !== '' &&
      Number.isFinite(Number(cancellationRecord[key])) &&
      Number(cancellationRecord[key]) >= 0
  );
  const refundAmount = hasAmounts ? Number(cancellationRecord.refundAmount) : null;
  const refundStatus = cancellationRecord.refundStatus || request.refundStatus;
  const simulatedRefund = cancellationRecord.refundSimulated === true;
  const refunded = ['completed', 'refunded'].includes(refundStatus);
  const refundTitle = !hasAmounts
    ? 'Payment and refund details not recorded'
    : refundAmount === 0
    ? Number(cancellationRecord.paidAmount) === 0
      ? 'No payment was taken; no refund is needed.'
      : 'No refund due under the recorded policy'
    : refunded
    ? 'Refund completed'
    : refundStatus === 'pending'
    ? simulatedRefund
      ? 'Simulated refund pending provider confirmation'
      : 'Refund pending review'
    : refundStatus === 'processing'
    ? 'Refund processing'
    : 'Refund due — status not recorded';
  const nextStep = !hasAmounts
    ? 'Contact your organizer for the payment and refund details.'
    : refundAmount === 0
    ? 'There is no refund to wait for.'
    : refunded
    ? 'Your refund is marked as completed. Contact the organizer if you need help checking it.'
    : refundStatus === 'pending'
    ? simulatedRefund
      ? 'This demo refund is simulated and awaiting provider confirmation; no payment has been sent yet.'
      : 'Your refund is recorded and awaiting review. It has not been paid yet. Contact the organizer if you need an update.'
    : 'Contact your organizer for an update on the refund.';
  const policy = request.policySnapshot || event?.policySnapshot;
  const processing =
    refundAmount > 0 && refundStatus === 'pending' && policy?.cancellation?.processingTimeline;
  const feeLabel =
    cancellationRecord.cancellationFeePercent != null &&
    Number.isFinite(Number(cancellationRecord.cancellationFeePercent))
      ? `Cancellation fee (${Number(cancellationRecord.cancellationFeePercent)}%)`
      : 'Cancellation fee';
  return (
    <section
      className={`client-cancellation${compact ? ' client-cancellation-compact' : ''}`}
      aria-label="Cancellation details"
    >
      <div className="client-cancellation-heading">
        <div>
          <h3>{heading}</h3>
          <p>
            {actorName ? `${actorName} &middot; ` : ''}
            {workflowPolicyDate(cancellationRecord.cancelledAt || request.cancelledAt)}
          </p>
        </div>
        <span className="badge badge-red">Booking closed</span>
      </div>
      <div className="client-cancellation-reason">
        <strong>Reason for cancellation</strong>
        <p>{reason}</p>
        {explanation ? <p>{explanation}</p> : ''}
      </div>
      {hasAmounts ? (
        <div className="client-cancellation-amounts">
          <div>
            <span>Amount paid</span>
            <strong>{workflowMoney(cancellationRecord.paidAmount)}</strong>
          </div>
          <div>
            <span>{feeLabel}</span>
            <strong>{workflowMoney(cancellationRecord.cancellationFee)}</strong>
          </div>
          <div>
            <span>
              {organizer &&
              Number(cancellationRecord.cancellationFee) === 0 &&
              refundAmount === Number(cancellationRecord.paidAmount) &&
              refundAmount > 0
                ? 'Full refund due'
                : 'Refund due'}
            </span>
            <strong>{workflowMoney(cancellationRecord.refundAmount)}</strong>
          </div>
        </div>
      ) : (
        ''
      )}
      <ol className="client-cancellation-progress" aria-label="Cancellation progress">
        <li className="complete">Cancellation recorded</li>
        <li className={refunded || refundAmount === 0 ? 'complete' : 'pending'}>{refundTitle}</li>
      </ol>
      <p className="client-cancellation-next">
        <strong>No further booking payments are due.</strong> {nextStep}
        {processing ? (
          <>
            <br />
            Estimated processing after review: {processing}.
          </>
        ) : (
          ''
        )}
      </p>
    </section>
  );
}
export function WorkflowFileReports({ eventFileReports, onDownloadWorkflowEventReport, eventId }) {
  const reports = (eventFileReports || []).filter(
    report => String(report.eventId) === String(eventId)
  );
  return reports.length ? (
    <section
      style={{
        marginTop: '16px',
      }}
    >
      <h3>Reports from the Organizer</h3>
      {reports.map(report => (
        <div
          style={{
            padding: '12px',
            border: '1px solid var(--border)',
            marginTop: '8px',
          }}
          key={
            report.eventReportId ??
            report.id ??
            report.reportId ??
            JSON.stringify([report.eventId, report.documentFileName || report.fileName, report.reportTitle])
          }
        >
          <strong>{report.reportTitle}</strong>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              color: 'var(--text2)',
            }}
          >
            {report.reportDetails}
          </p>
          {report.documentFileName ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDownloadWorkflowEventReport(report.eventReportId)}
            >
              Download {report.documentName}
            </button>
          ) : (
            ''
          )}
        </div>
      ))}
    </section>
  ) : (
    ''
  );
}
export function WorkflowEventPolicy({
  onOpenWorkflowPolicyDocument,
  workflowPolicyDocuments,
  policy,
  checkboxId,
}) {
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    if (policy) workflowPolicyDocuments.set(policy.version, policy);
  }, [policy, workflowPolicyDocuments]);
  useEffect(() => setAgreed(false), [checkboxId, policy?.version]);
  if (!policy)
    return <p role="alert">Event policies could not be loaded. Refresh before continuing.</p>;
  return (
    <section
      style={{
        margin: '16px 0',
        padding: '16px',
        border: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          data-policy-version={policy.version}
          onClick={event =>
            onOpenWorkflowPolicyDocument('policies', event.currentTarget.dataset.policyVersion)
          }
        >
          Event Policies &amp; Rules
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          data-policy-version={policy.version}
          onClick={event =>
            onOpenWorkflowPolicyDocument('terms', event.currentTarget.dataset.policyVersion)
          }
        >
          Terms and Conditions
        </button>
      </div>
      <p
        className="small"
        style={{
          margin: '12px 0 0',
          lineHeight: '1.6',
        }}
      >
        Cancellation requires at least {policy.cancellation.minimumNoticeDays} days' notice. The
        cancellation fee is {policy.cancellation.feePercent}% of the amount actually paid.
      </p>
      <p
        className="small"
        style={{
          margin: '8px 0 0',
        }}
      >
        Policy version: {policy.version}
      </p>
      {checkboxId ? (
        <label
          htmlFor={checkboxId}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginTop: '16px',
            cursor: 'pointer',
          }}
        >
          <input
            id={checkboxId}
            type="checkbox"
            required={true}
            style={{
              width: 'auto',
              marginTop: '4px',
              flexShrink: '0',
            }}
            checked={agreed}
            onChange={event => setAgreed(event.target.checked)}
          />
          <span
            style={{
              fontSize: '13px',
              lineHeight: '1.6',
            }}
          >
            I have read and agree to the Event Rules, Cancellation Policy, and Terms and Conditions.
          </span>
        </label>
      ) : (
        ''
      )}
    </section>
  );
}
