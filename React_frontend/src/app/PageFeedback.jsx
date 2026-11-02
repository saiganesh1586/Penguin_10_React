import React from 'react';

export function LoadingState({ title = 'Loading…', icon = '⏳' }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
    </div>
  );
}

export function ErrorState({ title = 'Data could not be loaded', message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      <p className="empty-desc" role="alert">
        {message}
      </p>
      <button className="btn btn-primary mt-16" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

export function EmptyState({ title, icon, description, action, style }) {
  return (
    <div className="empty" style={style}>
      {icon && <div className="empty-icon">{icon}</div>}
      <div className="empty-title">{title}</div>
      {description && <p className="empty-desc">{description}</p>}
      {action}
    </div>
  );
}
