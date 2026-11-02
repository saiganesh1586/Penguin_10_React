import { useAdminContext } from '../context/AdminContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
export default function EmployeeReportsPage() {
  const portalContext = useAdminContext();
  const portalActions = portalContext.actions;
  const { employeeReportFilter, receivedEmployeeReports } = portalContext;
  const reports = receivedEmployeeReports();
  const open = reports.filter(item => item.report.status !== 'Reviewed').length;
  const visible = reports
    .map((item, index) => ({
      ...item,
      index,
    }))
    .filter(
      item =>
        employeeReportFilter === 'all' ||
        (employeeReportFilter === 'reviewed'
          ? item.report.status === 'Reviewed'
          : item.report.status !== 'Reviewed')
    );
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Employee Reports</div>
          <div className="page-sub">
            Reports submitted by registration, event operations, support, and finance employees.
          </div>
        </div>
      </div>
      <div className="grid-3 mb-20">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            📥
          </div>
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Received Reports</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
            }}
          >
            ◷
          </div>
          <div className="stat-value">{open}</div>
          <div className="stat-label">Awaiting Review</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            ✓
          </div>
          <div className="stat-value">{reports.length - open}</div>
          <div className="stat-label">Reviewed</div>
        </div>
      </div>
      <div className="card">
        <div className="flex justify-between items-center mb-16">
          <div className="h4">Received submissions</div>
          <PortalSelect
            className="form-control"
            style={{
              width: 'auto',
            }}
            aria-label="Filter employee reports"
            onChange={event => portalActions.onSetEmployeeReportFilter(event.currentTarget.value)}
            value={employeeReportFilter}
          >
            <option value="all">All reports</option>
            <option value="open">Awaiting review</option>
            <option value="reviewed">Reviewed</option>
          </PortalSelect>
        </div>
        {visible.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ report, department, index }) => (
                  <tr key={`${department}:${report.id}`}>
                    <td>
                      <strong>{report.title || report.type || 'Untitled report'}</strong>
                      <div className="small">
                        {report.type || report.category || report.id || ''}
                      </div>
                    </td>
                    <td>{report.owner || report.author || 'Employee'}</td>
                    <td>{department}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          report.status === 'Reviewed' ? 'green' : 'purple'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>{report.updated || report.submittedAt || '—'}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => portalActions.onViewEmployeeReport(index)}
                      >
                        View report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No reports in this view</div>
            <div className="empty-desc">Submitted employee reports will appear here.</div>
          </div>
        )}
      </div>
    </>
  );
}
