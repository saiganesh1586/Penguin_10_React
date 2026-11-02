export function EventReportsOverview({ events, onFilterEventReportsStage }) {
  const selectedStage = sessionStorage.getItem('admin_event_reports_stage') || 'all';
  const allEvents = events;
  const ongoingEvents = allEvents.filter(event => event.status === 'ongoing');
  const upcomingEvents = allEvents.filter(
    event => event.status === 'upcoming' || event.status === 'published' || event.status === 'full'
  );
  const completedEvents = allEvents.filter(event => event.status === 'completed');
  const draftEvents = allEvents.filter(event => event.status === 'draft');
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
            Bar graph analytics for ongoing events, completed events, and events about to happen.
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
              onClick={() => onFilterEventReportsStage('all')}
            >
              All Stages
            </button>
            <button
              className={`btn btn-xs ${selectedStage === 'ongoing' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onFilterEventReportsStage('ongoing')}
            >
              ▶️ Ongoing
            </button>
            <button
              className={`btn btn-xs ${selectedStage === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onFilterEventReportsStage('upcoming')}
            >
              ⏳ About to Happen
            </button>
            <button
              className={`btn btn-xs ${
                selectedStage === 'completed' ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => onFilterEventReportsStage('completed')}
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
          <div className="h4 mb-12">📊 Event Lifecycle Stages (Bar Graph)</div>
          <AnalyticsBars items={lifecycleBars} height={215} />
        </div>
        <div className="card">
          <div className="h4 mb-12">🏷️ Event Category Breakdown (Bar Graph)</div>
          <AnalyticsBars
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
          <div className="h4 mb-12">
            📅 Monthly Event Timeline (Past, Current &amp; Future Bar Graph)
          </div>
          <AnalyticsBars items={monthlyBars} height={215} />
        </div>
        <div className="card">
          <div className="h4 mb-12">🎟️ Booked Seats vs Total Capacity (Grouped Bar Graph)</div>
          <GroupedAnalyticsBars
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

// ════════════════════════════════════════════════
//  ADMIN SUBPAGE 3: REVENUE REPORTS (BAR GRAPHS)
// ════════════════════════════════════════════════
export function AnalyticsBars({ items, height }) {
  const max = Math.max(1, ...items.map((item, index) => item.value || 0));
  const chartHeight = height || 180;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '14px',
        height: `${chartHeight}px`,
        paddingTop: '12px',
      }}
    >
      {items.map((item, index) => {
        const barHeight = Math.max(
          8,
          Math.round(((item.value || 0) / max) * Math.max(chartHeight - 52, 40))
        );
        return (
          <div
            style={{
              flex: '1',
              minWidth: '0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '8px',
            }}
            key={item?.label ?? item?.value ?? index}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text3)',
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: '58px',
                height: `${barHeight}px`,
                flexShrink: '0',
                borderRadius: '18px 18px 8px 8px',
                background: 'linear-gradient(180deg,var(--green),#15803d)',
                boxShadow: '0 16px 28px rgba(15,23,42,.18)',
              }}
            ></div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text2)',
                textAlign: 'center',
                lineHeight: '1.35',
              }}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export // ════════════════════════════════════════════════
//  ADMIN: Employee Stats & Management (superuser)
// ════════════════════════════════════════════════
function GroupedAnalyticsBars({ groups, height, legend }) {
  let max = 1;
  groups.forEach(g => {
    (g.bars || []).forEach(b => {
      if ((b.value || 0) > max) max = b.value;
    });
  });
  const chartHeight = height || 200;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {legend ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--text2)',
            marginBottom: '4px',
          }}
        >
          {legend.map((l, index) => (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              key={l?.label ?? index}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: l.color,
                }}
              ></span>
              {l.label}
            </span>
          ))}
        </div>
      ) : (
        ''
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          height: `${chartHeight}px`,
          paddingTop: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {groups.map((group, index) => {
          return (
            <div
              style={{
                flex: '1',
                minWidth: '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '6px',
                height: '100%',
              }}
              key={group?.label ?? index}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '5px',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                }}
              >
                {group.bars.map((bar, index) => {
                  const barHeight = Math.max(
                    8,
                    Math.round(((bar.value || 0) / max) * Math.max(chartHeight - 52, 40))
                  );
                  return (
                    <div
                      style={{
                        flex: '1',
                        maxWidth: '26px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                        gap: '4px',
                      }}
                      key={bar?.label ?? bar?.value ?? index}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'var(--text3)',
                        }}
                      >
                        {bar.value}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: `${barHeight}px`,
                          flexShrink: '0',
                          borderRadius: '6px 6px 2px 2px',
                          background: 'linear-gradient(180deg,var(--green),#15803d)',
                          boxShadow: '0 8px 16px rgba(15,23,42,.12)',
                        }}
                        title={`${bar.label || ''}: ${bar.value}`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text2)',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginTop: '4px',
                }}
              >
                {group.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
