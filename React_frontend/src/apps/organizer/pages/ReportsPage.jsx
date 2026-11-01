import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageReports() {
    if (!DB.reports) DB.reports = [];
    if (CU.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE')
      return pageOperationalReports();
    if (CU.role === 'employee' && CU.employeeType === 'EVENT_OPERATIONS')
      return pageEventOpsReports();

    // Super Admin gets dedicated analytics dashboard
    if (CU.role === 'superuser') {
      const tab = sessionStorage.getItem('admin_reports_tab') || 'users';

      // ── USER STATISTICS DATA ──────────────────────────────
      const allUsers = DB.users;
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
      const maxMonthCount = Math.max(...months.map(m => m.count), 1);

      // Role breakdown bar widths
      const maxRole = Math.max(attendees, organizers, clients, employeeCount, admins, 1);
      const roleBar = n => Math.round((n / maxRole) * 100);
      const userStatsContent = `
  <div class="grid-4 mb-24" style="gap:14px">
    <div class="stat-card" style="border-left:4px solid var(--accent)">
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>
      <div class="stat-value" style="color:var(--accent)">${allUsers.length}</div>
      <div class="stat-label">Total Users</div>
      <div class="stat-sub neutral">Platform-wide</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--green)">
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
      <div class="stat-value" style="color:var(--green)">${activeUsers}</div>
      <div class="stat-label">Active Users</div>
      <div class="stat-sub up">↑ ${Math.round(
        (activeUsers / Math.max(allUsers.length, 1)) * 100
      )}% active rate</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--red)">
      <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">⚠️</div>
      <div class="stat-value" style="color:var(--red)">${inactiveUsers}</div>
      <div class="stat-label">Inactive Users</div>
      <div class="stat-sub neutral">Need attention</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--blue)">
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">🎟️</div>
      <div class="stat-value" style="color:var(--blue)">${attendees}</div>
      <div class="stat-label">Attendees</div>
      <div class="stat-sub neutral">Registered attendees</div>
    </div>
  </div>

  <div class="grid-2 mb-24" style="gap:20px">
    <!-- Role Breakdown Card -->
    <div class="card card-lg">
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
        <span style="background:var(--accent-dim);color:var(--accent);padding:6px 8px;border-radius:8px;font-size:14px">🏷️</span>
        User Role Breakdown
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${[
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
        ]
          .map(
            r => `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
            <span style="display:flex;align-items:center;gap:6px"><span>${
              r.icon
            }</span><span style="font-weight:500">${r.role}</span></span>
            <span style="font-weight:700;color:${r.color}">${r.count}</span>
          </div>
          <div style="height:8px;background:var(--surface3);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${roleBar(r.count)}%;background:${
              r.color
            };border-radius:99px;transition:width 0.6s ease"></div>
          </div>
        </div>`
          )
          .join('')}
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:var(--green)">${activeUsers}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">Active</div>
        </div>
        <div style="background:var(--surface2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:var(--red)">${inactiveUsers}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">Inactive</div>
        </div>
      </div>
    </div>

    <!-- Monthly Registrations Chart -->
    <div class="card card-lg">
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
        <span style="background:var(--green-dim);color:var(--green);padding:6px 8px;border-radius:8px;font-size:14px">📅</span>
        Monthly Attendee Registrations
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding-bottom:4px">
        ${months
          .map(
            m => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <div style="font-size:11px;font-weight:700;color:var(--green)">${m.count || ''}</div>
          <div style="width:100%;background:linear-gradient(180deg,var(--green),var(--accent));border-radius:6px 6px 0 0;height:${
            m.count ? Math.max(Math.round((m.count / maxMonthCount) * 130), 8) : 4
          }px;opacity:${m.count ? 1 : 0.2};transition:height 0.5s ease"></div>
          <div style="font-size:10px;color:var(--text3);font-weight:600">${m.label}</div>
        </div>`
          )
          .join('')}
      </div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;color:var(--text2)">
        Total attendees registered: <strong style="color:var(--green)">${attendees}</strong>
      </div>
    </div>
  </div>

  <!-- All Users Table -->
  <div class="card">
    <div style="font-family:var(--font-head);font-size:15px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px"><span style="background:var(--blue-dim);color:var(--blue);padding:5px 7px;border-radius:8px">📋</span> All Users Overview</div>
      <span class="badge badge-blue">${allUsers.length} total</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
        <tbody>
          ${allUsers
            .map(
              u => `<tr>
            <td><div class="flex items-center gap-10"><div class="av av-sm">${
              u.avatar || u.name[0]
            }</div><div><div style="font-weight:500">${u.name}</div><div class="small">${
                u.email
              }</div></div></div></td>
            <td><span class="badge badge-${ROLE_COLORS[u.role]}">${u.role}</span></td>
            <td><span class="badge badge-${u.status === 'active' ? 'green' : 'red'}">${
                u.status || 'active'
              }</span></td>
            <td class="small">${u.joined || u.joinedAt || '—'}</td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>`;

      // ── EVENT STATISTICS DATA ──────────────────────────────
      const allEvents = DB.events;
      const allRegs = DB.registrations;
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
      const maxCatRegs = Math.max(...cats.map(c => c[1].regs), 1);
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
      const maxRev = Math.max(...revMonths.map(m => m.revenue), 1);
      const eventStatsContent = `
  <div class="grid-4 mb-24" style="gap:14px">
    <div class="stat-card" style="border-left:4px solid var(--green)">
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
      <div class="stat-value" style="color:var(--green)">₹${totalRevenue.toLocaleString()}</div>
      <div class="stat-label">Total Revenue</div>
      <div class="stat-sub up">From all ticket sales</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--accent)">
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div>
      <div class="stat-value" style="color:var(--accent)">${allEvents.length}</div>
      <div class="stat-label">Total Events</div>
      <div class="stat-sub neutral">${upcomingEvs} upcoming · ${completedEvs} completed</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--blue)">
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">🎟️</div>
      <div class="stat-value" style="color:var(--blue)">${allRegs.length}</div>
      <div class="stat-label">Total Registrations</div>
      <div class="stat-sub neutral">Across all events</div>
    </div>
    <div class="stat-card" style="border-left:4px solid var(--yellow)">
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">✅</div>
      <div class="stat-value" style="color:var(--yellow)">${checkedIn}</div>
      <div class="stat-label">Checked In</div>
      <div class="stat-sub up">${Math.round(
        (checkedIn / Math.max(allRegs.length, 1)) * 100
      )}% attendance rate</div>
    </div>
  </div>

  <div class="grid-2 mb-24" style="gap:20px">
    <!-- Revenue Bar Chart -->
    <div class="card card-lg">
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
        <span style="background:var(--green-dim);color:var(--green);padding:6px 8px;border-radius:8px;font-size:14px">📈</span>
        Monthly Revenue (₹)
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding-bottom:4px">
        ${revMonths
          .map(
            m => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
          <div style="font-size:10px;font-weight:700;color:var(--green)">${
            m.revenue > 0 ? '₹' + m.revenue : ''
          }</div>
          <div style="width:100%;background:linear-gradient(180deg,#22d3a5,#4299e1);border-radius:6px 6px 0 0;height:${
            m.revenue ? Math.max(Math.round((m.revenue / maxRev) * 130), 8) : 4
          }px;opacity:${m.revenue ? 1 : 0.2}"></div>
          <div style="font-size:10px;color:var(--text3);font-weight:600">${m.label}</div>
        </div>`
          )
          .join('')}
      </div>
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;color:var(--text2)">
        Total platform revenue: <strong style="color:var(--green)">₹${totalRevenue.toLocaleString()}</strong>
      </div>
    </div>

    <!-- Category Popularity -->
    <div class="card card-lg">
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
        <span style="background:var(--accent-dim);color:var(--accent);padding:6px 8px;border-radius:8px;font-size:14px">🏆</span>
        Popular Event Categories
      </div>
      ${
        cats.length === 0
          ? `<div class="empty"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div></div>`
          : `<div style="display:flex;flex-direction:column;gap:14px">
        ${cats
          .map(
            ([cat, data], i) => `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
            <span style="font-weight:600;color:${catColors[i % catColors.length]}">${cat}</span>
            <span style="display:flex;gap:12px">
              <span style="color:var(--text2)">${data.regs} attendees</span>
              <span style="color:var(--green);font-weight:600">₹${data.revenue.toLocaleString()}</span>
            </span>
          </div>
          <div style="height:8px;background:var(--surface3);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.round(
              (data.regs / maxCatRegs) * 100
            )}%;background:${catColors[i % catColors.length]};border-radius:99px"></div>
          </div>
        </div>`
          )
          .join('')}
      </div>`
      }
    </div>
  </div>

  <!-- Top Events Table -->
  <div class="card mb-24">
    <div style="font-family:var(--font-head);font-size:15px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">
      <span style="background:var(--yellow-dim);color:var(--yellow);padding:5px 7px;border-radius:8px">🏅</span> Top Events by Attendance
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Event</th><th>Category</th><th>Registered</th><th>Capacity</th><th>Revenue</th><th>Status</th></tr></thead>
        <tbody>
          ${topEvents
            .map((event, index) => {
              const evRev = allRegs
                .filter(registration => registration.eventId === event.id)
                .reduce((total, registration) => total + (registration.amount || 0), 0);
              return `<tr>
              <td><span style="font-weight:700;color:var(--text3)">${index + 1}</span></td>
              <td><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">${
                event.emoji || '🎪'
              }</span><div><div style="font-weight:600;font-size:13.5px">${
                event.title
              }</div><div class="small">${event.date}</div></div></div></td>
              <td><span class="badge badge-purple">${event.category}</span></td>
              <td><strong style="color:var(--blue)">${event.registered}</strong></td>
              <td class="small">${event.capacity}</td>
              <td><strong style="color:var(--green)">₹${evRev.toLocaleString()}</strong></td>
              <td><span class="badge badge-${evStatBadge(event.status)}">${event.status}</span></td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- All Events Revenue breakdown -->
  <div class="card">
    <div style="font-family:var(--font-head);font-size:15px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px">
      <span style="background:var(--green-dim);color:var(--green);padding:5px 7px;border-radius:8px">📊</span> All Events Revenue Breakdown
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Event</th><th>Price</th><th>Registrations</th><th>Revenue</th><th>Occupancy</th></tr></thead>
        <tbody>
          ${allEvents
            .map(event => {
              const evRegs = allRegs.filter(registration => registration.eventId === event.id);
              const evRev2 = evRegs.reduce(
                (total, registration) => total + (registration.amount || 0),
                0
              );
              const occ = Math.round((event.registered / Math.max(event.capacity, 1)) * 100);
              return `<tr>
              <td><div style="font-weight:500">${event.title}</div></td>
              <td>${
                event.price === 0
                  ? '<span class="badge badge-green">Free</span>'
                  : '₹' + event.price
              }</td>
              <td><strong>${evRegs.length}</strong></td>
              <td style="color:var(--green);font-weight:700">₹${evRev2.toLocaleString()}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:6px;background:var(--surface3);border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${occ}%;background:${
                occ >= 80 ? 'var(--green)' : occ >= 50 ? 'var(--yellow)' : 'var(--red)'
              };border-radius:99px"></div>
                  </div>
                  <span style="font-size:12px;font-weight:600;color:var(--text2);min-width:32px">${occ}%</span>
                </div>
              </td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </div>`;
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Reports & Analytics</div><div class="page-sub">Platform-wide statistics for super administration</div></div>
    <div class="page-hd-right">
      <button class="btn btn-ghost" onclick="toast('Export feature coming soon','info')">📥 Export</button>
    </div>
  </div>

  <div style="display:flex;gap:4px;background:var(--surface2);border-radius:12px;padding:4px;margin-bottom:28px;border:1px solid var(--border)">
    <button onclick="switchReportTab('users')" style="flex:1;padding:10px 20px;border-radius:9px;font-weight:600;font-size:13.5px;transition:all 0.2s;border:none;cursor:pointer;background:${
      tab === 'users' ? 'var(--accent)' : 'transparent'
    };color:${tab === 'users' ? '#fff' : 'var(--text2)'}">
      👥 User Statistics
    </button>
    <button onclick="switchReportTab('events')" style="flex:1;padding:10px 20px;border-radius:9px;font-weight:600;font-size:13.5px;transition:all 0.2s;border:none;cursor:pointer;background:${
      tab === 'events' ? 'var(--accent)' : 'transparent'
    };color:${tab === 'events' ? '#fff' : 'var(--text2)'}">
      📊 Event Analytics
    </button>
  </div>


  ${tab === 'users' ? userStatsContent : eventStatsContent}
`;
    }

    // ── NON-SUPERUSER: original client report view ──────
    const tab = sessionStorage.getItem('reports_tab') || 'client';
    const myEvents =
      CU.role === 'organizer' ? DB.events.filter(event => event.organizer === CU.id) : DB.events;
    const completedEvents = myEvents.filter(event => event.status === 'completed').length;
    const eventIds = myEvents.map(event => String(event.id));
    const eventReports = DB.reports.filter(report => eventIds.includes(String(report.eventId)));
    const clientReports =
      CU.role === 'organizer'
        ? eventReports.filter(report => String(report.submittedBy) === String(CU.id))
        : eventReports;
    const pendingClientEvents = myEvents.filter(
      event =>
        event.status === 'completed' &&
        !clientReports.some(report => String(report.eventId) === String(event.id))
    );
    const pendingReports = pendingClientEvents.length;
    const submittedReports = clientReports.length;
    const clientReportContent = `
    <div class="grid-3 mb-24">
      <div class="stat-card" style="border: 1px solid var(--blue-dim); background: rgba(66, 153, 225, 0.05); padding: 16px;">
        <div class="small" style="color:var(--blue); font-weight:600; margin-bottom: 12px">Total Completed</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--blue);color:#fff;margin:0;font-size:16px;border-radius:50%">✓</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${completedEvents}</div>
            <div class="small" style="color:var(--text2)">Total events</div>
          </div>
        </div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--green-dim); background: rgba(34, 211, 165, 0.05); padding: 16px;">
        <div class="small" style="color:var(--green); font-weight:600; margin-bottom: 12px">Reports Submitted</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--green);color:#fff;margin:0;font-size:15px;border-radius:8px">📄</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${submittedReports}</div>
            <div class="small" style="color:var(--text2)">Reports submitted</div>
          </div>
        </div>
      </div>
      <div class="stat-card" style="border: 1px solid var(--orange-dim); background: rgba(237, 137, 54, 0.05); padding: 16px;">
        <div class="small" style="color:var(--orange); font-weight:600; margin-bottom: 12px">Pending Submissions</div>
        <div style="display:flex; align-items:center; gap: 12px;">
          <div class="stat-icon" style="background:var(--orange);color:#fff;margin:0;font-size:16px;border-radius:50%">🕒</div>
          <div>
            <div class="stat-value" style="color:var(--text);font-size:24px;margin:0">${pendingReports}</div>
            <div class="small" style="color:var(--text2)">Reports pending</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="h4 mb-16" style="display:flex;align-items:center;gap:8px"><span style="color:var(--orange);font-size:18px">⭕</span> Pending Submissions</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      ${pendingClientEvents
        .map(event => {
          const recipient = getEventReportRecipients(event)[0];
          return `
        <div class="card" style="background:var(--surface); border:1px solid var(--border); padding:20px; border-radius:12px;">
          <div style="font-weight:700;font-size:16px;margin-bottom:12px;color:var(--text)">${
            event.title
          }</div>
          <div style="display:flex;flex-wrap:wrap;gap:24px;margin-bottom:16px;color:var(--text2);font-size:13px">
            <div style="display:flex;align-items:center;gap:6px"><span>📅</span> ${event.date}</div>
            <div style="display:flex;align-items:center;gap:6px"><span>📍</span> ${
              event.venue || event.city || 'Location'
            }</div>
            <div style="display:flex;align-items:center;gap:6px"><span>👥</span> ${
              DB.registrations.filter(registration => registration.eventId === event.id).length
            } Attendees</div>
                      </div>
          <div class="small mb-12"><strong>Send to:</strong> ${reportContactHtml(
            recipient?.id,
            'No requesting client linked'
          )}</div>
          <div class="flex gap-12">
            <button class="btn btn-primary" onclick="openSubmitReportModal('${event.id}')" ${
            recipient ? '' : 'disabled'
          } style="gap:6px; background:var(--accent); border-radius:8px">📤 Submit Report</button>
            <button class="btn btn-ghost" onclick="openViewEventDrawer('${
              event.id
            }')" style="color:var(--accent);border-color:var(--accent-dim);background:var(--accent-dim);gap:6px; border-radius:8px">👁 View Event Details</button>
          </div>
        </div>
      `;
        })
        .join('')}
      ${
        pendingReports === 0
          ? `<div class="empty"><div class="empty-icon">✓</div><div class="empty-title">All Reports Submitted</div><p class="empty-desc">Great job! All your completed events have reports.</p></div>`
          : ''
      }
    </div>
    <div class="h4 mb-16" style="margin-top:28px">Submitted Reports</div>
    <div class="table-wrap">
      ${
        clientReports.length === 0
          ? `<div class="empty"><div class="empty-icon">📄</div><div class="empty-title">No submitted reports yet</div></div>`
          : `
      <table>
        <thead><tr><th>Event</th><th>Report File</th><th>Sent To</th><th>Submitted At</th></tr></thead>
        <tbody>${clientReports
          .map(report => {
            const event = myEvents.find(item => String(item.id) === String(report.eventId));
            return `<tr>
            <td>${event ? escapeHtml(event.title) : 'Unknown event'}</td>
            <td>${renderOrganizerReportFile(report)}</td>
            <td>${reportContactHtml(report.recipientId, 'Recipient not recorded')}</td>
            <td>${escapeHtml(report.submittedAt || '—')}</td>
          </tr>`;
          })
          .join('')}</tbody>
      </table>`
      }
    </div>
  `;
    return `
  <div style="padding:24px;background:var(--bg);">
    <div class="page-hd" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
      <div class="page-hd-left">
        <div class="page-title">Event Reports</div>
        <div class="page-sub">Send completed-event reports to the requesting client and review submitted files</div>
      </div>
      <div class="page-hd-right">
        <button class="btn" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);font-weight:600;padding:8px 16px;border-radius:8px;gap:8px" onclick="toast('${completedEvents} Completed Events','info')"><span style="font-size:16px;color:var(--accent)">📄</span> ${completedEvents} Completed Events</button>
      </div>
    </div>
    ${clientReportContent}
  </div>
  `;
  }
  /* PORTAL_RUNTIME_END */
}
export default function ReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
