import DashboardLayout from '../../../app/components/DashboardLayout.jsx';
import PublicHomePage from '../../landing/pages/PortalPublicHomePage.jsx';
import LoginPage from '../../auth/pages/UnifiedAuthPage.jsx';
import FindEventsPage from '../../landing/pages/FindEventsPage.jsx';
import GalleryPage from '../../landing/pages/GalleryPage.jsx';
import AboutPage from '../../landing/pages/AboutPage.jsx';
import ContactPage from '../../landing/pages/ContactPage.jsx';
import LegacyRuntime from '../../../app/runtime/LegacyRuntime.jsx';
import runtime from './runtime.js?raw';
import portalApi from '../api/portal-api.js?raw';
import portalState from '../../../app/runtime/portal-state.js?raw';
import ToastHost from '../../../app/components/ToastHost.jsx';
import { useSelector } from 'react-redux';
import { selectSession } from '../../../store/slices/authSlice.js';
import '../styles/organizer.css';
import OrganizerPageContainer, { organizerPageNames } from './OrganizerPageContainer.jsx';
import createPageBridge from '../../../app/createPageBridge.jsx';
const organizerPages = createPageBridge(OrganizerPageContainer, organizerPageNames);
const source = runtime
  .replace('/* PORTAL_SECTION_api */', () => portalApi)
  .replace('/* PORTAL_SECTION_state */', () => portalState);
export default function OrganizerWorkspace() {
  const account = useSelector(selectSession);
  const avatar = account?.avatar && account.avatar !== '?' ? account.avatar : '👤';
  if (typeof window !== 'undefined') {
    window.EventFlowOrganizerPages = organizerPages;
    window.EventFlowReactPages = organizerPages;
  }
  return (
    <>
      <PublicHomePage />

      <LoginPage workspace="organizer" />

      <FindEventsPage />

      <GalleryPage />

      <AboutPage />

      <ContactPage />

      <DashboardLayout
        sidebar={
          <>
            <div className="sb-logo">
              <div className="sb-logo-mark">
                <span className="brand-logo">
                  <span className="brand-logo-art">
                    <img
                      src="/assets/images/eventflow-logo.png"
                      alt="EventFlow"
                      width="2172"
                      height="724"
                      decoding="async"
                    />
                  </span>
                </span>
              </div>
            </div>
            <nav className="sb-nav" id="sb-nav"></nav>
            <div className="sb-bottom">
              <button
                type="button"
                className="sb-user"
                aria-label="Account settings"
                aria-describedby="sb-name sb-role-lbl"
                title="Account settings"
                onClick={() => window.goNav('settings')}
              >
                <span className="av" id="sb-av" aria-hidden="true">
                  {avatar}
                </span>
                <span className="sb-user-info">
                  <span className="sb-user-name" id="sb-name">
                    {account?.name || 'Organizer'}
                  </span>
                  <span className="sb-user-role" id="sb-role-lbl">
                    Event Organizer
                  </span>
                </span>
                <span className="sb-user-action" aria-hidden="true">
                  ⚙️
                </span>
              </button>
            </div>
          </>
        }
        navbar={
          <>
            <div className="topbar-title" id="topbar-title">
              User
            </div>
            <div className="topbar-right">
              <button className="notif-trigger" onClick={() => window.goNav('notifications')}>
                🔔<span className="notif-badge" id="notif-count-dot"></span>
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.doLogout()}>
                Sign Out
              </button>
            </div>
          </>
        }
      />

      <div className="overlay" id="modal-overlay" onClick={event => window.closeModalOnBg(event)}>
        <div className="modal-box" id="modal-box">
          <div className="modal-head">
            <span className="modal-title" id="modal-title"></span>
            <button className="modal-close-btn" onClick={() => window.closeModal()}>
              ✕
            </button>
          </div>
          <div className="modal-body" id="modal-body"></div>
          <div className="modal-foot" id="modal-foot"></div>
        </div>
      </div>

      <div
        className="overlay"
        id="confirm-overlay"
        onClick={event => window.closeConfirmOnBg(event)}
      >
        <div
          className="modal-box"
          style={{
            maxWidth: '360px',
          }}
        >
          <div className="modal-head">
            <span className="modal-title" id="confirm-title">
              Confirm Action
            </span>
            <button className="modal-close-btn" onClick={() => window.closeConfirm()}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <p
              id="confirm-msg"
              style={{
                color: 'var(--text2)',
                fontSize: '13.5px',
                lineHeight: '1.6',
              }}
            ></p>
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => window.closeConfirm()}>
              Cancel
            </button>
            <button className="btn btn-danger" id="confirm-ok" onClick={() => window.runConfirm()}>
              Confirm
            </button>
          </div>
        </div>
      </div>

      <div
        className="drawer-overlay"
        id="drawer-overlay"
        onClick={() => window.closeDrawer()}
      ></div>

      <div className="drawer" id="drawer">
        <div className="drawer-head">
          <span className="h4" id="drawer-title">
            Details
          </span>
          <button className="modal-close-btn" onClick={() => window.closeDrawer()}>
            ✕
          </button>
        </div>
        <div className="drawer-body" id="drawer-body"></div>
      </div>

      <ToastHost />

      <LegacyRuntime source={source} role="organizer" />
    </>
  );
}
