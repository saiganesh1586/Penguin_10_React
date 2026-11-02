import FilterInput from '../../../app/FilterInput.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
export function OperationalReports({
  operationalReports,
  onOpenSubmitOperationalReportModal,
  onSubmitOperationalReport,
  operationalReportBadge,
}) {
  const reports = operationalReports || [];
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Reports</div>
          <div className="page-sub">
            Submit support, finance, and combined operational reports to Super Admin.
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-primary" onClick={() => onOpenSubmitOperationalReportModal()}>
            📤 Submit Report
          </button>
        </div>
      </div>
      <div className="grid-3 mb-20">
        {['Support Report', 'Finance Report', 'Combined Operational Report'].map((type, index) => (
          <div
            className="stat-card"
            key={
              type?.id ??
              type?.requestId ??
              type?.eventId ??
              type?.registrationId ??
              type?.reportId ??
              type?.label ??
              (typeof type === 'string' || typeof type === 'number' ? type : index)
            }
          >
            <div className="stat-icon">
              {type === 'Support Report' ? '📩' : type === 'Finance Report' ? '💳' : '📊'}
            </div>
            <div className="stat-value">{reports.filter(item => item.type === type).length}</div>
            <div className="stat-label">{type}s</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="h4 mb-12">Operational Reports</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((item, index) => (
                <tr key={item?.id ?? item?.title ?? index}>
                  <td>
                    <strong>{item.title}</strong>
                  </td>
                  <td>{item.type}</td>
                  <td>{item.owner}</td>
                  <td>
                    <span className={`badge badge-${operationalReportBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.updated}</td>
                  <td>
                    {item.status === 'Draft' ? (
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => onSubmitOperationalReport(item.id)}
                      >
                        Submit
                      </button>
                    ) : (
                      <span className="small">Tracked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export function EventOperationsReports({
  eventOpsReports,
  onOpenCreateEventOpsReportModal,
  onRefreshEorPage,
  onViewEventOpsReportModal,
  onSubmitDraftEventOpsReport,
  eventOpsReportBadge,
}) {
  const reports = eventOpsReports || [];
  const searchQuery = (sessionStorage.getItem('eor_search') || '').toLowerCase();
  const typeFilter = sessionStorage.getItem('eor_type') || '';
  const statusFilter = sessionStorage.getItem('eor_status') || '';
  const perfCount = reports.filter(report => report.type === 'Event Performance Report').length;
  const opsCount = reports.filter(report => report.type === 'Event Operations Report').length;
  const actCount = reports.filter(report => report.type === 'Event Activity Report').length;
  const submittedCount = reports.filter(report => report.status === 'Submitted').length;
  const pendingReviewCount = reports.filter(
    report => report.status === 'Pending Review' || report.status === 'Pending'
  ).length;
  const reviewedCount = reports.filter(report => report.status === 'Reviewed').length;
  const filtered = reports.filter(report => {
    const titleStr = (report.title || '').toLowerCase();
    const idStr = (report.id || '').toLowerCase();
    const scopeStr = (report.scope || '').toLowerCase();
    const matchesQuery =
      !searchQuery ||
      titleStr.includes(searchQuery) ||
      idStr.includes(searchQuery) ||
      scopeStr.includes(searchQuery);
    const matchesType = !typeFilter || report.type === typeFilter;
    const matchesStatus =
      !statusFilter ||
      report.status === statusFilter ||
      (statusFilter === 'Pending Review' && report.status === 'Pending');
    return matchesQuery && matchesType && matchesStatus;
  });
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Event Operations Reports</div>
          <div className="page-sub">
            Submit, view, and track operational performance, logistics, and activity reports for
            Super Admin review.
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-primary" onClick={() => onOpenCreateEventOpsReportModal()}>
            📤 Submit Report
          </button>
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
            📈
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            {perfCount}
          </div>
          <div className="stat-label">Performance Reports</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--purple-dim)',
              color: 'var(--purple)',
            }}
          >
            ⚙️
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--purple)',
            }}
          >
            {opsCount}
          </div>
          <div className="stat-label">Operations Reports</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--blue-dim)',
              color: 'var(--blue)',
            }}
          >
            📄
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--blue)',
            }}
          >
            {actCount}
          </div>
          <div className="stat-label">Activity Reports</div>
        </div>
      </div>
      <div className="grid-3 mb-20">
        <div
          className="card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
          }}
        >
          <div>
            <div
              className="small muted"
              style={{
                fontWeight: '600',
              }}
            >
              Submitted Reports
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--purple)',
                marginTop: '2px',
              }}
            >
              {submittedCount}
            </div>
          </div>
          <span className="badge badge-purple">Submitted</span>
        </div>
        <div
          className="card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
          }}
        >
          <div>
            <div
              className="small muted"
              style={{
                fontWeight: '600',
              }}
            >
              Pending Review
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--orange)',
                marginTop: '2px',
              }}
            >
              {pendingReviewCount}
            </div>
          </div>
          <span className="badge badge-orange">In Review</span>
        </div>
        <div
          className="card"
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface2)',
          }}
        >
          <div>
            <div
              className="small muted"
              style={{
                fontWeight: '600',
              }}
            >
              Reviewed Reports
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: 'var(--green)',
                marginTop: '2px',
              }}
            >
              {reviewedCount}
            </div>
          </div>
          <span className="badge badge-green">Approved</span>
        </div>
      </div>
      <div className="card">
        <div
          className="filter-row mb-16"
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            className="search-box input-group"
            style={{
              flex: '1',
              minWidth: '240px',
            }}
          >
            <span className="input-icon">🔍</span>
            <FilterInput
              className="form-control"
              id="eor-search"
              placeholder="Search reports by title, scope, or ID..."
              value={sessionStorage.getItem('eor_search') || ''}
              onInput={() => onRefreshEorPage()}
            />
          </div>
          <PortalSelect
            className="form-control filter-select"
            id="eor-type-filter"
            onChange={() => onRefreshEorPage()}
            style={{
              width: '220px',
            }}
            value={typeFilter}
          >
            <option value="">All Report Types</option>
            <option value="Event Performance Report">Event Performance Report</option>
            <option value="Event Operations Report">Event Operations Report</option>
            <option value="Event Activity Report">Event Activity Report</option>
          </PortalSelect>
          <PortalSelect
            className="form-control filter-select"
            id="eor-status-filter"
            onChange={() => onRefreshEorPage()}
            style={{
              width: '170px',
            }}
            value={statusFilter}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
          </PortalSelect>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report</th>
                <th>Report Type</th>
                <th>Event / Scope</th>
                <th>Attached File</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((r, index) => (
                  <tr key={r?.id ?? r?.fileName ?? r?.title ?? index}>
                    <td>
                      <div
                        style={{
                          fontWeight: '700',
                          color: 'var(--text)',
                          fontSize: '13.5px',
                        }}
                      >
                        {r.title}
                      </div>
                      <div className="small muted">
                        ID: {r.id} · Submitted By: {r.owner || 'Elena Rostova'}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          r.type === 'Event Performance Report'
                            ? 'purple'
                            : r.type === 'Event Operations Report'
                            ? 'blue'
                            : 'orange'
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td
                      className="small"
                      style={{
                        fontWeight: '600',
                        color: 'var(--text2)',
                      }}
                    >
                      {r.scope || '—'}
                    </td>
                    <td>
                      {r.fileName ? (
                        <span
                          style={{
                            fontWeight: '600',
                            color: 'var(--accent)',
                            fontSize: '12.5px',
                          }}
                        >
                          📄 {r.fileName}
                        </span>
                      ) : (
                        <span className="small muted">No file attached</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${eventOpsReportBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="small muted">{r.updated}</td>
                    <td>
                      <div className="flex gap-6">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => onViewEventOpsReportModal(r.id)}
                        >
                          View Details
                        </button>
                        {r.status === 'Draft' ? (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => onSubmitDraftEventOpsReport(r.id)}
                          >
                            📤 Submit
                          </button>
                        ) : (
                          ''
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-20 muted">
                    No operational reports found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export function ReportContact({ users, userId, fallbackName = 'Not recorded' }) {
  const user = userId == null ? null : users.find(item => String(item.id) === String(userId));
  const name = user?.name || (userId != null ? `User (${userId})` : fallbackName);
  return (
    <>
      <span>{name}</span>
      {user?.email ? <div className="small muted">{user.email}</div> : ''}
    </>
  );
}
export function OrganizerReportFile({
  onOpenOrganizerReportFile,
  organizerReportAttachment,
  report,
}) {
  const attachment = organizerReportAttachment(report);
  const downloadButton = (
    <button
      type="button"
      className="btn btn-primary btn-xs"
      onClick={() => onOpenOrganizerReportFile(String(report.id), true)}
    >
      Download Report
    </button>
  );
  if (!attachment)
    return (
      <>
        <div
          style={{
            overflowWrap: 'anywhere',
          }}
        >
          {report.fileName || report.reportTitle || 'Report file'}
        </div>
        <div className="small mt-4">
          Original attachment unavailable. Download saved report details (TXT).
        </div>
        <div
          style={{
            marginTop: '8px',
          }}
        >
          {downloadButton}
        </div>
      </>
    );
  const canView = /\.(pdf|html)$/i.test(attachment.name);
  return (
    <>
      <div
        style={{
          overflowWrap: 'anywhere',
        }}
      >
        {attachment.name}
        {attachment.sample ? (
          <>
            {' '}
            <span className="badge badge-gray">Sample</span>
          </>
        ) : (
          ''
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginTop: '8px',
        }}
      >
        {canView ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onOpenOrganizerReportFile(String(report.id))}
          >
            View File
          </button>
        ) : (
          ''
        )}
        {downloadButton}
      </div>
    </>
  );
}
