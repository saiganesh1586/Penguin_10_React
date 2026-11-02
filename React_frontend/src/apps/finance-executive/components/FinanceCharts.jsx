import React from 'react';
export function FinanceAreaChart({ financeMoney, rows }) {
  if (!rows?.length) return <div className="empty">No revenue in this date range.</div>;
  const points = rows.slice(-18);
  const max = Math.max(...points.map((row, index) => Number(row.revenue) || 0), 1);
  const x = index => 36 + index * (648 / Math.max(points.length - 1, 1));
  const y = value => 198 - ((Number(value) || 0) / max) * 158;
  const line = points
    .map((row, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(row.revenue).toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${x(points.length - 1)} 198 L 36 198 Z`;
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return (
    <div className="finance-chart-scroll">
      <svg
        className="finance-area-chart"
        viewBox="0 0 720 240"
        role="img"
        aria-label="Revenue trend chart"
      >
        <defs>
          <linearGradient id="financeAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9d8cff" stopOpacity=".52"></stop>
            <stop offset="100%" stopColor="#9d8cff" stopOpacity=".03"></stop>
          </linearGradient>
        </defs>
        <line x1="36" y1="198" x2="684" y2="198" stroke="#566079" strokeWidth="1"></line>
        <line
          x1="36"
          y1="119"
          x2="684"
          y2="119"
          stroke="#566079"
          strokeOpacity=".28"
          strokeDasharray="4 5"
        ></line>
        <path d={area} fill="url(#financeAreaFill)"></path>
        <path
          d={line}
          fill="none"
          stroke="#ae9fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        {points.map((row, index) => (
          <circle cx={x(index)} cy={y(row.revenue)} r="4" fill="#c9c0ff" key={row?.date ?? index}>
            <title>{`   ${row.date} :  ${financeMoney(row.revenue)}   `}</title>
          </circle>
        ))}
        {labels.map((index, rowIndex) => (
          <text x={x(index)} y="225" textAnchor="middle" fill="#aab2c4" fontSize="11" key={index}>
            {points[index].date}
          </text>
        ))}
      </svg>
    </div>
  );
}
export function FinanceStatusDonut({ rows }) {
  const colors = {
    completed: '#32d5aa',
    pending: '#e8bd62',
    failed: '#f16e7d',
    refunded: '#9d8cff',
  };
  const total = (rows || []).reduce((sum, row) => sum + Number(row.count || 0), 0);
  if (!total) return <div className="empty">No payment activity in this date range.</div>;
  let start = 0;
  const stops = rows.map((row, index) => {
    const end = start + (Number(row.count || 0) / total) * 100;
    const stop = `${colors[row.status] || '#76839f'} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return (
    <div className="finance-donut-layout">
      <div
        className="finance-donut"
        style={{
          background: `conic-gradient(${stops.join(',')})`,
        }}
        role="img"
        aria-label="Payment status breakdown"
      >
        <div>
          <strong>{total}</strong>
          <span>Payments</span>
        </div>
      </div>
      <div className="finance-donut-legend">
        {rows.map((row, index) => (
          <div
            key={
              row?.id ??
              row?.eventReportId ??
              row?.requestId ??
              row?.registrationId ??
              row?.ticketId ??
              row?.eventId ??
              row?.reportId ??
              row?.paymentId ??
              row?.refundId ??
              row?.notificationId ??
              row?.label ??
              row?.fileName ??
              index
            }
          >
            <i
              style={{
                background: colors[row.status] || '#76839f',
              }}
            ></i>
            <span>{row.status}</span>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function FinanceEventBars({ financeMoney, rows }) {
  if (!rows?.length) return <div className="empty">No event revenue in this date range.</div>;
  const max = Math.max(...rows.map((row, index) => row.revenue), 1);
  return (
    <div className="finance-event-bars">
      {rows.slice(0, 8).map((row, index) => (
        <div
          key={
            row?.id ??
            row?.eventReportId ??
            row?.requestId ??
            row?.registrationId ??
            row?.ticketId ??
            row?.eventId ??
            row?.reportId ??
            row?.paymentId ??
            row?.refundId ??
            row?.notificationId ??
            row?.label ??
            row?.fileName ??
            index
          }
        >
          <div className="finance-event-bar-label">
            <span>{row.eventName}</span>
            <strong>{financeMoney(row.revenue)}</strong>
          </div>
          <div className="finance-event-bar-track">
            <i
              style={{
                width: `${Math.max(2, Math.round((row.revenue / max) * 100))}%`,
              }}
            ></i>
          </div>
        </div>
      ))}
    </div>
  );
}
export function FinanceRefundTrend({ financeMoney, rows }) {
  if (!rows || !rows.length) return <div className="empty">No refund activity for this range.</div>;
  const points = rows.slice(-12);
  const max = Math.max(...points.flatMap(row => [row.requested, row.completed]), 1);
  const step = 648 / points.length;
  const bar = (value, x, color, title) => (
    <rect
      x={x.toFixed(1)}
      y={(198 - (value / max) * 160).toFixed(1)}
      width={Math.min(step * 0.28, 22).toFixed(1)}
      height={((value / max) * 160).toFixed(1)}
      rx="4"
      fill={color}
    >
      <title>{`   ${title} :  ${financeMoney(value)}   `}</title>
    </rect>
  );
  return (
    <>
      <div className="finance-chart-legend">
        <span>
          <i
            style={{
              background: '#9d8cff',
            }}
          ></i>
          Requested
        </span>
        <span>
          <i
            style={{
              background: '#32d5aa',
            }}
          ></i>
          Completed
        </span>
      </div>
      <div className="finance-chart-scroll">
        <svg
          className="finance-area-chart"
          viewBox="0 0 720 240"
          role="img"
          aria-label="Refund requested and completed chart"
        >
          <line x1="36" y1="198" x2="684" y2="198" stroke="#566079"></line>
          {points.map((row, index) => {
            const center = 36 + step * (index + 0.5);
            return (
              <React.Fragment key={row?.date ?? index}>
                <>
                  {bar(
                    row.requested,
                    center - Math.min(step * 0.3, 24),
                    '#9d8cff',
                    row.date + ' requested'
                  )}
                  {bar(row.completed, center + 2, '#32d5aa', row.date + ' completed')}
                  <text x={center} y="225" textAnchor="middle" fill="#aab2c4" fontSize="10">
                    {row.date.slice(5)}
                  </text>
                </>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </>
  );
}
