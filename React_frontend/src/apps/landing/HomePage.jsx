import React from 'react';
import { legacyEvent } from '../../app/legacyEvents.js';

export default function HomePage() {
  return (
<div id="landing">
    <nav className="l-nav">
      <span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
      <div className="l-nav-links">
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
      </div>
      <div className="l-nav-actions">
        <button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
      </div>
    </nav>
    <section className="hero">
      <div className="hero-bg">
        <img className="hero-image" src="/assets/images/eventflow-hero-concert.png" alt="" aria-hidden="true" />
        <div className="hero-image-overlay"></div>
        <div className="orb1"></div>
        <div className="orb2"></div>
      </div>
      <div className="hero-content">
        <div className="hero-pill"> Event Registration &amp; Attendee Management Platform</div>
        <h1 className="hero-h1">The Smartest Way to<br /><span className="grad">Manage Events</span></h1>
        <p className="hero-p">EventFlow unifies event planning, attendee registration, and real-time
          on-site verification in one centralized platform.</p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={event => legacyEvent("showPage('find-events')", event)}>🎟️ Explore Events</button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val" style={{"color": "var(--accent)"}}>2,400+</div>
            <div className="hero-stat-lbl">Events Managed</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{"color": "var(--green)"}}>98K+</div>
            <div className="hero-stat-lbl">Attendees Registered</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{"color": "var(--yellow)"}}>500+</div>
            <div className="hero-stat-lbl">Organizers Onboard</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val" style={{"color": "var(--blue)"}}>99.8%</div>
            <div className="hero-stat-lbl">Platform Uptime</div>
          </div>
        </div>
      </div>
    </section>
    <section className="l-section l-section-alt" id="features">
      <div className="l-eyebrow">Platform Features</div>
      <h2 className="l-heading">Everything You Need</h2>
      <p className="l-desc">A complete toolkit designed for every role in the event ecosystem.</p>
      <div className="features-grid">
        <div className="feat-card">
          <div className="feat-icon" style={{"background": "var(--accent-dim)", "color": "var(--accent)"}}>📋</div>
          <div className="feat-title">Smart Registration</div>
          <p className="feat-desc">Streamlined attendee registration with instant QR ticket generation, automated email
            confirmations, and real-time capacity tracking.</p>
        </div>

        <div className="feat-card">
          <div className="feat-icon" style={{"background": "var(--blue-dim)", "color": "var(--blue)"}}>✅</div>
          <div className="feat-title">Live Verification</div>
          <p className="feat-desc">On-site QR code scanning for fast and accurate attendee check-in. Eliminate queues and
            manual entry errors completely.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon" style={{"background": "var(--yellow-dim)", "color": "var(--yellow)"}}>💳</div>
          <div className="feat-title">Secure Payments</div>
          <p className="feat-desc">Integrated payment processing for paid events with instant receipt generation, refund
            workflows, and revenue reporting.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon" style={{"background": "var(--orange-dim)", "color": "var(--orange)"}}>📊</div>
          <div className="feat-title">Analytics &amp; Reports</div>
          <p className="feat-desc">Live dashboards with registration rates, revenue breakdowns, attendance heat maps, and
            post-event performance summaries.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon" style={{"background": "var(--red-dim)", "color": "var(--red)"}}>🔔</div>
          <div className="feat-title">Smart Notifications</div>
          <p className="feat-desc">Automated reminders, status updates, and confirmations keep clients and attendees
            informed throughout the event lifecycle.</p>
        </div>
      </div>
    </section>
    <section className="l-section" id="roles">
      <div className="text-center">
        <div className="l-eyebrow">Role-Based Access Control</div>
        <h2 className="l-heading">Built for Every Stakeholder</h2>
        <p className="l-desc" style={{"margin": "0 auto"}}>Each actor gets a tailored interface with precisely the permissions they
          need.</p>
      </div>
      <div className="roles-grid">
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('superuser')", event)}>
          <div className="role-card-emoji">🛡️</div>
          <div className="role-card-title">Super Admin</div>
          <p className="role-card-desc">Full CRUD access across all modules. Manage users, roles, events, and system
            settings.</p>
          <span className="badge badge-red">Full Control</span>
        </div>
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('organizer')", event)}>
          <div className="role-card-emoji">🎯</div>
          <div className="role-card-title">Event Organizer</div>
          <p className="role-card-desc">Plan events, manage registrations, coordinate with clients, and generate event
            reports.</p>
          <span className="badge badge-purple">Operational</span>
        </div>
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('client')", event)}>
          <div className="role-card-emoji">💼</div>
          <div className="role-card-title">Client</div>
          <p className="role-card-desc">Submit event requests, review proposals, approve plans, and receive post-event
            reports.</p>
          <span className="badge badge-yellow">Requestor</span>
        </div>
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>
          <div className="role-card-emoji">🎟️</div>
          <div className="role-card-title">Attendee</div>
          <p className="role-card-desc">Browse events, register, make payments, receive digital tickets, and verify
            attendance on-site.</p>
          <span className="badge badge-green">End User</span>
        </div>
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('employee1')", event)}>
          <div className="role-card-emoji">👔</div>
          <div className="role-card-title">Support Executive</div>
          <p className="role-card-desc">Unified workspace for user &amp; event management, registrations, and support operations.</p>
          <span className="badge badge-purple">Support Executive</span>
        </div>
        <div className="role-card" onClick={event => legacyEvent("gotoLogin('employee2')", event)}>
          <div className="role-card-emoji">💳</div>
          <div className="role-card-title">Finance Executive</div>
          <p className="role-card-desc">Financial operations, transaction monitoring, platform commission, organizer payouts, and refund management.</p>
          <span className="badge badge-purple">Finance Executive</span>
        </div>
      </div>
    </section>
    <section className="l-section l-section-alt" id="how">
      <div className="l-eyebrow">How It Works</div>
      <h2 className="l-heading">Simple. Fast. Reliable.</h2>
      <div className="grid-3" style={{"marginTop": "48px", "gap": "28px"}}>
        <div style={{"textAlign": "center"}}>
          <div style={{"width": "64px", "height": "64px", "background": "var(--accent-dim)", "border": "1px solid rgba(124,111,247,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            📋</div>
          <div className="h4 mb-8">1. Request or Create</div>
          <p className="muted">Clients submit event requests. Organizers create and plan events with full detail.</p>
        </div>
        <div style={{"textAlign": "center"}}>
          <div style={{"width": "64px", "height": "64px", "background": "var(--green-dim)", "border": "1px solid rgba(34,211,165,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            🎟️</div>
          <div className="h4 mb-8">2. Register &amp; Pay</div>
          <p className="muted">Attendees browse, register, and pay securely. Instant ticket generation with unique QR codes.
          </p>
        </div>
        <div style={{"textAlign": "center"}}>
          <div style={{"width": "64px", "height": "64px", "background": "var(--blue-dim)", "border": "1px solid rgba(66,153,225,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            ✅</div>
          <div className="h4 mb-8">3. Attend &amp; Verify</div>
          <p className="muted">On-site QR scanning for instant check-in. Real-time attendance tracking and reporting.</p>
        </div>
      </div>
    </section>
    <section className="l-section" style={{"textAlign": "center", "paddingTop": "80px", "paddingBottom": "80px"}}>
      <h2 className="l-heading">Ready to Transform Your Events?</h2>
      <p className="l-desc" style={{"margin": "0 auto 32px"}}>Join thousands of organizers and attendees already using EventFlow.
      </p>
      <div style={{"display": "flex", "gap": "14px", "justifyContent": "center"}}>
        <button className="btn btn-primary btn-lg" onClick={event => legacyEvent("gotoLogin('organizer')", event)}>Start Organizing →</button>
        <button className="btn btn-ghost btn-lg" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Browse Events</button>
      </div>
    </section>
    <footer className="l-footer">
      <div>
        <span style={{"fontFamily": "var(--font-head)", "fontWeight": "700", "display": "block", "marginBottom": "12px"}}><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
        <div className="small" style={{"color": "var(--text2)", "lineHeight": "1.6", "marginBottom": "8px"}}>
          <div>📧 support@eventflow.com</div>
          <div>📞 +1 (555) 123-4567</div>
          <div>📍 123 Event Boulevard, Chennai, CA 94105</div>
        </div>
      </div>
      <span className="small">© 2026 EventFlow Inc. — Event Registration &amp; Attendee Management Platform</span>
      <div style={{"display": "flex", "gap": "16px"}}>
        <a className="small" href="#" style={{"color": "var(--text3)"}} onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact Us</a>
        <a className="small" href="#" style={{"color": "var(--text3)"}} onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About</a>
        <a className="small" href="#" style={{"color": "var(--text3)"}}>Privacy</a>
        <a className="small" href="#" style={{"color": "var(--text3)"}}>Terms</a>
      </div>
    </footer>
  </div>
  );
}
