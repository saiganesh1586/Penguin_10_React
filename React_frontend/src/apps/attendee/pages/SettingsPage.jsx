import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */    function pageSettings() {
      return `
  <div class="page-hd"><div class="page-hd-left"><div class="page-title">Account Settings</div><div class="page-sub">Manage your personal information and account preferences.</div></div></div>
  <div class="grid-2" style="align-items:start;gap:20px">
    <div class="card card-lg">
      <div class="h4 mb-20">Personal Information</div>
      <div class="profile-banner" style="margin-bottom:20px;padding:18px">
        ${CU.avatarImage ? `<div class="av av-lg"><img src="${CU.avatarImage}" alt="${CU.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">${CU.avatar || CU.name[0]}</span></div>` : `<div class="av av-lg">${CU.avatar || CU.name[0]}</div>`}
        <div><div style="font-weight:700">${CU.name}</div><div class="small">${ROLE_LABELS[CU.role]}</div></div>
      </div>
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="st-name" value="${CU.name}"></div>
      <div class="form-group"><label class="form-label">Email Address</label><input class="form-control" id="st-email" value="${CU.email}"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" id="st-phone" value="${CU.phone || ''}"></div>
      <div class="form-group"><label class="form-label">Bio</label><textarea class="form-control" id="st-bio">${CU.bio || ''}</textarea></div>
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
    function saveSettings() {
      const name = v('st-name'), email = v('st-email'), phone = v('st-phone'), bio = v('st-bio');
      if (!name) { toast('Name is required', 'error'); return; }
      if (!email || !email.includes('@')) { toast('Enter a valid email', 'error'); return; }
      if (window.EventFlowAccountPolicy.isEmailInUse(DB.users, email, CU.id || CU.userId)) { toast('Email already registered', 'error'); return; }
      CU.name = name; CU.email = email; CU.phone = phone; CU.bio = bio;
      CU.avatar = (name.split(' ').map(n => n[0]).join('').toUpperCase()).slice(0, 2);
      const u = DB.users.find(u => u.id === CU.id);
      if (u) { Object.assign(u, { name, email, phone, bio, avatar: CU.avatar }); }
      g('sb-name').textContent = name;
      updateHeaderUser();
      g('sb-av').textContent = CU.avatar;
      toast('Settings saved successfully!', 'success');
    }
    function changePass() {
      const cur = v('st-cur'), nw = v('st-new'), conf = v('st-conf');
      if (!cur || !nw || !conf) { toast('Fill all password fields', 'error'); return; }
      if (cur !== CU.password) { toast('Current password is incorrect', 'error'); return; }
      if (nw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
      if (nw !== conf) { toast('Passwords do not match', 'error'); return; }
      CU.password = nw;
      const u = DB.users.find(u => u.id === CU.id);
      if (u) u.password = nw;
      ['st-cur', 'st-new', 'st-conf'].forEach(id => { const el = g(id); if (el) el.value = ''; });
      toast('Password changed successfully!', 'success');
    }

    // ════════════════════════════════════════════════
    //  CLIENT PAGES
    // ════════════════════════════════════════════════
/* ATTENDEE_RUNTIME_END */
}

export default function SettingsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
