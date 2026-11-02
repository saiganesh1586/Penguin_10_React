import AccountSettingsPage from '../../../app/AccountSettingsPage.jsx';
import { useAdminContext } from '../context/AdminContext.jsx';
export default function SettingsPage() {
  const { CU: user, ROLE_LABELS, actions } = useAdminContext();
  return (
    <AccountSettingsPage
      user={user}
      roleLabel={ROLE_LABELS[user.role]}
      admin
      onSaveSettings={actions.onSaveSettings}
      onChangePassword={actions.onChangePass}
      onSignOut={actions.onSignOut}
      onValidationError={actions.onValidationError}
    />
  );
}
