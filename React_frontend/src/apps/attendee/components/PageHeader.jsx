import React from 'react';

export default function PageHeader({ title, subtitle, action, style, actionStyle }) {
  return (
    <div className="page-hd" style={style}>
      <div className="page-hd-left">
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {action && (
        <div className="page-hd-right" style={actionStyle}>
          {action}
        </div>
      )}
    </div>
  );
}
