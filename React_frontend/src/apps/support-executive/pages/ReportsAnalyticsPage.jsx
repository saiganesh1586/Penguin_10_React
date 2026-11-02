import FilterInput from '../../../app/FilterInput.jsx';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
export default function ReportsAnalyticsPage() {
  const portalContext = useSupportExecutiveContext();
  const portalActions = portalContext.actions;
  const { getAllReportsList } = portalContext;
  const reports = getAllReportsList();
  const repQ = (sessionStorage.getItem('rep_q') || '').toLowerCase();
  const repType = sessionStorage.getItem('rep_type') || '';
  const repSt = sessionStorage.getItem('rep_st') || '';
  const totalCount = reports.length;
  const draftCount = reports.filter(report => report.status === 'Draft').length;
  const submittedCount = reports.filter(
    report =>
      report.status === 'Submitted' ||
      report.status === 'Pending Review' ||
      report.status === 'Pending'
  ).length;
  const reviewedCount = reports.filter(
    report => report.status === 'Reviewed' || report.status === 'Approved'
  ).length;
  const filtered = reports.filter(report => {
    const matchesQuery =
      !repQ ||
      `${report.id} ${report.title} ${report.category} ${report.scope} ${report.fileName}`
        .toLowerCase()
        .includes(repQ);
    const matchesType = !repType || report.category === repType;
    let matchesStatus = true;
    if (repSt) {
      if (repSt === 'Draft') matchesStatus = report.status === 'Draft';
      else if (repSt === 'Submitted')
        matchesStatus =
          report.status === 'Submitted' ||
          report.status === 'Pending Review' ||
          report.status === 'Pending';
      else if (repSt === 'Reviewed')
        matchesStatus = report.status === 'Reviewed' || report.status === 'Approved';
    }
    return matchesQuery && matchesType && matchesStatus;
  });
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Reports &amp; Analytics</div>
          <div className="page-sub">
            Consolidated operational, registration, and support performance reports for Super Admin
            review.
          </div>
        </div>
        <div className="page-hd-right">
          <button
            className="btn btn-primary"
            onClick={() => portalActions.onOpenCreateSupportExecutiveReportModal()}
          >
            📤 Submit Report
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
            📊
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            {totalCount}
          </div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
            }}
          >
            📝
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--yellow)',
            }}
          >
            {draftCount}
          </div>
          <div className="stat-label">Draft Reports</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--purple-dim)',
              color: 'var(--purple)',
            }}
          >
            📤
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--purple)',
            }}
          >
            {submittedCount}
          </div>
          <div className="stat-label">Submitted to Admin</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            ✅
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            {reviewedCount}
          </div>
          <div className="stat-label">Reviewed &amp; Approved</div>
        </div>
      </div>
      <div className="filter-row">
        <div className="search-box input-group">
          <span className="input-icon">🔍</span>
          <FilterInput
            className="form-control"
            id="rep-q"
            placeholder="Search reports by title, category, scope, filename..."
            value={repQ}
            onInput={() => portalActions.onRefreshReportsAnalytics()}
          />
        </div>
        <PortalSelect
          className="form-control filter-select"
          id="rep-type"
          onChange={() => portalActions.onRefreshReportsAnalytics()}
          value={repType}
        >
          <option value="">All Categories</option>
          <option value="Registration & User Management">Registration &amp; User Management</option>
          <option value="Event Operations Report">Event Operations</option>
          <option value="Support & Issue Summary">Support &amp; Issue Summary</option>
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="rep-st"
          onChange={() => portalActions.onRefreshReportsAnalytics()}
          value={repSt}
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Reviewed">Reviewed</option>
        </PortalSelect>
      </div>
      <div className="report-cards" aria-label="Reports">
        {listOrEmpty(
          filtered.map((r, index) => {
            const isDraft = r.status === 'Draft';
            const isReviewed = r.status === 'Reviewed' || r.status === 'Approved';
            const stBadge = isReviewed ? 'green' : isDraft ? 'yellow' : 'purple';
            return (
              <article className="report-card" key={r?.id ?? r?.fileName ?? r?.title ?? index}>
                <div className="report-card-heading">
                  <span className="report-card-category">{r.category}</span>
                  <span className={`badge badge-${stBadge}`}>{r.status}</span>
                </div>
                <h3 className="report-card-title">{r.title}</h3>
                <div className="report-card-byline">
                  <span className="mono">{r.id}</span>
                  <span>By {r.author || 'Support Executive'}</span>
                </div>
                <div className="report-card-context">
                  <span>{r.scope}</span>
                  <span>{r.period || 'Q3 2026'}</span>
                </div>
                <button
                  className="report-card-file"
                  type="button"
                  onClick={() => portalActions.onPreviewReportDocument(r.id)}
                  title={r.fileName.replace(/"/g, '&quot;')}
                >
                  <span aria-hidden="true">📄</span>
                  <span>{r.fileName}</span>
                </button>
                <div className="report-card-footer">
                  <p className="report-card-feedback">
                    {r.reviewFeedback ||
                      r.adminNotes ||
                      (isReviewed ? 'Approved without remarks' : 'Awaiting admin review')}
                  </p>
                  <div className="report-card-actions">
                    <button
                      className="btn btn-ghost btn-xs"
                      type="button"
                      onClick={() => portalActions.onPreviewReportDocument(r.id)}
                    >
                      View
                    </button>
                    {isDraft ? (
                      <button
                        className="btn btn-primary btn-xs"
                        type="button"
                        onClick={() => portalActions.onSubmitReportToAdminDirect(r.id)}
                      >
                        Submit
                      </button>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </article>
            );
          }),
          <div className="card report-cards-empty">No matching reports found.</div>
        )}
      </div>
    </>
  );
}
