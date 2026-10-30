import React from 'react';
import { legacyEvent } from '../../app/legacyEvents.js';
import PublicEventCatalog from './PublicEventCatalog.jsx';

export default function FindEventsPage() {
  return (
<div id="find-events" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "80px 20px 20px", "display": "none"}}>
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
    <div style={{"maxWidth": "1200px", "margin": "0 auto"}}>
      <div style={{"marginBottom": "40px"}}>
        <a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
        <h1 className="h1" style={{"marginTop": "12px"}}>Explore Events</h1>
        <p className="muted">Discover upcoming events and register for ones that interest you.</p>
      </div>
      
      <style>
        .fe-grid {'{'}
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        {'}'}

        .fe-card {'{'}
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        {'}'}

        .fe-card:hover {'{'}
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
        {'}'}

        .fe-card-img {'{'}
          position: relative;
          height: 160px;
          overflow: hidden;
          background: var(--surface2);
          flex-shrink: 0;
        {'}'}

        .fe-card-img img {'{'}
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .3s;
        {'}'}

        .fe-card:hover .fe-card-img img {'{'}
          transform: scale(1.06);
        {'}'}

        .fe-card-img-fallback {'{'}
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 52px;
        {'}'}

        .fe-card-img-overlay {'{'}
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 55%);
        {'}'}

        .fe-card-price {'{'}
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 20px;
        {'}'}

        .fe-card-body {'{'}
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        {'}'}

        .fe-card-title {'{'}
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 4px;
          line-height: 1.3;
        {'}'}

        .fe-card-meta {'{'}
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 8px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        {'}'}

        .fe-card-desc {'{'}
          font-size: 12.5px;
          color: var(--text2);
          line-height: 1.55;
          flex: 1;
          margin-bottom: 12px;
        {'}'}

        .fe-card-actions {'{'}
          display: flex;
          gap: 8px;
          margin-top: auto;
        {'}'}
      </style>
      <PublicEventCatalog />
    </div>
  </div>
  );
}
