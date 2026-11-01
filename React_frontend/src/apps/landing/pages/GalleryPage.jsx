import React from 'react';
import { legacyEvent } from '../../../app/legacyEvents.js';

export default function GalleryPage() {
  return (
    <div
      id="gallery"
      style={{ background: 'var(--bg)', minHeight: '100vh', padding: '60px 20px', display: 'none' }}
    >
      <nav className="l-nav" style={{ zIndex: '300' }}>
        <span className="l-nav-logo">
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
        </span>
        <div className="l-nav-links">
          <a
            href="#"
            style={{ color: 'var(--accent)' }}
            onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}
          >
            ← Home
          </a>
          <a
            href="#"
            onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}
          >
            Find Events
          </a>
          <a
            href="#"
            onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}
          >
            Gallery
          </a>
          <a
            href="#"
            onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}
          >
            About Us
          </a>
          <a
            href="#"
            onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}
          >
            Contact
          </a>
        </div>
        <div className="l-nav-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={event => legacyEvent("gotoLogin('attendee')", event)}
          >
            Sign In
          </button>
        </div>
      </nav>
      <div className="l-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <a
            href="#"
            style={{ color: 'var(--text2)', fontSize: '13px' }}
            onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}
          >
            ← Back to Home
          </a>
          <h1 className="h1" style={{ marginTop: '12px' }}>
            Event Gallery
          </h1>
          <p className="muted">Showcase of our successful events and happy attendees.</p>
        </div>
        <style>
          .gallery-grid {'{'}
          columns: 3; column-gap: 16px;
          {'}'}
          @media(max-width:900px) {'{'}
          .gallery-grid {'{'}
          columns: 2;
          {'}'}
          {'}'}
          @media(max-width:560px) {'{'}
          .gallery-grid {'{'}
          columns: 1;
          {'}'}
          {'}'}
          .gallery-item {'{'}
          break-inside: avoid; margin-bottom: 16px; border-radius: 14px; overflow: hidden; position:
          relative; cursor: pointer; display: block;
          {'}'}
          .gallery-item img {'{'}
          width: 100%; display: block; transition: transform .35s;
          {'}'}
          .gallery-item:hover img {'{'}
          transform: scale(1.05);
          {'}'}
          .gallery-item-overlay {'{'}
          position: absolute; inset: 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%,
          transparent 50%); opacity: 0; transition: opacity .3s; display: flex; align-items:
          flex-end; padding: 14px;
          {'}'}
          .gallery-item:hover .gallery-item-overlay {'{'}
          opacity: 1;
          {'}'}
          .gallery-item-label {'{'}
          color: #fff; font-weight: 600; font-size: 13px; line-height: 1.3;
          {'}'}
        </style>
        <div className="gallery-grid">
          <div className="gallery-item">
            <img
              alt="Tech Innovation Summit"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-tech-summit.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Tech Innovation Summit 2026</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Spring Music Festival"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-music-fest.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Spring Music Festival</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Corporate Annual Gala"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-annual-gala.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Corporate Annual Gala 2026</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Hackathon"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-hackathon.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">DevSprint Hackathon</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Photography Masterclass"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-photography.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Photography Masterclass</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="FinTech Summit"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-fintech.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">FinTech Innovation Summit</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Startup Pitch Night"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-pitch-night.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Startup Pitch Night</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Digital Marketing Workshop"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-marketing-workshop.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Digital Marketing Workshop</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="AI Summit"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-ai-summit.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">AI &amp; Machine Learning Summit</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Wedding Gala"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-wedding.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Grand Wedding Celebration</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Healthcare Forum"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-healthcare-forum.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Healthcare Innovation Forum</div>
            </div>
          </div>
          <div className="gallery-item">
            <img
              alt="Cybersecurity Conference"
              onError={event =>
                legacyEvent(
                  "this.parentElement.style.background='var(--surface2)';this.style.display='none'",
                  event
                )
              }
              src="/assets/images/events/event-cybersecurity.jpg"
            />
            <div className="gallery-item-overlay">
              <div className="gallery-item-label">Cybersecurity Conference</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
