import React from 'react';
import { legacyEvent } from '../../../app/legacyEvents.js';

function GeneralLoginPage() {
  return (
<div id="login">
<div className="login-card">
<div className="login-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
<p className="login-sub" id="login-subtitle">Sign in to your dashboard</p>
<div className="login-hint" id="login-hint">📝 Demo credentials available below</div>
<div className="form-group">
<label className="form-label">Email Address</label>
<div className="input-group">
<span className="input-icon">✉️</span>
<input className="form-control" id="l-email" placeholder="you@example.com" type="email" />
</div>
<span className="form-error" id="l-email-err">Enter a valid email address</span>
</div>
<div className="form-group" style={{"marginBottom": "20px"}}>
<label className="form-label">Password</label>
<div className="input-group">
<span className="input-icon">🔒</span>
<input className="form-control" id="l-pass" onKeyDown={event => legacyEvent("if(event.key==='Enter')doLogin()", event)} placeholder="••••••••" type="password" />
</div>
<span className="form-error" id="l-pass-err">Password must be at least 4 characters</span>
</div>
<button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("doLogin()", event)}>Sign In →</button>
<div className="divider">Demo Credentials (Click to Auto-Fill)</div>
<div style={{"background": "var(--surface2)", "borderRadius": "10px", "padding": "14px", "marginBottom": "16px", "fontSize": "12.5px", "display": "flex", "flexDirection": "column", "gap": "8px", "maxHeight": "210px", "overflowY": "auto"}}>

<div onClick={event => legacyEvent("fillLogin('arjun.events@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>User Executive:</strong> arjun.events@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('employee@example.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Event Executive:</strong> employee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('marcus.ops@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Support &amp; Finance:</strong> marcus.ops@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('organizer@example.com', 'Organizer@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Organizer</span> <strong>Sarah Chen:</strong>
            organizer@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Organizer@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('client@example.com', 'Client@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-yellow" style={{"marginRight": "4px"}}>Client</span> <strong>Michael Torres:</strong>
            client@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Client@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('attendee@example.com', 'Attendee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-blue" style={{"marginRight": "4px"}}>Attendee</span> <strong>Priya Patel:</strong>
            attendee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Attendee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('superadmin@example.com', 'Admin@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-red" style={{"marginRight": "4px"}}>Super Admin</span> <strong>Alex Johnson:</strong> superadmin@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Admin@123</span>
</div>
</div>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)"}}>Don't have an account? <a href="#" onClick={event => legacyEvent("openRegisterModal()", event)} style={{"color": "var(--accent)"}}>Create one</a></p>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)", "marginTop": "12px"}}><a href="#" style={{"color": "var(--text2)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a></p>
</div>
</div>
  );
}

function OrganizerLoginPage() {
  return (
<div id="login">
<div className="login-card">
<div className="login-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
<p className="login-sub" id="login-subtitle">Sign in to your dashboard</p>
<div className="login-hint" id="login-hint">📝 Demo credentials available below</div>
<div className="form-group">
<label className="form-label">Email Address</label>
<div className="input-group">
<span className="input-icon">✉️</span>
<input className="form-control" id="l-email" placeholder="you@example.com" type="email" />
</div>
<span className="form-error" id="l-email-err">Enter a valid email address</span>
</div>
<div className="form-group" style={{"marginBottom": "20px"}}>
<label className="form-label">Password</label>
<div className="input-group">
<span className="input-icon">🔒</span>
<input className="form-control" id="l-pass" onKeyDown={event => legacyEvent("if(event.key==='Enter')doLogin()", event)} placeholder="••••••••" type="password" />
</div>
<span className="form-error" id="l-pass-err">Password must be at least 4 characters</span>
</div>
<button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("doLogin()", event)}>Sign In →</button>
<div className="divider">Demo Credentials (Click to Auto-Fill)</div>
<div style={{"background": "var(--surface2)", "borderRadius": "10px", "padding": "14px", "marginBottom": "16px", "fontSize": "12.5px", "display": "flex", "flexDirection": "column", "gap": "8px", "maxHeight": "210px", "overflowY": "auto"}}>

<div onClick={event => legacyEvent("fillLogin('organizer@example.com', 'Organizer@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Organizer</span> <strong>Sarah Chen:</strong>
            organizer@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Organizer@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('client@example.com', 'Client@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-yellow" style={{"marginRight": "4px"}}>Client</span> <strong>Michael Torres:</strong>
            client@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Client@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('attendee@example.com', 'Attendee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-blue" style={{"marginRight": "4px"}}>Attendee</span> <strong>Priya Patel:</strong>
            attendee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Attendee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('superadmin@example.com', 'Admin@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-red" style={{"marginRight": "4px"}}>Super Admin</span> <strong>Alex Johnson:</strong> superadmin@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Admin@123</span>
</div>
</div>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)"}}>Don't have an account? <a href="#" onClick={event => legacyEvent("openRegisterModal()", event)} style={{"color": "var(--accent)"}}>Create one</a></p>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)", "marginTop": "12px"}}><a href="#" style={{"color": "var(--text2)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a></p>
</div>
</div>
  );
}

function FinanceLoginPage() {
  return (
<div id="login">
<div className="login-card">
<div className="login-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
<p className="login-sub" id="login-subtitle">Sign in to your dashboard</p>
<div className="login-hint" id="login-hint">📝 Demo credentials available below</div>
<div className="form-group">
<label className="form-label">Email Address</label>
<div className="input-group">
<span className="input-icon">✉️</span>
<input className="form-control" id="l-email" placeholder="you@example.com" type="email" />
</div>
<span className="form-error" id="l-email-err">Enter a valid email address</span>
</div>
<div className="form-group" style={{"marginBottom": "20px"}}>
<label className="form-label">Password</label>
<div className="input-group">
<span className="input-icon">🔒</span>
<input className="form-control" id="l-pass" onKeyDown={event => legacyEvent("if(event.key==='Enter')doLogin()", event)} placeholder="••••••••" type="password" />
</div>
<span className="form-error" id="l-pass-err">Password must be at least 4 characters</span>
</div>
<button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("doLogin()", event)}>Sign In →</button>
<div className="divider">Demo Credentials (Click to Auto-Fill)</div>
<div style={{"background": "var(--surface2)", "borderRadius": "10px", "padding": "14px", "marginBottom": "16px", "fontSize": "12.5px", "display": "flex", "flexDirection": "column", "gap": "8px", "maxHeight": "210px", "overflowY": "auto"}}>

<div onClick={event => legacyEvent("fillLogin('arjun.events@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>User Executive:</strong> arjun.events@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('employee@example.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Event Executive:</strong> employee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('marcus.ops@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Finance Executive:</strong> marcus.ops@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('organizer@example.com', 'Organizer@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Organizer</span> <strong>Sarah Chen:</strong>
            organizer@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Organizer@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('client@example.com', 'Client@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-yellow" style={{"marginRight": "4px"}}>Client</span> <strong>Michael Torres:</strong>
            client@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Client@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('attendee@example.com', 'Attendee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-blue" style={{"marginRight": "4px"}}>Attendee</span> <strong>Priya Patel:</strong>
            attendee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Attendee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('superadmin@example.com', 'Admin@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-red" style={{"marginRight": "4px"}}>Super Admin</span> <strong>Alex Johnson:</strong> superadmin@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Admin@123</span>
</div>
</div>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)"}}>Don't have an account? <a href="#" onClick={event => legacyEvent("openRegisterModal()", event)} style={{"color": "var(--accent)"}}>Create one</a></p>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)", "marginTop": "12px"}}><a href="#" style={{"color": "var(--text2)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a></p>
</div>
</div>
  );
}

function PublicLoginPage() {
  return (
<div id="login">
    <div className="login-card">
      <div className="login-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/assets/images/eventflow-logo.png" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
      <p className="login-sub" id="login-subtitle">Sign in to your dashboard</p>
      <div className="login-hint" id="login-hint">📝 Demo credentials available below</div>
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <div className="input-group">
          <span className="input-icon">✉️</span>
          <input className="form-control" id="l-email" placeholder="you@example.com" type="email" />
        </div>
        <span className="form-error" id="l-email-err">Enter a valid email address</span>
      </div>
      <div className="form-group" style={{"marginBottom": "20px"}}>
        <label className="form-label">Password</label>
        <div className="input-group">
          <span className="input-icon">🔒</span>
          <input className="form-control" id="l-pass" onKeyDown={event => legacyEvent("if(event.key==='Enter')doLogin()", event)} placeholder="••••••••" type="password" />
        </div>
        <span className="form-error" id="l-pass-err">Password must be at least 4 characters</span>
      </div>
      <button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("doLogin()", event)}>Sign In →</button>
      <div className="divider">Demo Credentials (Click to Auto-Fill)</div>
      <div style={{"background": "var(--surface2)", "borderRadius": "10px", "padding": "14px", "marginBottom": "16px", "fontSize": "12.5px", "display": "flex", "flexDirection": "column", "gap": "8px", "maxHeight": "210px", "overflowY": "auto"}}>
        <div onClick={event => legacyEvent("fillLogin('arjun.events@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Support
              Executive:</strong> arjun.events@eventflow.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
        </div>
        <div onClick={event => legacyEvent("fillLogin('marcus.ops@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Finance
              Executive:</strong> marcus.ops@eventflow.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
        </div>
        <div onClick={event => legacyEvent("fillLogin('organizer@example.com', 'Organizer@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Organizer</span> <strong>Sarah Chen:</strong>
            organizer@example.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Organizer@123</span>
        </div>
        <div onClick={event => legacyEvent("fillLogin('client@example.com', 'Client@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-yellow" style={{"marginRight": "4px"}}>Client</span> <strong>Michael Torres:</strong>
            client@example.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Client@123</span>
        </div>
        <div onClick={event => legacyEvent("fillLogin('attendee@example.com', 'Attendee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-blue" style={{"marginRight": "4px"}}>Attendee</span> <strong>Priya Patel:</strong>
            attendee@example.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Attendee@123</span>
        </div>
        <div onClick={event => legacyEvent("fillLogin('superadmin@example.com', 'Admin@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
          <span><span className="badge badge-red" style={{"marginRight": "4px"}}>Super Admin</span> <strong>Alex Johnson:</strong>
            superadmin@example.com</span>
          <span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Admin@123</span>
        </div>
      </div>
      <p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)"}}>Don't have an account? <a href="#" id="create-account-link" onClick={event => legacyEvent("openRegisterModal()", event)} style={{"color": "var(--accent)", "fontWeight": "600"}}>Create New Account</a></p>
      <p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)", "marginTop": "12px"}}><a href="#" style={{"color": "var(--text2)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a></p>
    </div>
  </div>
  );
}

export default function UnifiedAuthPage({ workspace }) {
  if (workspace === 'organizer') return <OrganizerLoginPage />;
  if (workspace === 'finance-executive') return <FinanceLoginPage />;
  if (workspace === 'landing') return <PublicLoginPage />;
  return <GeneralLoginPage />;
}
