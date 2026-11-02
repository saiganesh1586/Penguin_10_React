import { useAdminContext } from '../context/AdminContext.jsx';
import {
  AnalyticsBars,
  AnalyticsLine,
  GroupedAnalyticsBars,
} from '../components/AnalyticsCharts.jsx';
export default function EventReportsPage() {
  const portalContext = useAdminContext();
  const portalActions = portalContext.actions;
  const { DB: workspaceData } = portalContext;
  const selectedStage = sessionStorage.getItem('admin_event_reports_stage') || 'all';
  const allEvents = workspaceData.events;
  const ongoingEvents = allEvents.filter(event => event.status === 'ongoing');
  const upcomingEvents = allEvents.filter(
    event => event.status === 'upcoming' || event.status === 'published' || event.status === 'full'
  );
  const completedEvents = allEvents.filter(event => event.status === 'completed');
  const draftEvents = allEvents.filter(event => ['draft', 'pending'].includes(event.status));
  let eventsToAnalyze = allEvents;
  if (selectedStage === 'ongoing') eventsToAnalyze = ongoingEvents;
  else if (selectedStage === 'upcoming') eventsToAnalyze = upcomingEvents;
  else if (selectedStage === 'completed') eventsToAnalyze = completedEvents;
  const totalEvents = eventsToAnalyze.length;

  // 1. Lifecycle Stage Bar Graph
  const lifecycleBars = [
    {
      label: 'Ongoing (Now)',
      value: ongoingEvents.length,
      color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
    },
    {
      label: 'About to Happen',
      value: upcomingEvents.length,
      color: 'linear-gradient(180deg, #22c55e, #15803d)',
    },
    {
      label: 'Completed',
      value: completedEvents.length,
      color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)',
    },
    {
      label: 'Draft / Planning',
      value: draftEvents.length,
      color: 'linear-gradient(180deg, #64748b, #475569)',
    },
  ];

  // 2. Monthly Timeline Bar Graph
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
  const monthlyBuckets = {};
  const now = new Date();
  for (let i = -2; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBuckets[key] = {
      label: monthNames[d.getMonth()],
      count: 0,
      isPast: i < 0,
      isCurrent: i === 0,
    };
  }
  eventsToAnalyze.forEach(e => {
    const dateStr = (e.date || '').toString();
    const match = dateStr.match(/(\d{4}-\d{2})/);
    if (match && monthlyBuckets[match[1]]) {
      monthlyBuckets[match[1]].count++;
    }
  });
  const monthlyBars = Object.values(monthlyBuckets).map((m, index) => ({
    label: m.label + (m.isCurrent ? ' (Now)' : ''),
    value: m.count,
    color: m.isCurrent
      ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)'
      : m.isPast
      ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)'
      : 'linear-gradient(180deg, #22c55e, #15803d)',
  }));

  // 3. Category Distribution Bar Graph
  const catCounts = {};
  eventsToAnalyze.forEach(e => {
    const c = e.category || 'Other';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  const catBars = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({
      label,
      value,
      color: [
        'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        'linear-gradient(180deg, #22c55e, #15803d)',
        'linear-gradient(180deg, #f59e0b, #d97706)',
        'linear-gradient(180deg, #8b5cf6, #7c3aed)',
        'linear-gradient(180deg, #ec4899, #be185d)',
        'linear-gradient(180deg, #14b8a6, #0f766e)',
      ][i % 6],
    }));

  // 4. Grouped Capacity vs Registered Bar Graph by Event Stage
  const capacityOccupancyGroups = [
    {
      label: 'Ongoing',
      bars: [
        {
          label: 'Registered',
          value: ongoingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: ongoingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
    {
      label: 'About to Happen',
      bars: [
        {
          label: 'Registered',
          value: upcomingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: upcomingEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
    {
      label: 'Completed',
      bars: [
        {
          label: 'Registered',
          value: completedEvents.reduce(
            (total, currentEvent) => total + (currentEvent.registered || 0),
            0
          ),
          color: 'linear-gradient(180deg, #22c55e, #15803d)',
        },
        {
          label: 'Capacity',
          value: completedEvents.reduce(
            (total, currentEvent) => total + (currentEvent.capacity || 0),
            0
          ),
          color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
        },
      ],
    },
  ];
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Event Reports &amp; Analytics</div>
          <div className="page-sub">
            Event activity, category breakdowns, and registration trends.
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
              className={`btn btn-xs ${selectedStage === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => portalActions.onFilterEventReportsStage('all')}
            >
              All Stages
            </button>
            <button
              className={`btn btn-xs ${selectedStage === 'ongoing' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => portalActions.onFilterEventReportsStage('ongoing')}
            >
              ▶️ Ongoing
            </button>
            <button
              className={`btn btn-xs ${selectedStage === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => portalActions.onFilterEventReportsStage('upcoming')}
            >
              ⏳ About to Happen
            </button>
            <button
              className={`btn btn-xs ${
                selectedStage === 'completed' ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => portalActions.onFilterEventReportsStage('completed')}
            >
              ✅ Completed
            </button>
          </div>
        </div>
      </div>
      <div
        className="grid-3 mb-20"
        style={{
          gap: '16px',
        }}
      >
        <div
          className="stat-card"
          style={{
            borderLeft: '4px solid var(--blue)',
          }}
        >
          <div
            className="glow"
            style={{
              background: 'var(--blue)',
            }}
          ></div>
          <div className="flex justify-between items-center mb-6">
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--blue)',
                textTransform: 'uppercase',
              }}
            >
              ▶️ Ongoing Events
            </span>
            <span className="badge badge-blue">Happening Now</span>
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--blue)',
              fontSize: '32px',
            }}
          >
            {ongoingEvents.length}
          </div>
          <div className="stat-label">Currently in Progress</div>
          <div
            className="stat-sub neutral"
            style={{
              marginTop: '6px',
            }}
          >
            {ongoingEvents.reduce(
              (total, currentEvent) => total + (currentEvent.registered || 0),
              0
            )}{' '}
            live attendees participating
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            borderLeft: '4px solid var(--green)',
          }}
        >
          <div
            className="glow"
            style={{
              background: 'var(--green)',
            }}
          ></div>
          <div className="flex justify-between items-center mb-6">
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--green)',
                textTransform: 'uppercase',
              }}
            >
              ⏳ About to Happen
            </span>
            <span className="badge badge-green">Scheduled</span>
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
              fontSize: '32px',
            }}
          >
            {upcomingEvents.length}
          </div>
          <div className="stat-label">Upcoming &amp; Scheduled</div>
          <div
            className="stat-sub up"
            style={{
              marginTop: '6px',
            }}
          >
            {upcomingEvents.reduce(
              (total, currentEvent) => total + (currentEvent.registered || 0),
              0
            )}{' '}
            reservations confirmed
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            borderLeft: '4px solid var(--purple)',
          }}
        >
          <div
            className="glow"
            style={{
              background: 'var(--purple)',
            }}
          ></div>
          <div className="flex justify-between items-center mb-6">
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--purple)',
                textTransform: 'uppercase',
              }}
            >
              ✅ Completed Events
            </span>
            <span className="badge badge-purple">Finished</span>
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--purple)',
              fontSize: '32px',
            }}
          >
            {completedEvents.length}
          </div>
          <div className="stat-label">Concluded Events</div>
          <div
            className="stat-sub neutral"
            style={{
              marginTop: '6px',
            }}
          >
            {completedEvents.reduce(
              (total, currentEvent) => total + (currentEvent.registered || 0),
              0
            )}{' '}
            past attendees reached
          </div>
        </div>
      </div>
      <div
        className="grid-2 mb-20"
        style={{
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="h4 mb-12">Event Lifecycle</div>
          <AnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={lifecycleBars}
            height={215}
          />
        </div>
        <div className="card">
          <div className="h4 mb-12">Event Categories</div>
          <AnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={
              catBars.length
                ? catBars
                : [
                    {
                      label: 'No Events',
                      value: 0,
                      color: 'linear-gradient(180deg, #64748b, #475569)',
                    },
                  ]
            }
            height={215}
          />
        </div>
      </div>
      <div
        className="grid-2"
        style={{
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="h4 mb-12">Monthly Event Timeline</div>
          <AnalyticsLine
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            items={monthlyBars}
            height={215}
            options={{
              label: 'Events',
            }}
          />
        </div>
        <div className="card">
          <div className="h4 mb-12">Booked Seats &amp; Capacity</div>
          <GroupedAnalyticsBars
            ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
            adminChartLine={portalContext.adminChartLine}
            adminChartNumber={portalContext.adminChartNumber}
            groups={capacityOccupancyGroups}
            height={215}
            legend={[
              {
                label: 'Booked Seats',
                color: 'linear-gradient(180deg, #22c55e, #15803d)',
              },
              {
                label: 'Total Capacity',
                color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
