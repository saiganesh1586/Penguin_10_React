import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageFinanceCenter() {
      const tab = sessionStorage.getItem('finance_tab') || 'transactions';
      const query = (sessionStorage.getItem('finance_query') || '').toLowerCase();
      const commissionRate = 0.15;
      const allTransactions = Array.isArray(DB.financeTransactions) ? DB.financeTransactions : [];
      const refundRecords = Array.isArray(DB.financeRefunds) ? DB.financeRefunds : [];
      const paidRegistrations = (DB.registrations || []).filter(reg => String(reg.payment || '').toLowerCase() === 'paid' && ['confirmed', 'verified'].includes(String(reg.status || '').toLowerCase()));
      const successfulTransactions = allTransactions.filter(tx => tx.status === 'Successful');
      const totalRevenue = successfulTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const platformCommission = totalRevenue * commissionRate;
      const organizerPayout = totalRevenue - platformCommission;

      const records = tab === 'transactions' ? allTransactions : refundRecords;
      const filtered = records.filter(item => {
        const user = DB.users.find(u => String(u.id) === String(item.userId)) || {};
        const event = DB.events.find(e => String(e.id) === String(item.eventId)) || {};
        const text = `${item.id || ''} ${user.name || ''} ${user.email || ''} ${event.title || ''} ${item.status || ''} ${item.reason || ''}`.toLowerCase();
        return !query || text.includes(query);
      });

      return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Finance &amp; Revenue</div>
            <div class="page-sub">Track registration revenue, platform commission, organizer payouts, and customer payment activity.</div>
          </div>
        </div>

        <div class="grid-4 mb-20">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
            <div class="stat-value" style="color:var(--green)">₹${totalRevenue.toLocaleString('en-IN')}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-sub neutral">Completed payment records</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>
            <div class="stat-value" style="color:var(--accent)">₹${platformCommission.toLocaleString('en-IN')}</div>
            <div class="stat-label">Platform Commission</div>
            <div class="stat-sub neutral">Fixed 15% fee share</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">💸</div>
            <div class="stat-value" style="color:var(--yellow)">₹${organizerPayout.toLocaleString('en-IN')}</div>
            <div class="stat-label">Organizer Payouts</div>
            <div class="stat-sub neutral">Net payout after commission</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🧾</div>
            <div class="stat-value" style="color:var(--purple)">${successfulTransactions.length}</div>
            <div class="stat-label">Successful Transactions</div>
            <div class="stat-sub neutral">Monitored payment records</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:20px">
          <div class="flex justify-between items-center mb-12">
            <div class="h4">Event-wise Revenue &amp; Commission</div>
            <div class="small muted">Commission formula: registration fee × 15%</div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Payments</th>
                  <th>Gross Revenue</th>
                  <th>Platform Commission</th>
                  <th>Organizer Payout</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const eventSummary = {};
                  successfulTransactions.forEach(tx => {
                    const event = DB.events.find(e => String(e.id) === String(tx.eventId)) || { title: 'Unknown Event' };
                    const eventKey = String(tx.eventId || event.title);
                    if (!eventSummary[eventKey]) {
                      eventSummary[eventKey] = {
                        eventTitle: event.title,
                        attendeeCount: 0,
                        revenue: 0
                      };
                    }
                    eventSummary[eventKey].attendeeCount += 1;
                    eventSummary[eventKey].revenue += Number(tx.amount || 0);
                  });
                  const rows = Object.values(eventSummary);
                  return rows.length
                    ? rows.map(row => {
                        const commission = row.revenue * commissionRate;
                        const payout = row.revenue - commission;
                        return `
                          <tr>
                            <td>${row.eventTitle}</td>
                            <td>${row.attendeeCount}</td>
                            <td style="color:var(--green);font-weight:700">₹${row.revenue}</td>
                            <td style="color:var(--accent);font-weight:700">₹${commission}</td>
                            <td style="color:var(--yellow);font-weight:700">₹${payout}</td>
                          </tr>
                        `;
                      }).join('')
                    : '<tr><td colspan="5" class="text-center py-20">No successful event revenue data found.</td></tr>';
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:16px">
          <button class="btn ${tab === 'transactions' ? 'btn-primary' : 'btn-ghost'}" onclick="switchFinanceTab('transactions')">💳 Transactions</button>
          <button class="btn ${tab === 'refunds' ? 'btn-primary' : 'btn-ghost'}" onclick="switchFinanceTab('refunds')">↩️ Refunds</button>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="finance-query" placeholder="Search finance records..." value="${query}" oninput="refreshFinanceCenter()">
          </div>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                ${tab === 'transactions' ? '<tr><th>Transaction ID</th><th>User</th><th>Event</th><th>Amount</th><th>Payment Status</th><th>Date</th></tr>' : '<tr><th>Refund ID</th><th>User</th><th>Event</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>'}
              </thead>
              <tbody>
                ${filtered.map(item => {
                  const user = DB.users.find(u => String(u.id) === String(item.userId)) || { name: 'Unknown' };
                  const event = DB.events.find(e => String(e.id) === String(item.eventId)) || { title: 'Unknown Event' };
                  return tab === 'transactions'
                    ? `<tr><td class="mono">${item.id}</td><td>${user.name}</td><td>${event.title}</td><td style="color:var(--green);font-weight:700">₹${item.amount}</td><td><span class="badge badge-${financeStatusBadge(item.status)}">${item.status}</span></td><td>${item.date}</td></tr>`
                    : `<tr><td class="mono">${item.id}</td><td>${user.name}</td><td>${event.title}</td><td style="color:var(--green);font-weight:700">₹${item.amount}</td><td>${item.reason}</td><td><span class="badge badge-${financeStatusBadge(item.status)}">${item.status}</span></td><td>${item.date}</td></tr>`;
                }).join('') || `<tr><td colspan="${tab === 'transactions' ? 6 : 7}" class="text-center py-20">No finance records found.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }/* PORTAL_RUNTIME_END */
}

export default function FinancePage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
