import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import {
  EventOperationsReports,
  OperationalReports,
  OrganizerReportFile,
  ReportContact,
} from '../components/EventReports.jsx';
export default function ReportsPage() {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    ROLE_COLORS,
    evStatBadge,
    getEventReportRecipients,
  } = portalContext;
  if (!workspaceData.reports) workspaceData.reports = [];
  if (currentUser.role === 'employee' && currentUser.employeeType === 'SUPPORT_FINANCE')
    return (
      <OperationalReports
        operationalReports={portalContext.DB.operationalReports}
        onOpenSubmitOperationalReportModal={
          portalContext.actions.onOpenSubmitOperationalReportModal
        }
        onSubmitOperationalReport={portalContext.actions.onSubmitOperationalReport}
        operationalReportBadge={portalContext.operationalReportBadge}
      />
    );
  if (currentUser.role === 'employee' && currentUser.employeeType === 'EVENT_OPERATIONS')
    return (
      <EventOperationsReports
        eventOpsReports={portalContext.DB.eventOpsReports}
        onOpenCreateEventOpsReportModal={portalContext.actions.onOpenCreateEventOpsReportModal}
        onRefreshEorPage={portalContext.actions.onRefreshEorPage}
        onViewEventOpsReportModal={portalContext.actions.onViewEventOpsReportModal}
        onSubmitDraftEventOpsReport={portalContext.actions.onSubmitDraftEventOpsReport}
        eventOpsReportBadge={portalContext.eventOpsReportBadge}
      />
    );

  // Super Admin gets dedicated analytics dashboard
  if (currentUser.role === 'superuser') {
    const tab = sessionStorage.getItem('admin_reports_tab') || 'users';

    // ── USER STATISTICS DATA ──────────────────────────────
    const allUsers = workspaceData.users;
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = allUsers.filter(u => u.status !== 'active').length;
    const attendees = allUsers.filter(u => u.role === 'attendee').length;
    const organizers = allUsers.filter(u => u.role === 'organizer').length;
    const clients = allUsers.filter(u => u.role === 'client').length;
    const employeeCount = allUsers.filter(u => u.role === 'employee').length;
    const admins = allUsers.filter(u => u.role === 'superuser').length;

    // Monthly registrations (last 6 months based on joinedAt / joined)
    const now = new Date();
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
    const monthData = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthData[key] = {
        label: monthNames[d.getMonth()],
        count: 0,
      };
    }
    allUsers
      .filter(u => u.role === 'attendee')
      .forEach(u => {
        const joined = u.joined || u.joinedAt || '';
        const key = joined.slice(0, 7);
        if (monthData[key]) monthData[key].count++;
      });
    const months = Object.values(monthData);
    const maxMonthCount = Math.max(...months.map((m, index) => m.count), 1);

    // Role breakdown bar widths
    const maxRole = Math.max(attendees, organizers, clients, employeeCount, admins, 1);
    const roleBar = n => Math.round((n / maxRole) * 100);
    const userStatsContent = (
      <>
        <div
          className="grid-4 mb-24"
          style={{
            gap: '14px',
          }}
        >
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--accent)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
              }}
            >
              👥
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--accent)',
              }}
            >
              {allUsers.length}
            </div>
            <div className="stat-label">Total Users</div>
            <div className="stat-sub neutral">Platform-wide</div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--green)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--green-dim)',
                color: 'var(--green)',
              }}
            >
              ✅
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--green)',
              }}
            >
              {activeUsers}
            </div>
            <div className="stat-label">Active Users</div>
            <div className="stat-sub up">
              ↑ {Math.round((activeUsers / Math.max(allUsers.length, 1)) * 100)}% active rate
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--red)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--red-dim)',
                color: 'var(--red)',
              }}
            >
              ⚠️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--red)',
              }}
            >
              {inactiveUsers}
            </div>
            <div className="stat-label">Inactive Users</div>
            <div className="stat-sub neutral">Need attention</div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--blue)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--blue-dim)',
                color: 'var(--blue)',
              }}
            >
              🎟️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--blue)',
              }}
            >
              {attendees}
            </div>
            <div className="stat-label">Attendees</div>
            <div className="stat-sub neutral">Registered attendees</div>
          </div>
        </div>
        <div
          className="grid-2 mb-24"
          style={{
            gap: '20px',
          }}
        >
          <div className="card card-lg">
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                🏷️
              </span>{' '}
              User Role Breakdown{' '}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {[
                {
                  role: 'Attendees',
                  count: attendees,
                  color: 'var(--blue)',
                  icon: '🎟️',
                },
                {
                  role: 'Organizers',
                  count: organizers,
                  color: 'var(--accent)',
                  icon: '🎯',
                },
                {
                  role: 'Clients',
                  count: clients,
                  color: 'var(--yellow)',
                  icon: '💼',
                },
                {
                  role: 'Employees',
                  count: employeeCount,
                  color: 'var(--green)',
                  icon: '👷',
                },
                {
                  role: 'Super Admins',
                  count: admins,
                  color: 'var(--red)',
                  icon: '🛡️',
                },
              ].map((r, index) => (
                <div
                  key={
                    r?.id ??
                    r?.eventReportId ??
                    r?.requestId ??
                    r?.registrationId ??
                    r?.ticketId ??
                    r?.eventId ??
                    r?.reportId ??
                    r?.paymentId ??
                    r?.refundId ??
                    r?.notificationId ??
                    r?.label ??
                    r?.fileName ??
                    index
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{r.icon}</span>
                      <span
                        style={{
                          fontWeight: '500',
                        }}
                      >
                        {r.role}
                      </span>
                    </span>
                    <span
                      style={{
                        fontWeight: '700',
                        color: r.color,
                      }}
                    >
                      {r.count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'var(--surface3)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${roleBar(r.count)}%`,
                        background: r.color,
                        borderRadius: '99px',
                        transition: 'width 0.6s ease',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: 'var(--surface2)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: 'var(--green)',
                  }}
                >
                  {activeUsers}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    marginTop: '2px',
                  }}
                >
                  Active
                </div>
              </div>
              <div
                style={{
                  background: 'var(--surface2)',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: 'var(--red)',
                  }}
                >
                  {inactiveUsers}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text2)',
                    marginTop: '2px',
                  }}
                >
                  Inactive
                </div>
              </div>
            </div>
          </div>
          <div className="card card-lg">
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'var(--green-dim)',
                  color: 'var(--green)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                📅
              </span>{' '}
              Monthly Attendee Registrations{' '}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '160px',
                paddingBottom: '4px',
              }}
            >
              {months.map((m, index) => (
                <div
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  key={m?.label ?? index}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--green)',
                    }}
                  >
                    {m.count || ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      background: 'linear-gradient(180deg,var(--green),var(--accent))',
                      borderRadius: '6px 6px 0 0',
                      height: `${
                        m.count ? Math.max(Math.round((m.count / maxMonthCount) * 130), 8) : 4
                      }px`,
                      opacity: m.count ? 1 : 0.2,
                      transition: 'height 0.5s ease',
                    }}
                  ></div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text3)',
                      fontWeight: '600',
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text2)',
              }}
            >
              {' '}
              Total attendees registered:{' '}
              <strong
                style={{
                  color: 'var(--green)',
                }}
              >
                {attendees}
              </strong>
            </div>
          </div>
        </div>
        <div className="card">
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'var(--blue-dim)',
                  color: 'var(--blue)',
                  padding: '5px 7px',
                  borderRadius: '8px',
                }}
              >
                📋
              </span>{' '}
              All Users Overview
            </div>
            <span className="badge badge-blue">{allUsers.length} total</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u, index) => (
                  <tr key={u?.name ?? u?.email ?? index}>
                    <td>
                      <div className="flex items-center gap-10">
                        <div className="av av-sm">{u.avatar || u.name[0]}</div>
                        <div>
                          <div
                            style={{
                              fontWeight: '500',
                            }}
                          >
                            {u.name}
                          </div>
                          <div className="small">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status === 'active' ? 'green' : 'red'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="small">{u.joined || u.joinedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );

    // ── EVENT STATISTICS DATA ──────────────────────────────
    const allEvents = workspaceData.events;
    const allRegs = workspaceData.registrations;
    const totalRevenue = allRegs.reduce(
      (total, registration) => total + (registration.amount || 0),
      0
    );
    const checkedIn = allRegs.filter(registration => registration.checkedIn).length;
    const upcomingEvs = allEvents.filter(event => event.status === 'upcoming').length;
    const completedEvs = allEvents.filter(event => event.status === 'completed').length;

    // Category breakdown
    const catMap = {};
    allEvents.forEach(event => {
      if (!catMap[event.category])
        catMap[event.category] = {
          count: 0,
          regs: 0,
          revenue: 0,
        };
      catMap[event.category].count++;
      const registrations = allRegs.filter(registration => registration.eventId === event.id);
      catMap[event.category].regs += registrations.length;
      catMap[event.category].revenue += registrations.reduce(
        (total, registration) => total + (registration.amount || 0),
        0
      );
    });
    const cats = Object.entries(catMap).sort((a, b) => b[1].regs - a[1].regs);
    const maxCatRegs = Math.max(...cats.map((c, index) => c[1].regs), 1);
    const catColors = [
      'var(--accent)',
      'var(--green)',
      'var(--blue)',
      'var(--yellow)',
      'var(--orange)',
      'var(--red)',
    ];

    // Top events by registration
    const topEvents = [...allEvents]
      .sort((leftEvent, rightEvent) => rightEvent.registered - leftEvent.registered)
      .slice(0, 5);

    // Monthly revenue (last 6 months)
    const revMonthData = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revMonthData[key] = {
        label: monthNames[d.getMonth()],
        revenue: 0,
        regs: 0,
      };
    }
    allRegs.forEach(registration => {
      const key = (registration.date || '').slice(0, 7);
      if (revMonthData[key]) {
        revMonthData[key].revenue += registration.amount || 0;
        revMonthData[key].regs++;
      }
    });
    const revMonths = Object.values(revMonthData);
    const maxRev = Math.max(...revMonths.map((m, index) => m.revenue), 1);
    const eventStatsContent = (
      <>
        <div
          className="grid-4 mb-24"
          style={{
            gap: '14px',
          }}
        >
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--green)',
            }}
          >
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
              ₹{totalRevenue.toLocaleString()}
            </div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-sub up">From all ticket sales</div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--accent)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
              }}
            >
              🗓️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--accent)',
              }}
            >
              {allEvents.length}
            </div>
            <div className="stat-label">Total Events</div>
            <div className="stat-sub neutral">
              {upcomingEvs} upcoming · {completedEvs} completed
            </div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--blue)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--blue-dim)',
                color: 'var(--blue)',
              }}
            >
              🎟️
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--blue)',
              }}
            >
              {allRegs.length}
            </div>
            <div className="stat-label">Total Registrations</div>
            <div className="stat-sub neutral">Across all events</div>
          </div>
          <div
            className="stat-card"
            style={{
              borderLeft: '4px solid var(--yellow)',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--yellow-dim)',
                color: 'var(--yellow)',
              }}
            >
              ✅
            </div>
            <div
              className="stat-value"
              style={{
                color: 'var(--yellow)',
              }}
            >
              {checkedIn}
            </div>
            <div className="stat-label">Checked In</div>
            <div className="stat-sub up">
              {Math.round((checkedIn / Math.max(allRegs.length, 1)) * 100)}% attendance rate
            </div>
          </div>
        </div>
        <div
          className="grid-2 mb-24"
          style={{
            gap: '20px',
          }}
        >
          <div className="card card-lg">
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'var(--green-dim)',
                  color: 'var(--green)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                📈
              </span>{' '}
              Monthly Revenue (₹){' '}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '160px',
                paddingBottom: '4px',
              }}
            >
              {revMonths.map((m, index) => (
                <div
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  key={m?.label ?? index}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'var(--green)',
                    }}
                  >
                    {m.revenue > 0 ? '₹' + m.revenue : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      background: 'linear-gradient(180deg,#22d3a5,#4299e1)',
                      borderRadius: '6px 6px 0 0',
                      height: `${
                        m.revenue ? Math.max(Math.round((m.revenue / maxRev) * 130), 8) : 4
                      }px`,
                      opacity: m.revenue ? 1 : 0.2,
                    }}
                  ></div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text3)',
                      fontWeight: '600',
                    }}
                  >
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text2)',
              }}
            >
              {' '}
              Total platform revenue:{' '}
              <strong
                style={{
                  color: 'var(--green)',
                }}
              >
                ₹{totalRevenue.toLocaleString()}
              </strong>
            </div>
          </div>
          <div className="card card-lg">
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                🏆
              </span>{' '}
              Popular Event Categories{' '}
            </div>
            {cats.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📊</div>
                <div className="empty-title">No data yet</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {cats.map(([cat, data], i) => (
                  <div key={cat}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: '600',
                          color: catColors[i % catColors.length],
                        }}
                      >
                        {cat}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          gap: '12px',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--text2)',
                          }}
                        >
                          {data.regs} attendees
                        </span>
                        <span
                          style={{
                            color: 'var(--green)',
                            fontWeight: '600',
                          }}
                        >
                          ₹{data.revenue.toLocaleString()}
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'var(--surface3)',
                        borderRadius: '99px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.round((data.regs / maxCatRegs) * 100)}%`,
                          background: catColors[i % catColors.length],
                          borderRadius: '99px',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="card mb-24">
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                background: 'var(--yellow-dim)',
                color: 'var(--yellow)',
                padding: '5px 7px',
                borderRadius: '8px',
              }}
            >
              🏅
            </span>{' '}
            Top Events by Attendance{' '}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Registered</th>
                  <th>Capacity</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map((event, index) => {
                  const evRev = allRegs
                    .filter(registration => registration.eventId === event.id)
                    .reduce((total, registration) => total + (registration.amount || 0), 0);
                  return (
                    <tr key={event?.id ?? event?.date ?? event?.title ?? index}>
                      <td>
                        <span
                          style={{
                            fontWeight: '700',
                            color: 'var(--text3)',
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '18px',
                            }}
                          >
                            {event.emoji || '🎪'}
                          </span>
                          <div>
                            <div
                              style={{
                                fontWeight: '600',
                                fontSize: '13.5px',
                              }}
                            >
                              {event.title}
                            </div>
                            <div className="small">{event.date}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-purple">{event.category}</span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: 'var(--blue)',
                          }}
                        >
                          {event.registered}
                        </strong>
                      </td>
                      <td className="small">{event.capacity}</td>
                      <td>
                        <strong
                          style={{
                            color: 'var(--green)',
                          }}
                        >
                          ₹{evRev.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge badge-${evStatBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                background: 'var(--green-dim)',
                color: 'var(--green)',
                padding: '5px 7px',
                borderRadius: '8px',
              }}
            >
              📊
            </span>{' '}
            All Events Revenue Breakdown{' '}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Price</th>
                  <th>Registrations</th>
                  <th>Revenue</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event, index) => {
                  const evRegs = allRegs.filter(registration => registration.eventId === event.id);
                  const evRev2 = evRegs.reduce(
                    (total, registration) => total + (registration.amount || 0),
                    0
                  );
                  const occ = Math.round((event.registered / Math.max(event.capacity, 1)) * 100);
                  return (
                    <tr key={event?.id ?? event?.title ?? index}>
                      <td>
                        <div
                          style={{
                            fontWeight: '500',
                          }}
                        >
                          {event.title}
                        </div>
                      </td>
                      <td>
                        {event.price === 0 ? (
                          <span className="badge badge-green">Free</span>
                        ) : (
                          '₹' + event.price
                        )}
                      </td>
                      <td>
                        <strong>{evRegs.length}</strong>
                      </td>
                      <td
                        style={{
                          color: 'var(--green)',
                          fontWeight: '700',
                        }}
                      >
                        ₹{evRev2.toLocaleString()}
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              flex: '1',
                              height: '6px',
                              background: 'var(--surface3)',
                              borderRadius: '99px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${occ}%`,
                                background:
                                  occ >= 80
                                    ? 'var(--green)'
                                    : occ >= 50
                                    ? 'var(--yellow)'
                                    : 'var(--red)',
                                borderRadius: '99px',
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--text2)',
                              minWidth: '32px',
                            }}
                          >
                            {occ}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
    return (
      <>
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Reports &amp; Analytics</div>
            <div className="page-sub">Platform-wide statistics for super administration</div>
          </div>
          <div className="page-hd-right">
            <button
              className="btn btn-ghost"
              onClick={() => portalActions.onToast('Export feature coming soon', 'info')}
            >
              📥 Export
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--surface2)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => portalActions.onSwitchReportTab('users')}
            style={{
              flex: '1',
              padding: '10px 20px',
              borderRadius: '9px',
              fontWeight: '600',
              fontSize: '13.5px',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'users' ? 'var(--accent)' : 'transparent',
              color: tab === 'users' ? '#fff' : 'var(--text2)',
            }}
          >
            {' '}
            👥 User Statistics{' '}
          </button>
          <button
            onClick={() => portalActions.onSwitchReportTab('events')}
            style={{
              flex: '1',
              padding: '10px 20px',
              borderRadius: '9px',
              fontWeight: '600',
              fontSize: '13.5px',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              background: tab === 'events' ? 'var(--accent)' : 'transparent',
              color: tab === 'events' ? '#fff' : 'var(--text2)',
            }}
          >
            {' '}
            📊 Event Analytics{' '}
          </button>
        </div>
        {tab === 'users' ? userStatsContent : eventStatsContent}
      </>
    );
  }

  // ── NON-SUPERUSER: original client report view ──────
  const tab = sessionStorage.getItem('reports_tab') || 'client';
  const myEvents =
    currentUser.role === 'organizer'
      ? workspaceData.events.filter(event => event.organizer === currentUser.id)
      : workspaceData.events;
  const completedEvents = myEvents.filter(event => event.status === 'completed').length;
  const eventIds = myEvents.map((event, index) => String(event.id));
  const eventReports = workspaceData.reports.filter(report =>
    eventIds.includes(String(report.eventId))
  );
  const clientReports =
    currentUser.role === 'organizer'
      ? eventReports.filter(report => String(report.submittedBy) === String(currentUser.id))
      : eventReports;
  const pendingClientEvents = myEvents.filter(
    event =>
      event.status === 'completed' &&
      !clientReports.some(report => String(report.eventId) === String(event.id))
  );
  const pendingReports = pendingClientEvents.length;
  const submittedReports = clientReports.length;
  const clientReportContent = (
    <>
      <div className="grid-3 mb-24">
        <div
          className="stat-card"
          style={{
            border: '1px solid var(--blue-dim)',
            background: 'rgba(66, 153, 225, 0.05)',
            padding: '16px',
          }}
        >
          <div
            className="small"
            style={{
              color: 'var(--blue)',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            Total Completed
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--blue)',
                color: '#fff',
                margin: '0',
                fontSize: '16px',
                borderRadius: '50%',
              }}
            >
              ✓
            </div>
            <div>
              <div
                className="stat-value"
                style={{
                  color: 'var(--text)',
                  fontSize: '24px',
                  margin: '0',
                }}
              >
                {completedEvents}
              </div>
              <div
                className="small"
                style={{
                  color: 'var(--text2)',
                }}
              >
                Total events
              </div>
            </div>
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            border: '1px solid var(--green-dim)',
            background: 'rgba(34, 211, 165, 0.05)',
            padding: '16px',
          }}
        >
          <div
            className="small"
            style={{
              color: 'var(--green)',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            Reports Submitted
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--green)',
                color: '#fff',
                margin: '0',
                fontSize: '15px',
                borderRadius: '8px',
              }}
            >
              📄
            </div>
            <div>
              <div
                className="stat-value"
                style={{
                  color: 'var(--text)',
                  fontSize: '24px',
                  margin: '0',
                }}
              >
                {submittedReports}
              </div>
              <div
                className="small"
                style={{
                  color: 'var(--text2)',
                }}
              >
                Reports submitted
              </div>
            </div>
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            border: '1px solid var(--orange-dim)',
            background: 'rgba(237, 137, 54, 0.05)',
            padding: '16px',
          }}
        >
          <div
            className="small"
            style={{
              color: 'var(--orange)',
              fontWeight: '600',
              marginBottom: '12px',
            }}
          >
            Pending Submissions
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              className="stat-icon"
              style={{
                background: 'var(--orange)',
                color: '#fff',
                margin: '0',
                fontSize: '16px',
                borderRadius: '50%',
              }}
            >
              🕒
            </div>
            <div>
              <div
                className="stat-value"
                style={{
                  color: 'var(--text)',
                  fontSize: '24px',
                  margin: '0',
                }}
              >
                {pendingReports}
              </div>
              <div
                className="small"
                style={{
                  color: 'var(--text2)',
                }}
              >
                Reports pending
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="h4 mb-16"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            color: 'var(--orange)',
            fontSize: '18px',
          }}
        >
          ⭕
        </span>{' '}
        Pending Submissions
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {pendingClientEvents.map((event, index) => {
          const recipient = getEventReportRecipients(event)[0];
          return (
            <div
              className="card"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '20px',
                borderRadius: '12px',
              }}
              key={event?.id ?? event?.date ?? event?.title ?? index}
            >
              <div
                style={{
                  fontWeight: '700',
                  fontSize: '16px',
                  marginBottom: '12px',
                  color: 'var(--text)',
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px',
                  marginBottom: '16px',
                  color: 'var(--text2)',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📅</span> {event.date}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📍</span> {event.venue || event.city || 'Location'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>👥</span>{' '}
                  {
                    workspaceData.registrations.filter(
                      registration => registration.eventId === event.id
                    ).length
                  }{' '}
                  Attendees
                </div>
              </div>
              <div className="small mb-12">
                <strong>Send to:</strong>{' '}
                <ReportContact
                  users={portalContext.DB.users}
                  userId={recipient?.id}
                  fallbackName={'No requesting client linked'}
                />
              </div>
              <div className="flex gap-12">
                <button
                  className="btn btn-primary"
                  onClick={() => portalActions.onOpenSubmitReportModal(event.id)}
                  {...(recipient
                    ? {}
                    : {
                        disabled: true,
                      })}
                  style={{
                    gap: '6px',
                    background: 'var(--accent)',
                    borderRadius: '8px',
                  }}
                >
                  📤 Submit Report
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => portalActions.onOpenViewEventDrawer(event.id)}
                  style={{
                    color: 'var(--accent)',
                    borderColor: 'var(--accent-dim)',
                    background: 'var(--accent-dim)',
                    gap: '6px',
                    borderRadius: '8px',
                  }}
                >
                  👁 View Event Details
                </button>
              </div>
            </div>
          );
        })}
        {pendingReports === 0 ? (
          <div className="empty">
            <div className="empty-icon">✓</div>
            <div className="empty-title">All Reports Submitted</div>
            <p className="empty-desc">Great job! All your completed events have reports.</p>
          </div>
        ) : (
          ''
        )}
      </div>
      <div
        className="h4 mb-16"
        style={{
          marginTop: '28px',
        }}
      >
        Submitted Reports
      </div>
      <div className="table-wrap">
        {clientReports.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No submitted reports yet</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Report File</th>
                <th>Sent To</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {clientReports.map((report, index) => {
                const event = myEvents.find(item => String(item.id) === String(report.eventId));
                return (
                  <tr key={report?.eventId ?? index}>
                    <td>{event ? event.title : 'Unknown event'}</td>
                    <td>
                      <OrganizerReportFile
                        onOpenOrganizerReportFile={portalContext.actions.onOpenOrganizerReportFile}
                        organizerReportAttachment={portalContext.organizerReportAttachment}
                        report={report}
                      />
                    </td>
                    <td>
                      <ReportContact
                        users={portalContext.DB.users}
                        userId={report.recipientId}
                        fallbackName={'Recipient not recorded'}
                      />
                    </td>
                    <td>{report.submittedAt || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--bg)',
      }}
    >
      <div
        className="page-hd"
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div className="page-hd-left">
          <div className="page-title">Event Reports</div>
          <div className="page-sub">
            Send completed-event reports to the requesting client and review submitted files
          </div>
        </div>
        <div className="page-hd-right">
          <button
            className="btn"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
              gap: '8px',
            }}
            onClick={() => portalActions.onToast(`${completedEvents} Completed Events`, 'info')}
          >
            <span
              style={{
                fontSize: '16px',
                color: 'var(--accent)',
              }}
            >
              📄
            </span>{' '}
            {completedEvents} Completed Events
          </button>
        </div>
      </div>
      {clientReportContent}
    </div>
  );
}
