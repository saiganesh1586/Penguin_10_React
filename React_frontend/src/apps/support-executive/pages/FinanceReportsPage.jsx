import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */async function pageFinanceReports() {
      const from = sessionStorage.getItem('finance_from') || ''; const to = sessionStorage.getItem('finance_to') || '';
      try {
        const query = new URLSearchParams({ from, to }); const data = await apiRequest('/finance/dashboard?' + query.toString()); const totals = data.totals || {};
        const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:data.currency || 'INR'}).format(Number(value || 0));
        const rows = (data.eventRevenue || []).map(row => '<tr><td>' + escapeHtml(row.eventName) + '</td><td>' + row.ticketsSold + '</td><td>' + money(row.revenue) + '</td></tr>').join('');
        return '<div class="page-hd"><div><div class="page-title">Financial Reports</div><div class="page-sub">Database-backed revenue summary and transaction export</div></div></div><div class="filter-row"><label class="small muted">From <input class="form-control" type="date" id="finance-from" value="' + escapeHtml(from) + '"></label><label class="small muted">To <input class="form-control" type="date" id="finance-to" value="' + escapeHtml(to) + '"></label><button class="btn btn-primary" onclick="applyFinanceDateRange()">Generate report</button><button class="btn btn-ghost" onclick="downloadFinanceCsv()">Download transaction CSV</button></div><div class="grid-3 mb-20"><div class="stat-card"><div class="stat-value">' + money(totals.grossRevenue) + '</div><div class="stat-label">Gross captured revenue</div></div><div class="stat-card"><div class="stat-value">' + money(totals.refundedAmount) + '</div><div class="stat-label">Completed refunds</div></div><div class="stat-card"><div class="stat-value">' + money(totals.netRevenue) + '</div><div class="stat-label">Net revenue</div></div></div><div class="card"><div class="h4 mb-12">Event revenue report</div><div class="table-wrap"><table><thead><tr><th>Event</th><th>Tickets sold</th><th>Captured revenue</th></tr></thead><tbody>' + (rows || '<tr><td colspan="3" class="text-center py-20">No event revenue for this range.</td></tr>') + '</tbody></table></div><p class="small muted mt-16">Generated ' + new Date().toLocaleString('en-IN') + '. PDF, payout, and gateway reconciliation reports are not available in the current demo integration.</p></div>';
      } catch (error) { return '<div class="card"><div class="empty-title">Report data is unavailable</div><p class="empty-desc">' + escapeHtml(error.message) + '</p><button class="btn btn-primary" onclick="goNav(&quot;reports&quot;)">Retry</button></div>'; }
    }/* PORTAL_RUNTIME_END */
}

export default function FinanceReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
