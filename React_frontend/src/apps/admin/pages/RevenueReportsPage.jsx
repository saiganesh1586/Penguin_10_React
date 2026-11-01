import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageRevenueReports() {
    const timeframe = sessionStorage.getItem('admin_revenue_timeframe') || '6m';
    const allEvents = DB.events;
    const allRegs = DB.registrations;
    const ticketPayments = (DB.financeTransactions || []).filter(
      payment => payment.kind !== 'event' && payment.status === 'Successful'
    );
    const eventPayments = (DB.eventWorkflowPayments || []).filter(
      payment => payment.status === 'completed'
    );
    const actualPayments = [...ticketPayments, ...eventPayments];
    const regRevenue = ticketPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const eventRevenue = eventPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const totalRevenue = regRevenue + eventRevenue;
    const paidEvents = allEvents.filter(event => event.price > 0);
    const freeEvents = allEvents.filter(event => !event.price || event.price === 0);
    const totalPaidSeats = paidEvents.reduce(
      (total, currentEvent) => total + (currentEvent.registered || 0),
      0
    );
    const avgTicketPrice =
      paidEvents.length > 0
        ? Math.round(
            paidEvents.reduce((total, currentEvent) => total + (currentEvent.price || 0), 0) /
              paidEvents.length
          )
        : 0;
    const projectedPipeline = allEvents
      .filter(event => event.status === 'upcoming' || event.status === 'ongoing')
      .reduce(
        (total, currentEvent) => total + (currentEvent.capacity || 0) * (currentEvent.price || 0),
        0
      );

    // 1. Monthly Revenue Bar Graph over time (in ₹ Thousands)
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthlyRevenueMap = {};
    const numMonths = timeframe === '12m' ? 12 : 6;
    const now = new Date();
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenueMap[key] = {
        label: monthNames[d.getMonth()],
        amount: 0,
      };
    }
    actualPayments.forEach(payment => {
      const month = String(payment.paymentDate || payment.date || '').slice(0, 7);
      if (monthlyRevenueMap[month]) monthlyRevenueMap[month].amount += Number(payment.amount || 0);
    });
    const revenueBars = Object.values(monthlyRevenueMap).map((m, index) => ({
      label: m.label,
      value: Number((m.amount / 1000).toFixed(2)),
      color: [
        'linear-gradient(180deg, #22c55e, #15803d)',
        'linear-gradient(180deg, #10b981, #047857)',
        'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        'linear-gradient(180deg, #6366f1, #4338ca)',
        'linear-gradient(180deg, #8b5cf6, #7c3aed)',
        'linear-gradient(180deg, #f59e0b, #d97706)',
      ][index % 6],
    }));

    // 2. Category Revenue Bar Graph
    const catRevenueMap = {};
    actualPayments.forEach(payment => {
      const category =
        allEvents.find(event => String(event.id) === String(payment.eventId))?.category ||
        'General';
      catRevenueMap[category] = (catRevenueMap[category] || 0) + Number(payment.amount || 0);
    });
    const catRevenueBars = Object.entries(catRevenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        label,
        value: Number((value / 1000).toFixed(2)),
        color: [
          'linear-gradient(180deg, #22c55e, #15803d)',
          'linear-gradient(180deg, #3b82f6, #1d4ed8)',
          'linear-gradient(180deg, #f59e0b, #d97706)',
          'linear-gradient(180deg, #8b5cf6, #7c3aed)',
          'linear-gradient(180deg, #ec4899, #be185d)',
          'linear-gradient(180deg, #14b8a6, #0f766e)',
        ][index % 6],
      }));

    // 3. Ticket Pricing Tiers Bar Graph
    const pricingTierBars = [
      {
        label: 'Free (₹0)',
        value: freeEvents.length,
        color: 'linear-gradient(180deg, #14b8a6, #0f766e)',
      },
      {
        label: 'Budget (₹1–₹99)',
        value: allEvents.filter(event => event.price > 0 && event.price < 100).length,
        color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      },
      {
        label: 'Mid-Tier (₹100–₹199)',
        value: allEvents.filter(event => event.price >= 100 && event.price < 200).length,
        color: 'linear-gradient(180deg, #f59e0b, #d97706)',
      },
      {
        label: 'Premium (₹200+)',
        value: allEvents.filter(event => event.price >= 200).length,
        color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
      },
    ];

    // 4. Revenue Streams Contribution Bar Graph
    const streamBars = [
      {
        label: 'Ticket Sales',
        value: Number((regRevenue / 1000).toFixed(2)),
        color: 'linear-gradient(180deg, #22c55e, #15803d)',
      },
      {
        label: 'Client Event Payments',
        value: Number((eventRevenue / 1000).toFixed(2)),
        color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
      },
    ];
    return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Revenue Reports & Analytics</div>
      <div class="page-sub">Revenue trends, ticket pricing, and income by event category.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${
          timeframe === '6m' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterRevenueTimeframe('6m')">Last 6 Months</button>
        <button class="btn btn-xs ${
          timeframe === '12m' ? 'btn-primary' : 'btn-ghost'
        }" onclick="filterRevenueTimeframe('12m')">Last 12 Months</button>
      </div>
    </div>
  </div>

  <!-- Key Revenue Metric Cards -->
  <div class="grid-4 mb-20">
    <div class="stat-card">
      <div class="glow" style="background:var(--green)"></div>
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
      <div class="stat-value" style="color:var(--green)">₹${(totalRevenue / 1000).toFixed(1)}K</div>
      <div class="stat-label">Total Platform Revenue</div>
      <div class="stat-sub neutral">Recorded payment revenue</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--accent)"></div>
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📈</div>
      <div class="stat-value" style="color:var(--accent)">₹${avgTicketPrice}</div>
      <div class="stat-label">Average Ticket Price</div>
      <div class="stat-sub neutral">Across ${paidEvents.length} paid events</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--yellow)"></div>
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">🎟️</div>
      <div class="stat-value" style="color:var(--yellow)">${totalPaidSeats}</div>
      <div class="stat-label">Paid Ticket Registrations</div>
      <div class="stat-sub neutral">Paid registrations recorded</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--blue)"></div>
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📊</div>
      <div class="stat-value" style="color:var(--blue)">₹${(projectedPipeline / 1000).toFixed(
        1
      )}K</div>
      <div class="stat-label">Projected Pipeline</div>
      <div class="stat-sub neutral">Upcoming capacity value</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Revenue Over Time & Revenue by Category -->
  <div class="grid-2 mb-20" style="gap:20px">
    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <span class="h4">Platform Revenue</span>
        <span class="badge badge-green">${numMonths} Months Trend</span>
      </div>
      ${buildAnalyticsLine(revenueBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">
        Monthly revenue performance trajectory in thousands (₹K).
      </div>
    </div>

    <div class="card">
      <div class="flex justify-between items-center mb-12">
        <span class="h4">Revenue by Category</span>
      </div>
      ${buildAnalyticsBars(catRevenueBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
      <div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center">
        Revenue breakdown by event category.
      </div>
    </div>
  </div>

  <!-- Bar Graphs Row 2: Ticket Pricing Tiers & Revenue Streams -->
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Events by Ticket Price</div>
      ${buildAnalyticsBars(pricingTierBars, 215)}
    </div>

    <div class="card">
      <div class="h4 mb-12">Revenue Sources</div>
      ${buildAnalyticsBars(streamBars, 215, {
        label: 'Revenue',
        prefix: '₹',
        suffix: 'K',
      })}
    </div>
  </div>`;
  }
  /* PORTAL_RUNTIME_END */
}
export default function RevenueReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
