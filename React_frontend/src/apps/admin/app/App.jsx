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
import rawUserReportsPage from '../pages/UserReportsPage.jsx?raw';
import rawEventReportsPage from '../pages/EventReportsPage.jsx?raw';
import rawRevenueReportsPage from '../pages/RevenueReportsPage.jsx?raw';
import rawEmployeeReportsPage from '../pages/EmployeeReportsPage.jsx?raw';
import '../styles/admin.css';
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
  dashAdmin: pageRuntime(rawDashboardPage),
  pageUserReports: pageRuntime(rawUserReportsPage),
  pageEventReports: pageRuntime(rawEventReportsPage),
  pageRevenueReports: pageRuntime(rawRevenueReportsPage),
  pageEmployeeReports: pageRuntime(rawEmployeeReportsPage),
}).reduce((code, [name, section]) => {
  const marker = `/* PORTAL_SECTION_${name} */`;
  if (!code.includes(marker)) throw new Error(`Missing portal section: ${name}`);
  return code.replace(marker, section);
}, runtime);
export default function AdminWorkspace() {
  return (
    <>
      <PublicHomePage />

      <LoginPage workspace="admin" />

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

      <div id="toasts"></div>

      <LegacyRuntime source={source} role="admin" />
    </>
  );
}
