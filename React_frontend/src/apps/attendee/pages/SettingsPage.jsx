import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';

function Field({ id, label, value, onChange, type = 'text', placeholder, multiline = false }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea className="form-control" id={id} value={value} onChange={onChange} />
      ) : (
        <input
          className="form-control"
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

export default function SettingsPage({ user = {}, onSaveSettings, onChangePassword, onSignOut }) {
  const [profile, setProfile] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || user.phoneNo || '',
    bio: user.bio || '',
  });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [displayName, setDisplayName] = useState(user.name || '');
  const [preferences, setPreferences] = useState([true, false, true]);
  const updateProfile = field => event =>
    setProfile(current => ({ ...current, [field]: event.target.value }));
  const updatePassword = field => event =>
    setPassword(current => ({ ...current, [field]: event.target.value }));

  async function saveProfile() {
    if (await onSaveSettings?.(profile)) setDisplayName(profile.name);
  }

  async function savePassword() {
    if (await onChangePassword?.(password)) setPassword({ current: '', next: '', confirm: '' });
  }

  function togglePreference(index) {
    setPreferences(current =>
      current.map((value, position) => (position === index ? !value : value))
    );
  }

  return (
    <>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your personal information and account preferences."
      />
      <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
        <div className="card card-lg">
          <div className="h4 mb-20">Personal Information</div>
          <div className="profile-banner" style={{ marginBottom: 20, padding: 18 }}>
            <ProfileAvatar
              size="av-lg"
              name={displayName}
              image={user.avatarImage}
              fallback={displayName
                .split(' ')
                .map(part => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            />
            <div>
              <div style={{ fontWeight: 700 }}>{displayName}</div>
              <div className="small">Attendee</div>
            </div>
          </div>
          <Field
            id="st-name"
            label="Full Name"
            value={profile.name}
            onChange={updateProfile('name')}
          />
          <Field
            id="st-email"
            label="Email Address"
            value={profile.email}
            onChange={updateProfile('email')}
          />
          <Field
            id="st-phone"
            label="Phone Number"
            value={profile.phone}
            onChange={updateProfile('phone')}
          />
          <Field
            id="st-bio"
            label="Bio"
            value={profile.bio}
            onChange={updateProfile('bio')}
            multiline
          />
          <button
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center' }}
            onClick={saveProfile}
          >
            Save Changes
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-lg">
            <div className="h4 mb-20">Change Password</div>
            <Field
              id="st-cur"
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={password.current}
              onChange={updatePassword('current')}
            />
            <Field
              id="st-new"
              label="New Password"
              type="password"
              placeholder="Min 6 characters"
              value={password.next}
              onChange={updatePassword('next')}
            />
            <Field
              id="st-conf"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={password.confirm}
              onChange={updatePassword('confirm')}
            />
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              onClick={savePassword}
            >
              Update Password
            </button>
          </div>
          <div className="card">
            <div className="h4 mb-16">Preferences</div>
            {['Email Notifications', 'SMS Reminders', 'Event Recommendations'].map(
              (label, index) => (
                <div className="info-row" key={label}>
                  <span className="info-label">{label}</span>
                  <div
                    className={`toggle${preferences[index] ? ' on' : ''}`}
                    onClick={() => togglePreference(index)}
                  />
                </div>
              )
            )}
          </div>
          <div className="card">
            <button
              className="btn btn-danger w-full mb-8"
              style={{ justifyContent: 'center' }}
              onClick={onSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
