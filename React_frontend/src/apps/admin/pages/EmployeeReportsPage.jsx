import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageEmployeeReports() {
      const reports = receivedEmployeeReports();
      const open = reports.filter(item => item.report.status !== 'Reviewed').length;
      const visible = reports.map((item, index) => ({ ...item, index })).filter(item => employeeReportFilter === 'all' || (employeeReportFilter === 'reviewed' ? item.report.status === 'Reviewed' : item.report.status !== 'Reviewed'));
      return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Employee Reports</div><div class="page-sub">Reports submitted by registration, event operations, support, and finance employees.</div></div></div>
        <div class="grid-3 mb-20">
          <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📥</div><div class="stat-value">${reports.length}</div><div class="stat-label">Received Reports</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">◷</div><div class="stat-value">${open}</div><div class="stat-label">Awaiting Review</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✓</div><div class="stat-value">${reports.length - open}</div><div class="stat-label">Reviewed</div></div>
        </div>
        <div class="card"><div class="flex justify-between items-center mb-16"><div class="h4">Received submissions</div><select class="form-control" style="width:auto" aria-label="Filter employee reports" onchange="setEmployeeReportFilter(this.value)"><option value="all" ${employeeReportFilter === 'all' ? 'selected' : ''}>All reports</option><option value="open" ${employeeReportFilter === 'open' ? 'selected' : ''}>Awaiting review</option><option value="reviewed" ${employeeReportFilter === 'reviewed' ? 'selected' : ''}>Reviewed</option></select></div>
          ${visible.length ? `<div class="table-wrap"><table><thead><tr><th>Report</th><th>Employee</th><th>Department</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${visible.map(({ report, department, index }) => `<tr><td><strong>${adminChartText(report.title || report.type || 'Untitled report')}</strong><div class="small">${adminChartText(report.type || report.category || report.id || '')}</div></td><td>${adminChartText(report.owner || report.author || 'Employee')}</td><td>${adminChartText(department)}</td><td><span class="badge badge-${report.status === 'Reviewed' ? 'green' : 'purple'}">${adminChartText(report.status)}</span></td><td>${adminChartText(report.updated || report.submittedAt || '—')}</td><td><button class="btn btn-ghost btn-xs" onclick="viewEmployeeReport(${index})">View report</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><div class="empty-icon">📭</div><div class="empty-title">No reports in this view</div><div class="empty-desc">Submitted employee reports will appear here.</div></div>'}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function EmployeeReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
