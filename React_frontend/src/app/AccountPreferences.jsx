const fields = [
  ['emailNotifications', 'Email Notifications', true],
  ['smsReminders', 'SMS Reminders', false],
  ['eventRecommendations', 'Event Recommendations', true],
];

export default function AccountPreferences({ user, controls }) {
  return (
    <div className="card">
      <div className="h4 mb-16">Preferences</div>
      {fields.map(([key, label, defaultValue]) => {
        const checked = user.preferences?.[key] ?? defaultValue;
        return (
          <div className="info-row" key={key}>
            <span className="info-label">{label}</span>
            <button
              type="button"
              role="switch"
              aria-label={label}
              aria-checked={checked}
              className={`toggle${checked ? ' on' : ''}`}
              disabled={!controls?.onSave || controls.pending}
              onClick={() => controls.onSave({ [key]: !checked })}
            />
          </div>
        );
      })}
      {controls?.error && <p role="alert">{controls.error}</p>}
    </div>
  );
}
