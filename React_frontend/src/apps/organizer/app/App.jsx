import DashboardLayout from '../../../app/DashboardLayout.jsx';
import Sidebar from '../../../app/Sidebar.jsx';
import Navbar from '../../../app/Navbar.jsx';
import PublicHomePage from '../../landing/pages/PortalPublicHomePage.jsx';
import LoginPage from '../../auth/pages/UnifiedAuthPage.jsx';
import FindEventsPage from '../../landing/pages/PortalFindEventsPage.jsx';
import GalleryPage from '../../landing/pages/GalleryPage.jsx';
import AboutPage from '../../landing/pages/AboutPage.jsx';
import ContactPage from '../../landing/pages/ContactPage.jsx';
import React from 'react';
import LegacyRuntime from '../../../app/LegacyRuntime.jsx';
import { legacyEvent } from '../../../app/legacyEvents.js';
import runtime from './runtime.js?raw';
import portalApi from '../api/portal-api.js?raw';
import portalState from '../context/portal-state.js?raw';
import rawDashboardPage from '../pages/DashboardPage.jsx?raw';
import rawEventRequestsPage from '../pages/EventRequestsPage.jsx?raw';
import rawRequestDetailsPage from '../pages/RequestDetailsPage.jsx?raw';
import rawAttendeesPage from '../pages/AttendeesPage.jsx?raw';
import rawReportsPage from '../pages/ReportsPage.jsx?raw';
import rawMyEventsPage from '../pages/MyEventsPage.jsx?raw';
import rawUpcomingEventsPage from '../pages/UpcomingEventsPage.jsx?raw';
import rawCompletedEventsPage from '../pages/CompletedEventsPage.jsx?raw';
import rawOngoingEventsPage from '../pages/OngoingEventsPage.jsx?raw';
import rawNotificationsPage from '../pages/NotificationsPage.jsx?raw';
import rawProfilePage from '../pages/ProfilePage.jsx?raw';
import rawSettingsPage from '../pages/SettingsPage.jsx?raw';
import ToastHost from '../../../app/ToastHost.jsx';
import '../styles/organizer.css';
// Page components retain their existing HTML renderers inside these markers.
// Extract only that block so imports and the React wrapper stay out of the browser script.
function pageRuntime(pageSource) {
  const startMarker = '/* PORTAL_RUNTIME_START */';
  const endMarker = '/* PORTAL_RUNTIME_END */';
  const startIndex = pageSource.indexOf(startMarker);
  const endIndex = pageSource.indexOf(endMarker);
  if (startIndex < 0 || endIndex < startIndex) {
    throw new Error('Portal page source is incomplete');
  }
  return pageSource.slice(startIndex + startMarker.length, endIndex);
}
const source = Object.entries({
  api: portalApi,
  state: portalState,
  dashOrganizer: pageRuntime(rawDashboardPage),
  pageEventRequests: pageRuntime(rawEventRequestsPage),
  renderWorkflowRequestDetails: pageRuntime(rawRequestDetailsPage),
  pageAttendees: pageRuntime(rawAttendeesPage),
  pageReports: pageRuntime(rawReportsPage),
  pageWorkflowEvents: pageRuntime(rawMyEventsPage),
  pageUpcomingEvents: pageRuntime(rawUpcomingEventsPage),
  pageCompletedEvents: pageRuntime(rawCompletedEventsPage),
  pageOngoingEvents: pageRuntime(rawOngoingEventsPage),
  pageNotifications: pageRuntime(rawNotificationsPage),
  pageProfile: pageRuntime(rawProfilePage),
  pageSettings: pageRuntime(rawSettingsPage),
}).reduce((code, [name, section]) => {
  const marker = `/* PORTAL_SECTION_${name} */`;
  if (!code.includes(marker)) throw new Error(`Missing portal section: ${name}`);
  return code.replace(marker, section);
}, runtime);
export default function OrganizerWorkspace() {
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
          <Sidebar>
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
              <div className="sb-user" onClick={event => legacyEvent("goNav('settings')", event)}>
                <div className="av" id="sb-av">
                  ?
                </div>
                <div className="sb-user-info">
                  <div className="sb-user-name" id="sb-name">
                    User
                  </div>
                  <div className="sb-user-role" id="sb-role-lbl">
                    Role
                  </div>
                </div>
                <span
                  style={{
                    color: 'var(--text3)',
                    fontSize: '12px',
                  }}
                >
                  ⚙
                </span>
              </div>
            </div>
          </Sidebar>
        }
        navbar={
          <Navbar>
            <div className="topbar-title" id="topbar-title">
              User
            </div>
            <div className="topbar-right">
              <button
                className="notif-trigger"
                onClick={event => legacyEvent("goNav('notifications')", event)}
              >
                🔔<span className="notif-badge" id="notif-count-dot"></span>
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={event => legacyEvent('doLogout()', event)}
              >
                Sign Out
              </button>
            </div>
          </Navbar>
        }
      />

      <div
        className="overlay"
        id="modal-overlay"
        onClick={event => legacyEvent('closeModalOnBg(event)', event)}
      >
        <div className="modal-box" id="modal-box">
          <div className="modal-head">
            <span className="modal-title" id="modal-title"></span>
            <button
              className="modal-close-btn"
              onClick={event => legacyEvent('closeModal()', event)}
            >
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
        onClick={event => legacyEvent('closeConfirmOnBg(event)', event)}
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
            <button
              className="modal-close-btn"
              onClick={event => legacyEvent('closeConfirm()', event)}
            >
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
            <button
              className="btn btn-ghost"
              onClick={event => legacyEvent('closeConfirm()', event)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              id="confirm-ok"
              onClick={event => legacyEvent('runConfirm()', event)}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      <div
        className="drawer-overlay"
        id="drawer-overlay"
        onClick={event => legacyEvent('closeDrawer()', event)}
      ></div>

      <div className="drawer" id="drawer">
        <div className="drawer-head">
          <span className="h4" id="drawer-title">
            Details
          </span>
          <button
            className="modal-close-btn"
            onClick={event => legacyEvent('closeDrawer()', event)}
          >
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
