import { useState } from 'react';
import { validateProfile, validatePassword } from './settingsValidation.js';
import PageHeader from '../apps/attendee/components/PageHeader.jsx';
import ProfileAvatar from '../apps/attendee/components/ProfileAvatar.jsx';
function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline,
  maxLength,
  invalid,
}) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          className="form-control"
          id={id}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          aria-invalid={invalid || undefined}
        />
      ) : (
        <input
          className="form-control"
          id={id}
          type={type}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

// Roles share the attendee form pattern, while retaining their labels and field options.
export default function AccountSettingsPage({
  user,
  roleLabel,
  admin = false,
  onSaveSettings,
  onChangePassword,
  onSignOut,
  onValidationError,
}) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || (admin ? user.phoneNo : '') || '',
    bio: user.bio || '',
  });
  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [displayName, setDisplayName] = useState(user.name);
  const [preferences, setPreferences] = useState([true, false, true]);
  const [errors, setErrors] = useState({
    profile: '',
    password: '',
  });
  const updateProfile = field => event =>
    setProfile(current => ({
      ...current,
      [field]: event.target.value,
    }));
  const updatePassword = field => event =>
    setPassword(current => ({
      ...current,
      [field]: event.target.value,
    }));
  async function saveProfile(event) {
    event.preventDefault();
    const error = validateProfile(profile);
    setErrors(current => ({
      ...current,
      profile: error,
    }));
    if (error) {
      onValidationError?.(error);
      return;
    }
    if (await onSaveSettings(profile)) setDisplayName(profile.name);
  }
  async function savePassword(event) {
    event.preventDefault();
    const error = validatePassword(password);
    setErrors(current => ({
      ...current,
      password: error,
    }));
    if (error) {
      onValidationError?.(error);
      return;
    }
    if (await onChangePassword(password))
      setPassword({
        current: '',
        next: '',
        confirm: '',
      });
  }
  return (
    <>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your personal information and account preferences."
      />
      <div
        className="grid-2"
        style={{
          alignItems: 'start',
          gap: 20,
        }}
      >
        <form className="card card-lg" noValidate onSubmit={saveProfile}>
          <div className="h4 mb-20">Personal Information</div>
          <div
            className="profile-banner"
            style={{
              marginBottom: 20,
              padding: 18,
            }}
          >
            <ProfileAvatar
              size="av-lg"
              name={displayName}
              image={admin ? undefined : user.avatarImage}
              fallback={user.avatar || displayName[0]}
            />
            <div>
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {displayName}
              </div>
              <div className="small">{roleLabel}</div>
            </div>
          </div>
          <Field
            id="st-name"
            label="Full Name"
            value={profile.name}
            onChange={updateProfile('name')}
            invalid={Boolean(errors.profile)}
          />
          <Field
            id="st-email"
            label="Email Address"
            type={admin ? 'email' : 'text'}
            value={profile.email}
            onChange={updateProfile('email')}
            invalid={Boolean(errors.profile)}
          />
          <Field
            id="st-phone"
            label="Phone Number"
            value={profile.phone}
            onChange={updateProfile('phone')}
            invalid={Boolean(errors.profile)}
          />
          <Field
            id="st-bio"
            label="Bio"
            value={profile.bio}
            onChange={updateProfile('bio')}
            multiline
            maxLength={admin ? 2000 : undefined}
            invalid={Boolean(errors.profile)}
          />
          <button
            className="btn btn-primary w-full"
            style={{
              justifyContent: 'center',
            }}
            type="submit"
          >
            Save Changes
          </button>
        </form>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <form className="card card-lg" noValidate onSubmit={savePassword}>
            <div className="h4 mb-20">Change Password</div>
            <Field
              id="st-cur"
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={password.current}
              onChange={updatePassword('current')}
              invalid={Boolean(errors.password)}
            />
            <Field
              id="st-new"
              label="New Password"
              type="password"
              placeholder="Min 6 characters"
              value={password.next}
              onChange={updatePassword('next')}
              invalid={Boolean(errors.password)}
            />
            <Field
              id="st-conf"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={password.confirm}
              onChange={updatePassword('confirm')}
              invalid={Boolean(errors.password)}
            />
            <button
              className="btn btn-primary w-full"
              style={{
                justifyContent: 'center',
              }}
              type="submit"
            >
              Update Password
            </button>
          </form>
          {!admin && (
            <div className="card">
              <div className="h4 mb-16">Preferences</div>
              {['Email Notifications', 'SMS Reminders', 'Event Recommendations'].map(
                (label, index) => (
                  <div className="info-row" key={label}>
                    <span className="info-label">{label}</span>
                    <div
                      className={`toggle${preferences[index] ? ' on' : ''}`}
                      onClick={() =>
                        setPreferences(current =>
                          current.map((value, position) => (position === index ? !value : value))
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          )}
          <div className="card">
            <button
              className="btn btn-danger w-full mb-8"
              style={{
                justifyContent: 'center',
              }}
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
