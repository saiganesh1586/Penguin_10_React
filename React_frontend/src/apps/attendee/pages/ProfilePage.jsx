import React, { useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ProfileAvatar from '../components/ProfileAvatar.jsx';
import { ErrorState, LoadingState } from '../components/PageFeedback.jsx';

function ContactInformation({ user }) {
  return (
    <div className="card">
      <div className="h4 mb-14">Contact Information</div>
      <div className="info-row">
        <span className="info-label">Email</span>
        <span className="info-value">{user.email}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Phone</span>
        <span className="info-value">{user.phone || user.phoneNo || 'Not set'}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Member Since</span>
        <span className="info-value">{user.joined || user.createdAt?.slice(0, 10) || '—'}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Role</span>
        <span className="info-value">
          <span className="badge badge-blue">attendee</span>
        </span>
      </div>
      {user.bio && (
        <div className="mt-14">
          <div className="label mb-8">Bio</div>
          <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 }}>{user.bio}</p>
        </div>
      )}
    </div>
  );
}

function ActivitySummary({ registered, upcoming, attended, spent }) {
  return (
    <div className="card mb-16">
      <div className="h4 mb-14">Activity Summary</div>
      <div className="info-row">
        <span className="info-label">Events Registered</span>
        <span className="info-value">{registered}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Upcoming Events</span>
        <span className="info-value" style={{ color: 'var(--accent)' }}>
          {upcoming}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">Events Attended</span>
        <span className="info-value" style={{ color: 'var(--green)' }}>
          {attended}
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">Total Spent</span>
        <span className="info-value" style={{ color: 'var(--green)', fontWeight: 700 }}>
          ₹{spent}
        </span>
      </div>
    </div>
  );
}

export default function ProfilePage({
  user = {},
  events = [],
  registrations = [],
  loading = false,
  error = '',
  onRetry,
  onNavigate,
  onSignOut,
}) {
  const activity = useMemo(() => {
    const active = registrations.filter(item => item.status !== 'waitlisted');
    const upcoming = active.filter(
      registration =>
        events.find(event => String(event.id || event.eventId) === String(registration.eventId))
          ?.status === 'upcoming' || registration.event?.status === 'upcoming'
    ).length;
    return {
      registered: active.length,
      upcoming,
      attended: active.filter(item => item.checkedIn).length,
      spent: active.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [events, registrations]);

  if (loading) return <LoadingState icon="👤" title="Loading profile…" />;
  if (error)
    return <ErrorState title="Profile could not be loaded" message={error} onRetry={onRetry} />;

  return (
    <>
      <PageHeader
        title="My Profile"
        action={
          <button className="btn btn-ghost" onClick={() => onNavigate?.('settings')}>
            ✏️ Edit Profile
          </button>
        }
      />
      <div className="profile-banner">
        <ProfileAvatar name={user.name} image={user.avatarImage} fallback={user.avatar} />
        <div className="profile-info">
          <div className="profile-name">{user.name}</div>
          <div className="profile-role-tag">Attendee</div>
          {user.company && <div className="small mt-4">{user.company}</div>}
          {user.specialization && (
            <div className="small mt-4">Specialization: {user.specialization}</div>
          )}
          {user.service && <div className="small mt-4">Service: {user.service}</div>}
          <span className="badge badge-green mt-8">Active Account</span>
        </div>
      </div>
      <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
        <ContactInformation user={user} />
        <div>
          <ActivitySummary {...activity} />
          <div className="card">
            <div className="h4 mb-14">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-ghost w-full" onClick={() => onNavigate?.('settings')}>
                ⚙️ Account Settings
              </button>
              <button className="btn btn-danger w-full" onClick={onSignOut}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
