import { Navigate } from 'react-router-dom';
import useStoredSession from '../hooks/useStoredSession.js';
import { workspaceFor } from '../../../app/session.js';
import { canRequestSupport } from '../utils/supportConfig.js';
import CustomerSupportPage from '../pages/CustomerSupportPage.jsx';
import '../../attendee/styles/attendee.css';

export default function CustomerSupportWorkspace() {
  const { user, signOut } = useStoredSession();
  if (!user?.token) return <Navigate to="/landing" replace />;
  if (!canRequestSupport(user)) return <Navigate to={workspaceFor(user)} replace />;
  return <main className="support-standalone" id="page-content"><CustomerSupportPage user={user} onSignOut={signOut} /></main>;
}
