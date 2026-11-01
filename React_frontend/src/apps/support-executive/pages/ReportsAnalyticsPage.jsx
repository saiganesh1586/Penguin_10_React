import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageReportsAndAnalytics() {
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

    return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Reports &amp; Analytics</div>
            <div class="page-sub">Consolidated operational, registration, and support performance reports for Super Admin review.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openCreateSupportExecutiveReportModal()">📤 Submit Report</button>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📊</div>
            <div class="stat-value" style="color:var(--accent)">${totalCount}</div>
            <div class="stat-label">Total Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📝</div>
            <div class="stat-value" style="color:var(--yellow)">${draftCount}</div>
            <div class="stat-label">Draft Reports</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">📤</div>
            <div class="stat-value" style="color:var(--purple)">${submittedCount}</div>
            <div class="stat-label">Submitted to Admin</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
            <div class="stat-value" style="color:var(--green)">${reviewedCount}</div>
            <div class="stat-label">Reviewed &amp; Approved</div>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="rep-q" placeholder="Search reports by title, category, scope, filename..." value="${repQ}" oninput="refreshReportsAnalytics()">
          </div>
          <select class="form-control filter-select" id="rep-type" onchange="refreshReportsAnalytics()">
            <option value="">All Categories</option>
            <option value="Registration &amp; User Management" ${
              repType === 'Registration & User Management' ? 'selected' : ''
            }>Registration &amp; User Management</option>
            <option value="Event Operations Report" ${
              repType === 'Event Operations Report' ? 'selected' : ''
            }>Event Operations</option>
            <option value="Support &amp; Issue Summary" ${
              repType === 'Support & Issue Summary' ? 'selected' : ''
            }>Support &amp; Issue Summary</option>
          </select>
          <select class="form-control filter-select" id="rep-st" onchange="refreshReportsAnalytics()">
            <option value="">All Statuses</option>
            <option value="Draft" ${repSt === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Submitted" ${repSt === 'Submitted' ? 'selected' : ''}>Submitted</option>
            <option value="Reviewed" ${repSt === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
          </select>
        </div>

        <div class="report-cards" aria-label="Reports">
          ${
            filtered
              .map(r => {
                const isDraft = r.status === 'Draft';
                const isReviewed = r.status === 'Reviewed' || r.status === 'Approved';
                const stBadge = isReviewed ? 'green' : isDraft ? 'yellow' : 'purple';
                return `
              <article class="report-card">
                <div class="report-card-heading">
                  <span class="report-card-category">${escapeHtml(r.category)}</span>
                  <span class="badge badge-${stBadge}">${escapeHtml(r.status)}</span>
                </div>
                <h3 class="report-card-title">${escapeHtml(r.title)}</h3>
                <div class="report-card-byline"><span class="mono">${escapeHtml(
                  r.id
                )}</span><span>By ${escapeHtml(r.author || 'Support Executive')}</span></div>
                <div class="report-card-context"><span>${escapeHtml(
                  r.scope
                )}</span><span>${escapeHtml(r.period || 'Q3 2026')}</span></div>
                <button class="report-card-file" type="button" onclick="previewReportDocument('${
                  r.id
                }')" title="${escapeHtml(r.fileName).replace(
                  /"/g,
                  '&quot;'
                )}"><span aria-hidden="true">📄</span><span>${escapeHtml(
                  r.fileName
                )}</span></button>
                <div class="report-card-footer">
                  <p class="report-card-feedback">${escapeHtml(
                    r.reviewFeedback ||
                      r.adminNotes ||
                      (isReviewed ? 'Approved without remarks' : 'Awaiting admin review')
                  )}</p>
                  <div class="report-card-actions">
                    <button class="btn btn-ghost btn-xs" type="button" onclick="previewReportDocument('${
                      r.id
                    }')">View</button>
                    ${
                      isDraft
                        ? `<button class="btn btn-primary btn-xs" type="button" onclick="submitReportToAdminDirect('${r.id}')">Submit</button>`
                        : ''
                    }
                  </div>
                </div>
              </article>`;
              })
              .join('') || '<div class="card report-cards-empty">No matching reports found.</div>'
          }
        </div>
      `;
  }
  /* PORTAL_RUNTIME_END */
}

export default function ReportsAnalyticsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
