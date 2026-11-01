import React from 'react';

export function LoadingState({ icon, title }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><div className="empty-title">{title}</div></div>;
}

export function EmptyState({ icon, title, description, action, style }) {
  return <div className="empty" style={style}>
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    {description && <p className="empty-desc">{description}</p>}
    {action}
  </div>;
}

export function ErrorState({ icon = '⚠️', title, message, onRetry }) {
  return <EmptyState icon={icon} title={title} description={message}
    action={onRetry && <button className="btn btn-primary mt-16" onClick={onRetry}>Try Again</button>} />;
}
