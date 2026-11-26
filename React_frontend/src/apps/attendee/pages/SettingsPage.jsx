import AccountSettingsPage from '../../../app/components/AccountSettingsPage.jsx';

// Keep the original page import available to callers that pass attendee action props.
// The authenticated page container renders AccountSettingsPage directly.
export default function SettingsPage({
  user = {}, onSaveSettings, onChangePassword, onNavigate, onSignOut, preferenceControls,
}) {
  return (
    <AccountSettingsPage
      user={user}
      roleLabel="Attendee"
      preferenceControls={preferenceControls}
      actions={{
        onSaveSettings,
        onChangePass: onChangePassword,
        onNavigate,
        onSignOut,
      }}
    />
  );
}
