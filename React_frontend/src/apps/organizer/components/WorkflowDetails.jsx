import { useEffect, useState } from 'react';
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
      {reports.map((report, index) => (
        <div
          style={{
            padding: '12px',
            border: '1px solid var(--border)',
            marginTop: '8px',
          }}
          key={
            report?.id ??
            report?.eventReportId ??
            report?.requestId ??
            report?.registrationId ??
            report?.ticketId ??
            report?.eventId ??
            report?.reportId ??
            report?.paymentId ??
            report?.refundId ??
            report?.notificationId ??
            report?.label ??
            report?.fileName ??
            index
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
export function WorkflowCancellation({ workflowMoney, workflowPolicyDate, cancellation }) {
  return cancellation ? (
    <section
      style={{
        marginTop: '16px',
        padding: '16px',
        border: '1px solid var(--border)',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
        }}
      >
        Event cancelled
      </h3>
      <p
        style={{
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {cancellation.reason}
      </p>
      <div className="info-row">
        <span className="info-label">Amount paid</span>
        <span>{workflowMoney(cancellation.paidAmount)}</span>
      </div>
      <div className="info-row">
        <span className="info-label">
          Cancellation fee ({cancellation.cancellationFeePercent}%)
        </span>
        <span>{workflowMoney(cancellation.cancellationFee)}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Refund due</span>
        <strong>{workflowMoney(cancellation.refundAmount)}</strong>
      </div>
      <p className="small">
        {cancellation.refundStatus === 'pending'
          ? cancellation.refundSimulated
            ? 'Simulated refund pending provider confirmation.'
            : 'Refund pending review.'
          : 'No payment was taken; no refund is needed.'}{' '}
        Cancelled: {workflowPolicyDate(cancellation.cancelledAt)}
      </p>
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
