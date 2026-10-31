import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function dashSupportFinance() {
      const transactions = Array.isArray(DB.financeTransactions) ? DB.financeTransactions : [];
      const refunds = Array.isArray(DB.financeRefunds) ? DB.financeRefunds : [];
      const reports = Array.isArray(DB.operationalReports) ? DB.operationalReports : [];
      const paidRegistrations = (DB.registrations || []).filter(reg => String(reg.payment || '').toLowerCase() === 'paid' && ['confirmed', 'verified'].includes(String(reg.status || '').toLowerCase()));
      const successfulTransactions = paidRegistrations.length ? paidRegistrations : transactions.filter(tx => String(tx.status || '').toLowerCase() === 'successful' && Number(tx.amount || 0) > 0);
      const commissionRate = 0.15;
      const totalRevenue = successfulTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const platformCommission = totalRevenue * commissionRate;
      const organizerPayout = totalRevenue - platformCommission;
      const pendingRefunds = refunds.filter(item => item.status === 'Requested' || item.status === 'Processing');

      const todayStr = today();
      const todayTxns = transactions.filter(item => item.date === todayStr);

      // Financial activity feed only (Transactions, Refunds, Reports)
      const txnActivities = transactions.map(item => ({
        label: `Payment Transaction ${item.id}`,
        detail: `Amount: ₹${Number(item.amount || 0).toLocaleString('en-IN')} · Status: ${item.status} · Date: ${item.date}`,
        icon: '💳',
        date: item.date
      }));
      const refActivities = refunds.map(item => ({
        label: `Refund Request ${item.id}`,
        detail: `Amount: ₹${Number(item.amount || 0).toLocaleString('en-IN')} · Status: ${item.status} · Reason: ${item.reason}`,
        icon: '↩️',
        date: item.date
      }));
      const rptActivities = reports.filter(r => r.type && (r.type.includes('Finance') || r.type.includes('Revenue') || r.type.includes('Reconciliation'))).map(item => ({
        label: `Report: ${item.title}`,
        detail: `${item.type} · ${item.status} · Updated: ${item.updated}`,
        icon: '📊',
        date: item.updated
      }));

      const financialActivities = [
        ...txnActivities.slice(0, 3),
        ...refActivities.slice(0, 3),
        ...rptActivities.slice(0, 2)
      ].slice(0, 6);

      return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Finance Executive Dashboard</div>
            <div class="page-sub">Financial operations, registration revenue monitoring, platform commissions, organizer payouts, and refund reconciliations for ${CU.name}.</div>
          </div>
          <div class="page-hd-right" style="display:flex;gap:10px">
            <button class="btn btn-ghost" onclick="goNav('reports')">📋 View Reports</button>
            <button class="btn btn-primary" onclick="goNav('finance')">💳 Open Finance Center</button>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card" style="cursor:pointer;border-left:4px solid var(--green)" onclick="goNav('finance')">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
            <div class="stat-value" style="color:var(--green)">₹${totalRevenue.toLocaleString('en-IN')}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-sub neutral">${successfulTransactions.length} successful payments</div>
          </div>
          <div class="stat-card" style="cursor:pointer;border-left:4px solid var(--accent)" onclick="switchFinanceTab('transactions')">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">💳</div>
            <div class="stat-value" style="color:var(--accent)">${transactions.length}</div>
            <div class="stat-label">Total Transactions</div>
            <div class="stat-sub neutral">${todayTxns.length} processed today</div>
          </div>
          <div class="stat-card" style="cursor:pointer;border-left:4px solid var(--yellow)" onclick="switchFinanceTab('refunds')">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">↩️</div>
            <div class="stat-value" style="color:var(--yellow)">${pendingRefunds.length}</div>
            <div class="stat-label">Refunds Awaiting Review</div>
            <div class="stat-sub neutral">${refunds.length} total refund records</div>
          </div>
          <div class="stat-card" style="cursor:pointer;border-left:4px solid var(--purple)" onclick="goNav('finance')">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">📈</div>
            <div class="stat-value" style="color:var(--purple)">₹${platformCommission.toLocaleString('en-IN')}</div>
            <div class="stat-label">Platform Commission (15%)</div>
            <div class="stat-sub neutral">₹${organizerPayout.toLocaleString('en-IN')} net organizer payouts</div>
          </div>
        </div>

        <div class="grid-2 gap-20">
          <div class="card">
            <div class="flex justify-between items-center mb-14">
              <div class="h4">Quick Finance Navigation</div>
              <span class="badge badge-purple">Finance Only</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div style="padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface2);cursor:pointer;transition:transform .2s" onclick="switchFinanceTab('transactions')">
                <div style="font-size:24px;margin-bottom:8px">💳</div>
                <div style="font-weight:700;font-size:14px;color:var(--text)">Transactions Monitor</div>
                <div class="small muted mt-4">Review all incoming registrations & attendee charges</div>
              </div>
              <div style="padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface2);cursor:pointer;transition:transform .2s" onclick="switchFinanceTab('refunds')">
                <div style="font-size:24px;margin-bottom:8px">↩️</div>
                <div style="font-weight:700;font-size:14px;color:var(--text)">Refunds & Approvals</div>
                <div class="small muted mt-4">Audit attendee refund requests and payment chargebacks</div>
              </div>
            </div>
            <div class="mt-16" style="padding:14px;border-radius:8px;background:rgba(34,211,165,0.08);border:1px solid rgba(34,211,165,0.2)">
              <div class="flex justify-between items-center">
                <div>
                  <div style="font-weight:600;font-size:13px;color:var(--green)">✓ Super Admin Financial Audit Sync</div>
                  <div class="small muted">Ledgers automatically reconciled with platform banking services.</div>
                </div>
                <button class="btn btn-ghost btn-xs" onclick="goNav('reports')">Audit Reports →</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex justify-between items-center mb-14">
              <div class="h4">Recent Financial Activity</div>
              <button class="btn btn-ghost btn-xs" onclick="goNav('finance')">View All →</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              ${financialActivities.map(item => `
                <div class="flex items-center gap-10" style="padding:10px 0;border-bottom:1px solid var(--border)">
                  <span style="font-size:20px">${item.icon}</span>
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:13px">${item.label}</div>
                    <div class="small muted">${item.detail}</div>
                  </div>
                </div>
              `).join('') || '<div class="empty">No recent financial activity</div>'}
            </div>
          </div>
        </div>
      `;
    }/* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
