import DashboardLayout from '../../../app/DashboardLayout.jsx';
import Sidebar from '../../../app/Sidebar.jsx';
import Navbar from '../../../app/Navbar.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../../auth/pages/UnifiedAuthPage.jsx';
import FindEventsPage from '../pages/FindEventsPage.jsx';
import GalleryPage from '../pages/GalleryPage.jsx';
import AboutPage from '../pages/AboutPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import React from 'react';
import LegacyRuntime from '../../../app/LegacyRuntime.jsx';
import { legacyEvent } from '../../../app/legacyEvents.js';
import source from './runtime.js?raw';
import '../styles/landing.css';
import '../styles/home.css';

export default function HomeWorkspace() {
  return <>

  <HomePage />

  <LoginPage workspace="landing" />

  <FindEventsPage />

  <GalleryPage />

  <AboutPage />

  <ContactPage />

  <DashboardLayout sidebar={<Sidebar>
        <div className="sb-logo">
          <div className="sb-logo-mark"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
        </div>
        <nav className="sb-nav" id="sb-nav"></nav>
        <div className="sb-bottom">
          <div className="sb-user" onClick={event => legacyEvent("goNav('settings')", event)}>
            <div className="av" id="sb-av">?</div>
            <div className="sb-user-info">
              <div className="sb-user-name" id="sb-name">User</div>
              <div className="sb-user-role" id="sb-role-lbl">Role</div>
            </div>
            <span style={{"color": "var(--text3)", "fontSize": "12px"}}>⚙</span>
          </div>
        </div>
      </Sidebar>} navbar={<Navbar>
          <div className="topbar-title" id="topbar-title">User</div>
          <div className="topbar-right">
            <button className="notif-trigger" onClick={event => legacyEvent("goNav('notifications')", event)}>🔔<span className="notif-badge" id="notif-count-dot"></span></button>
            <button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("doLogout()", event)}>Sign Out</button>
          </div>
        </Navbar>} />

  <div className="overlay" id="modal-overlay" onClick={event => legacyEvent("closeModalOnBg(event)", event)}>
    <div className="modal-box" id="modal-box">
      <div className="modal-head">
        <span className="modal-title" id="modal-title"></span>
        <button className="modal-close-btn" onClick={event => legacyEvent("closeModal()", event)}>✕</button>
      </div>
      <div className="modal-body" id="modal-body"></div>
      <div className="modal-foot" id="modal-foot"></div>
    </div>
  </div>

  <div className="overlay" id="confirm-overlay" onClick={event => legacyEvent("closeConfirmOnBg(event)", event)}>
    <div className="modal-box" style={{"maxWidth": "360px"}}>
      <div className="modal-head">
        <span className="modal-title" id="confirm-title">Confirm Action</span>
        <button className="modal-close-btn" onClick={event => legacyEvent("closeConfirm()", event)}>✕</button>
      </div>
      <div className="modal-body">
        <p id="confirm-msg" style={{"color": "var(--text2)", "fontSize": "13.5px", "lineHeight": "1.6"}}></p>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={event => legacyEvent("closeConfirm()", event)}>Cancel</button>
        <button className="btn btn-danger" id="confirm-ok" onClick={event => legacyEvent("runConfirm()", event)}>Confirm</button>
      </div>
    </div>
  </div>

  <div className="drawer-overlay" id="drawer-overlay" onClick={event => legacyEvent("closeDrawer()", event)}></div>

  <div className="drawer" id="drawer">
    <div className="drawer-head">
      <span className="h4" id="drawer-title">Details</span>
      <button className="modal-close-btn" onClick={event => legacyEvent("closeDrawer()", event)}>✕</button>
    </div>
    <div className="drawer-body" id="drawer-body"></div>
  </div>

  <div id="toasts"></div>

  
  
  
  
  

<LegacyRuntime source={source} role="landing" />
</>;
}
