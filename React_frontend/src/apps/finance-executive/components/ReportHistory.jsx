import PortalSelect from '../../../app/PortalSelect.jsx';
export function FinanceReportHistory({
  financeSentPage,
  onFinanceOpenSubmitReport,
  onRenderPage,
  onFinanceSetSentStatus,
  onFinanceViewSentReport,
  onFinanceChangeSentPage,
  financeDate,
  financeSentReports,
  financeSentStatus,
}) {
  const filtered = financeSentReports
    .map((report, index) => ({
      report,
      index,
    }))
    .filter(
      ({ report }) =>
        financeSentStatus === 'all' || report.status.toLowerCase() === financeSentStatus
    );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(financeSentPage, pageCount);
  const shown = filtered.slice((currentPage - 1) * 5, currentPage * 5);
  return (
    <>
      <div className="card finance-send-portal">
        <div className="h4 mb-12">Send this report to Super Admin</div>
        <p className="small muted mb-16">
          Send all records matching the applied filters as a saved report. Review status and
          feedback appear below.
        </p>
        <button className="btn btn-primary" onClick={() => onFinanceOpenSubmitReport()}>
          Send Report to Super Admin
        </button>
      </div>
      <div className="card finance-sent-portal">
        <div className="flex justify-between items-center mb-16">
          <div>
            <div className="h4">Sent Reports</div>
            <p className="small muted">Track delivery and review feedback from Super Admin.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onRenderPage('reports')}>
            Refresh reports
          </button>
        </div>
        <label className="finance-sent-filter">
          Status{' '}
          <PortalSelect
            className="form-control"
            onChange={event => onFinanceSetSentStatus(event.currentTarget.value)}
            value={financeSentStatus}
          >
            <option value="all">All reports</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
          </PortalSelect>
        </label>
        {shown.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Records</th>
                  <th>Sent</th>
                  <th>Status</th>
                  <th>Feedback</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(({ report, index }) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.title}</strong>
                      <div className="small muted">{report.id}</div>
                    </td>
                    <td>{report.reportType}</td>
                    <td>{report.metrics.recordCount}</td>
                    <td>{financeDate(report.createdAt)}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          report.status === 'Reviewed' ? 'green' : 'purple'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>{report.feedback || 'Awaiting review'}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => onFinanceViewSentReport(index)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No submitted finance reports found.</div>
        )}
        <div className="finance-sent-pagination">
          <span>
            {filtered.length} reports · Page {currentPage} of {pageCount}
          </span>
          <div>
            <button
              className="btn btn-ghost btn-sm"
              {...(currentPage <= 1
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => onFinanceChangeSentPage(-1)}
            >
              Previous
            </button>
            <button
              className="btn btn-ghost btn-sm"
              {...(currentPage >= pageCount
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => onFinanceChangeSentPage(1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
