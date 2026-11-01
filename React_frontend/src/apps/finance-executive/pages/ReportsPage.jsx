import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageOperationalReports() {
    const allReports = DB.operationalReports || [];
    const reports = allReports.filter(r => !r.type || !r.type.includes('Support'));
    return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Finance Reports &amp; Analytics</div>
            <div class="page-sub">Submit finance, commission, and revenue reconciliation reports to Super Admin.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openSubmitOperationalReportModal()">📤 Submit Finance Report</button>
          </div>
        </div>
        <div class="grid-3 mb-20">
          ${[
            'Finance & Revenue Report',
            'Commission & Payout Report',
            'Refunds & Reconciliation Report',
          ]
            .map(
              type => `
            <div class="stat-card">
              <div class="stat-icon">${
                type.includes('Commission') ? '📈' : type.includes('Refund') ? '↩️' : '💳'
              }</div>
              <div class="stat-value">${
                reports.filter(
                  item =>
                    item.type === type ||
                    (type === 'Finance & Revenue Report' && item.type === 'Finance Report')
                ).length
              }</div>
              <div class="stat-label">${type}</div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="card">
          <div class="h4 mb-12">Finance Operational Reports</div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  reports
                    .map(
                      item => `
                  <tr>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge badge-purple">${item.type}</span></td>
                    <td>${item.owner}</td>
                    <td><span class="badge badge-${operationalReportBadge(item.status)}">${
                        item.status
                      }</span></td>
                    <td>${item.updated}</td>
                    <td>${
                      item.status === 'Draft'
                        ? `<button class="btn btn-primary btn-xs" onclick="submitOperationalReport('${item.id}')">Submit</button>`
                        : '<span class="small" style="color:var(--green)">✓ Synchronized</span>'
                    }</td>
                  </tr>
                `
                    )
                    .join('') ||
                  '<tr><td colspan="6" class="text-center py-20 muted">No finance reports submitted yet.</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
  }
  /* PORTAL_RUNTIME_END */
}

export default function ReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
