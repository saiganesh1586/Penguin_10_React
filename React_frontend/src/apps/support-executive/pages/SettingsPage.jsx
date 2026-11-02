import AccountSettingsPage from '../../../app/AccountSettingsPage.jsx';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
export default function SettingsPage() {
  const { CU: user, ROLE_LABELS, actions } = useSupportExecutiveContext();
  return (
    <AccountSettingsPage
      user={user}
      roleLabel={ROLE_LABELS[user.role]}
      onSaveSettings={actions.onSaveSettings}
      onChangePassword={actions.onChangePass}
      onSignOut={actions.onSignOut}
      onValidationError={actions.onValidationError}
    />
  );
}
