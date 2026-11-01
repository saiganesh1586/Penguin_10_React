import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageSettings() {
    return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Account Settings</div><div class="page-sub">Manage your personal information and account preferences.</div></div></div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card card-lg">
      <div class="h4 mb-20">Personal Information</div>
      <div class="profile-banner" style="margin-bottom:20px;padding:18px">
        ${
          CU.avatarImage
            ? `<div class="av av-lg"><img src="${CU.avatarImage}" alt="${
                CU.name
              }" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${
                CU.avatar || CU.name[0]
              }</span></div>`
            : `<div class="av av-lg">${CU.avatar || CU.name[0]}</div>`
        }
        <div><div style="font-weight:700">${CU.name}</div><div class="small">${
      ROLE_LABELS[CU.role]
    }</div></div>
      </div>
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="st-name" value="${
        CU.name
      }"></div>
      <div class="form-group"><label class="form-label">Email Address</label><input class="form-control" id="st-email" value="${
        CU.email
      }"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" id="st-phone" value="${
        CU.phone || ''
      }"></div>
      <div class="form-group"><label class="form-label">Bio</label><textarea class="form-control" id="st-bio">${
        CU.bio || ''
      }</textarea></div>
      <button class="btn btn-primary w-full" onclick="saveSettings()" style="justify-content:center">Save Changes</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card card-lg">
        <div class="h4 mb-20">Change Password</div>
        <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" id="st-cur" type="password" placeholder="Enter current password"></div>
        <div class="form-group"><label class="form-label">New Password</label><input class="form-control" id="st-new" type="password" placeholder="Min 6 characters"></div>
        <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-control" id="st-conf" type="password" placeholder="Re-enter new password"></div>
        <button class="btn btn-primary w-full" onclick="changePass()" style="justify-content:center">Update Password</button>
      </div>
      <div class="card">
        <div class="h4 mb-16">Preferences</div>
        <div class="info-row"><span class="info-label">Email Notifications</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        <div class="info-row"><span class="info-label">SMS Reminders</span><div class="toggle" onclick="this.classList.toggle('on')"></div></div>
        <div class="info-row"><span class="info-label">Event Recommendations</span><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      </div>
      <div class="card">
        <button class="btn btn-danger w-full mb-8" onclick="doLogout()" style="justify-content:center">Sign Out</button>
      </div>
    </div>
  </div>`;
  }
  /* PORTAL_RUNTIME_END */
}

export default function SettingsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
