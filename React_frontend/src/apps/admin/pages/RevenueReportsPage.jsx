import { useAdminContext } from '../context/AdminContext.jsx';
import { AnalyticsBars, AnalyticsLine } from '../components/AnalyticsCharts.jsx';
export default function RevenueReportsPage() {
  const portalContext = useAdminContext();
  const portalActions = portalContext.actions;
  const { DB: workspaceData } = portalContext;
  const timeframe = sessionStorage.getItem('admin_revenue_timeframe') || '6m';
  const allEvents = workspaceData.events;
  const allRegs = workspaceData.registrations;
  const ticketPayments = (workspaceData.financeTransactions || []).filter(
    payment => payment.kind !== 'event' && payment.status === 'Successful'
  );
  const eventPayments = (workspaceData.eventWorkflowPayments || []).filter(
    payment => payment.status === 'completed'
  );
  const actualPayments = [...ticketPayments, ...eventPayments];
  const regRevenue = ticketPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const eventRevenue = eventPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
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
      allEvents.find(event => String(event.id) === String(payment.eventId))?.category || 'General';
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
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Revenue Reports &amp; Analytics</div>
          <div className="page-sub">
            Revenue trends, ticket pricing, and income by event category.
          </div>
        </div>
        <div className="page-hd-right">
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'var(--surface2)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              className={`btn btn-xs ${timeframe === '6m' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => portalActions.onFilterRevenueTimeframe('6m')}
            >
              Last 6 Months
            </button>
            <button
              className={`btn btn-xs ${timeframe === '12m' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => portalActions.onFilterRevenueTimeframe('12m')}
            >
              Last 12 Months
            </button>
          </div>
        </div>
      </div>
      <div className="grid-4 mb-20">
        <div className="stat-card">
          <div
            className="glow"
            style={{
              background: 'var(--green)',
            }}
          ></div>
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            💰
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            ₹{(totalRevenue / 1000).toFixed(1)}K
          </div>
          <div className="stat-label">Total Platform Revenue</div>
          <div className="stat-sub neutral">Recorded payment revenue</div>
        </div>
        <div className="stat-card">
          <div
            className="glow"
            style={{
              background: 'var(--accent)',
            }}
          ></div>
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
            ₹{avgTicketPrice}
          </div>
          <div className="stat-label">Average Ticket Price</div>
          <div className="stat-sub neutral">Across {paidEvents.length} paid events</div>
        </div>
        <div className="stat-card">
          <div
            className="glow"
            style={{
              background: 'var(--yellow)',
            }}
          ></div>
          <div
            className="stat-icon"
            style={{
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
            }}
          >
            🎟️
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--yellow)',
            }}
          >
            {totalPaidSeats}
          </div>
          <div className="stat-label">Paid Ticket Registrations</div>
          <div className="stat-sub neutral">Paid registrations recorded</div>
        </div>
        <div className="stat-card">
          <div
            className="glow"
            style={{
              background: 'var(--blue)',
            }}
          ></div>
          <div
            className="stat-icon"
            style={{
              background: 'var(--blue-dim)',
              color: 'var(--blue)',
            }}
          >
            📊
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--blue)',
            }}
          >
            ₹{(projectedPipeline / 1000).toFixed(1)}K
          </div>
          <div className="stat-label">Projected Pipeline</div>
          <div className="stat-sub neutral">Upcoming capacity value</div>
        </div>
      </div>
      <div
        className="grid-2 mb-20"
        style={{
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="flex justify-between items-center mb-12">
            <span className="h4">Platform Revenue</span>
            <span className="badge badge-green">{numMonths} Months Trend</span>
          </div>
          <AnalyticsLine
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={revenueBars}
            height={215}
            options={{
              label: 'Revenue',
              prefix: '₹',
              suffix: 'K',
            }}
          />
          <div
            style={{
              marginTop: '12px',
              fontSize: '11.5px',
              color: 'var(--text2)',
              textAlign: 'center',
            }}
          >
            {' '}
            Monthly revenue performance trajectory in thousands (₹K).{' '}
          </div>
        </div>
        <div className="card">
          <div className="flex justify-between items-center mb-12">
            <span className="h4">Revenue by Category</span>
          </div>
          <AnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={catRevenueBars}
            height={215}
            options={{
              label: 'Revenue',
              prefix: '₹',
              suffix: 'K',
            }}
          />
          <div
            style={{
              marginTop: '12px',
              fontSize: '11.5px',
              color: 'var(--text2)',
              textAlign: 'center',
            }}
          >
            {' '}
            Revenue breakdown by event category.{' '}
          </div>
        </div>
      </div>
      <div
        className="grid-2"
        style={{
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="h4 mb-12">Events by Ticket Price</div>
          <AnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={pricingTierBars}
            height={215}
          />
        </div>
        <div className="card">
          <div className="h4 mb-12">Revenue Sources</div>
          <AnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={streamBars}
            height={215}
            options={{
              label: 'Revenue',
              prefix: '₹',
              suffix: 'K',
            }}
          />
        </div>
      </div>
    </>
  );
}
