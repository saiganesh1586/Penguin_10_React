import React from 'react';
import { legacyEvent } from '../../../app/legacyEvents.js';

export default function AboutPage() {
  return (
<div id="about" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "60px 20px", "display": "none"}}>
    <nav className="l-nav" style={{"zIndex": "300"}}>
      <span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
      <div className="l-nav-links">
        <a href="#" style={{"color": "var(--accent)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Home</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
        <a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
      </div>
      <div className="l-nav-actions">
        <button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
      </div>
    </nav>
    <div className="l-container" style={{"maxWidth": "800px", "margin": "0 auto"}}>
      <div style={{"marginBottom": "40px"}}>
        <a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
        <h1 className="h1" style={{"marginTop": "12px"}}>About EventFlow</h1>
      </div>
      <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px", "lineHeight": "1.8", "color": "var(--text2)"}}>
        <p style={{"marginBottom": "16px"}}>EventFlow is a comprehensive event management and attendee registration platform
          designed to simplify every aspect of event planning and execution.</p>
        <p style={{"marginBottom": "16px"}}><strong style={{"color": "var(--text)"}}>Our Mission:</strong> To empower event
          organizers, clients, and attendees with intelligent tools that make event management seamless, secure, and
          delightful.</p>
        <p style={{"marginBottom": "16px"}}><strong style={{"color": "var(--text)"}}>What We Offer:</strong></p>
        <ul style={{"marginLeft": "20px", "marginBottom": "16px"}}>
          <li style={{"marginBottom": "8px"}}>✨ Smart registration with instant QR ticket generation</li>

          <li style={{"marginBottom": "8px"}}>✅ Live verification and on-site check-in</li>
          <li style={{"marginBottom": "8px"}}>💰 Secure payment processing</li>
          <li style={{"marginBottom": "8px"}}>📊 Real-time analytics and reporting</li>
        </ul>
        <p><strong style={{"color": "var(--text)"}}>Founded in 2026</strong>, EventFlow has grown to manage 2,400+ events with
          98,000+ attendees and 500+ organizers worldwide.</p>
      </div>
    </div>
  </div>
  );
}
