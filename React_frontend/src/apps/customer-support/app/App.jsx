import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { workspaceFor } from '../../../store/session.js';
import { logout, selectSession } from '../../../store/slices/authSlice.js';
import { canRequestSupport } from '../utils/supportConfig.js';
import CustomerSupportPage from '../pages/CustomerSupportPage.jsx';
import PortalProvider from '../../../store/Provider.jsx';
import '../../attendee/styles/attendee.css';

function CustomerSupportContent() {
  const user = useSelector(selectSession);
  const dispatch = useDispatch();

  if (!user?.token) return <Navigate to="/landing" replace />;
  if (!canRequestSupport(user)) return <Navigate to={workspaceFor(user)} replace />;
  return (
    <main className="support-standalone" id="page-content">
      <CustomerSupportPage onSignOut={() => dispatch(logout())} />
    </main>
  );
}

export default function CustomerSupportWorkspace() {
  return (
    <PortalProvider>
      <CustomerSupportContent />
    </PortalProvider>
  );
}
