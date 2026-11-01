import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageProfile() {
    if (isDepartmentEmployee()) return pageDepartmentEmployeeProfile();
    const regs =
      CU.role === 'attendee'
        ? DB.registrations.filter(registration => registration.attendeeId === CU.id)
        : [];
    const myEvs =
      CU.role === 'organizer' ? DB.events.filter(event => event.organizer === CU.id) : [];
    const isSF = CU.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE';
    const sfSupportHandled = (DB.supportRequests || []).length;
    const sfResolved = (DB.supportRequests || []).filter(
      r => r.status === 'Resolved' || r.status === 'Closed'
    ).length;
    const sfTxnsReviewed = (DB.financeTransactions || []).length;
    const sfReportsSubmitted = (DB.operationalReports || []).filter(
      r => r.status === 'Submitted' || r.status === 'Reviewed'
    ).length;
    return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">My Profile</div></div><div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('settings')">✏️ Edit Profile</button></div></div>
  <div class="profile-banner">
    ${
      CU.avatarImage
        ? `<div class="av av-xl"><img src="${CU.avatarImage}" alt="${
            CU.name
          }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${
            CU.avatar || CU.name[0]
          }</span></div>`
        : `<div class="av av-xl">${CU.avatar || CU.name[0]}</div>`
    }
    <div class="profile-info">
      <div class="profile-name">${CU.name}</div>
      <div class="profile-role-tag">${
        isSF ? 'Customer Support &amp; Finance Executive' : ROLE_LABELS[CU.role]
      }</div>
      ${CU.company ? `<div class="small mt-4">${CU.company}</div>` : ''}
      ${
        CU.specialization
          ? `<div class="small mt-4">Specialization: ${CU.specialization}</div>`
          : ''
      }
      ${CU.service ? `<div class="small mt-4">Service: ${CU.service}</div>` : ''}
      <span class="badge badge-green mt-8">Active Account</span>
    </div>
  </div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card">
      <div class="h4 mb-14">Contact Information</div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${
        CU.email
      }</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${
        CU.phone || 'Not set'
      }</span></div>
      <div class="info-row"><span class="info-label">Member Since</span><span class="info-value">${
        CU.joined || '—'
      }</span></div>
      <div class="info-row"><span class="info-label">Role</span><span class="info-value"><span class="badge badge-${
        ROLE_COLORS[CU.role]
      }">${isSF ? 'Customer Support &amp; Finance Executive' : CU.role}</span></span></div>
      ${
        CU.bio
          ? `<div class="mt-14"><div class="label mb-8">Bio</div><p style="font-size:13.5px;color:var(--text2);line-height:1.7">${CU.bio}</p></div>`
          : ''
      }
    </div>
    <div>
      ${
        isSF
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Work Summary</div>
        <div class="info-row"><span class="info-label">Support Requests Handled</span><span class="info-value" style="color:var(--accent);font-weight:700">${sfSupportHandled}</span></div>
        <div class="info-row"><span class="info-label">Issues Resolved</span><span class="info-value" style="color:var(--green);font-weight:700">${sfResolved}</span></div>
        <div class="info-row"><span class="info-label">Transactions Reviewed</span><span class="info-value" style="color:var(--blue);font-weight:700">${sfTxnsReviewed}</span></div>
        <div class="info-row"><span class="info-label">Reports Submitted</span><span class="info-value" style="color:var(--purple);font-weight:700">${sfReportsSubmitted}</span></div>
      </div>`
          : CU.role === 'attendee'
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Activity Summary</div>
        <div class="info-row"><span class="info-label">Events Registered</span><span class="info-value">${
          regs.length
        }</span></div>
        <div class="info-row"><span class="info-label">Upcoming Events</span><span class="info-value" style="color:var(--accent)">${
          regs.filter(registration => {
            const event = DB.events.find(currentEvent => currentEvent.id === registration.eventId);
            return event && event.status === 'upcoming';
          }).length
        }</span></div>
        <div class="info-row"><span class="info-label">Events Attended</span><span class="info-value" style="color:var(--green)">${
          regs.filter(registration => registration.checkedIn).length
        }</span></div>
        <div class="info-row"><span class="info-label">Total Spent</span><span class="info-value" style="color:var(--green);font-weight:700">₹${regs.reduce(
          (total, registration) => total + registration.amount,
          0
        )}</span></div>
      </div>`
          : CU.role === 'organizer'
          ? `<div class="card mb-16">
        <div class="h4 mb-14">Event Summary</div>
        <div class="info-row"><span class="info-label">Total Events</span><span class="info-value">${
          myEvs.length
        }</span></div>
        <div class="info-row"><span class="info-label">Upcoming</span><span class="info-value" style="color:var(--accent)">${
          myEvs.filter(e => e.status === 'upcoming').length
        }</span></div>
        <div class="info-row"><span class="info-label">Completed</span><span class="info-value" style="color:var(--green)">${
          myEvs.filter(e => e.status === 'completed').length
        }</span></div>
      </div>`
          : ''
      }
      <div class="card">
        <div class="h4 mb-14">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-ghost w-full" onclick="goNav('settings')">⚙️ Account Settings</button>
          <button class="btn btn-danger w-full" onclick="doLogout()">🚪 Sign Out</button>
        </div>
      </div>
    </div>
  </div>`;
  }
  /* PORTAL_RUNTIME_END */
}
export default function ProfilePage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
