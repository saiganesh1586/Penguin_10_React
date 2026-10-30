import React from 'react';
import { legacyEvent } from '../../app/legacyEvents.js';

export default function ContactPage() {
  return (
<div id="contact" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "60px 20px", "display": "none"}}>
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
        <h1 className="h1" style={{"marginTop": "12px"}}>Contact Us</h1>
      </div>
      <div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "20px", "marginBottom": "40px"}}>
        <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
          <div style={{"fontSize": "28px", "marginBottom": "12px"}}>📧</div>
          <div style={{"fontWeight": "700", "marginBottom": "4px"}}>Email</div>
          <p style={{"color": "var(--text2)", "fontSize": "13px"}}>support@eventflow.com</p>
        </div>
        <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
          <div style={{"fontSize": "28px", "marginBottom": "12px"}}>📞</div>
          <div style={{"fontWeight": "700", "marginBottom": "4px"}}>Phone</div>
          <p style={{"color": "var(--text2)", "fontSize": "13px"}}>+1 (555) 123-4567</p>
        </div>
        <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
          <div style={{"fontSize": "28px", "marginBottom": "12px"}}>📍</div>
          <div style={{"fontWeight": "700", "marginBottom": "4px"}}>Address</div>
          <p style={{"color": "var(--text2)", "fontSize": "13px"}}>123 Event Boulevard, Chennai, CA 94105</p>
        </div>
        <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
          <div style={{"fontSize": "28px", "marginBottom": "12px"}}>🕐</div>
          <div style={{"fontWeight": "700", "marginBottom": "4px"}}>Hours</div>
          <p style={{"color": "var(--text2)", "fontSize": "13px"}}>Mon-Fri: 9AM - 6PM PT</p>
        </div>
      </div>
      <div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
        <div style={{"fontWeight": "700", "marginBottom": "16px"}}>Send us a message</div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-control" id="contact-name" placeholder="Your name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-control" id="contact-email" placeholder="your@email.com" type="email" />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-control" id="contact-message" placeholder="Your message…" style={{"minHeight": "100px"}}></textarea>
        </div>
        <button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("sendContactMessage()", event)}>Send Message</button>
      </div>
    </div>
  </div>
  );
}
