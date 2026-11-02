import { useState } from 'react';
import React from 'react';
let nextChartNumber = 0;
export function AnalyticsBars({
  ADMIN_CHART_COLORS,
  adminChartLine,
  adminChartNumber,
  items,
  height,
  options = {},
}) {
  return (
    <AdminAnalyticsChart
      ADMIN_CHART_COLORS={ADMIN_CHART_COLORS}
      adminChartLine={adminChartLine}
      adminChartNumber={adminChartNumber}
      groups={items.map((item, index) => ({
        label: item.label,
        bars: [item],
      }))}
      height={height}
      options={options}
    />
  );
}
export function AnalyticsProgress({ items }) {
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
  return (
    <div className="admin-chart admin-chart--progress">
      {items.map((item, index) => {
        const pct = Math.round(((item.value || 0) / total) * 100);
        const color =
          String(item.color || '').match(/#[0-9a-f]{6}/i)?.[0] ||
          (String(item.color || '').startsWith('var(') ? item.color : 'var(--blue)');
        return (
          <div className="admin-chart__progress-row" key={item?.label ?? item?.value ?? index}>
            <div className="admin-chart__progress-label">
              <span>{item.label}</span>
              <span>
                <strong>{item.value}</strong> <small>{pct}%</small>
              </span>
            </div>
            <div className="admin-chart__progress-track">
              <div
                style={{
                  width: `${pct}%`,
                  background: color,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function AnalyticsLine({
  ADMIN_CHART_COLORS,
  adminChartLine,
  adminChartNumber,
  items,
  height,
  options = {},
}) {
  return (
    <AnalyticsBars
      ADMIN_CHART_COLORS={ADMIN_CHART_COLORS}
      adminChartLine={adminChartLine}
      adminChartNumber={adminChartNumber}
      items={items}
      height={height}
      options={{
        ...options,
        kind: 'line',
      }}
    />
  );
}
export function GroupedAnalyticsBars({
  ADMIN_CHART_COLORS,
  adminChartLine,
  adminChartNumber,
  groups,
  height,
  legend,
}) {
  return (
    <AdminAnalyticsChart
      ADMIN_CHART_COLORS={ADMIN_CHART_COLORS}
      adminChartLine={adminChartLine}
      adminChartNumber={adminChartNumber}
      groups={groups}
      height={height}
      options={{
        legend,
      }}
    />
  );
}
export function AnalyticsRings({ items }) {
  const circumference = 2 * Math.PI * 30;
  return (
    <div className="admin-chart admin-chart--rings">
      {items.map((item, index) => {
        const value = Math.min(100, Math.max(0, Number(item.value) || 0));
        return (
          <div
            className="admin-chart__ring-item"
            role="img"
            aria-label={`${item.label}: ${value}% active`}
            key={item?.label ?? item?.value ?? index}
          >
            <div className="admin-chart__ring">
              <svg viewBox="0 0 76 76" aria-hidden="true">
                <circle className="admin-chart__ring-track" cx="38" cy="38" r="30"></circle>
                <circle
                  className="admin-chart__ring-value"
                  cx="38"
                  cy="38"
                  r="30"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - value / 100)}
                ></circle>
              </svg>
              <strong>{value}%</strong>
            </div>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
export function AdminAnalyticsChart({
  ADMIN_CHART_COLORS,
  adminChartLine,
  adminChartNumber,
  groups,
  height,
  options = {},
}) {
  const [chartId] = useState(() => `admin-chart-${++nextChartNumber}`);
  const data = (groups || []).map((group, index) => ({
    label: String(group.label || ''),
    bars: (group.bars || []).map((bar, index) => ({
      ...bar,
      value: Number.isFinite(Number(bar.value)) ? Math.max(0, Number(bar.value)) : 0,
    })),
  }));
  if (!data.length)
    return <div className="admin-chart admin-chart--empty">No data available for this period.</div>;
  const id = chartId;
  const width = 600;
  const plotHeight = 180;
  const highest = Math.max(1, ...data.flatMap(group => group.bars.map((bar, index) => bar.value)));
  const roughStep = highest / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = Math.max(
    1,
    ([1, 2, 5, 10].find(value => value * magnitude >= roughStep) || 10) * magnitude
  );
  const maximum = step * 4;
  const groupWidth = width / data.length;
  const seriesCount = Math.max(1, ...data.map((group, index) => group.bars.length));
  const color = index => ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length];
  const y = value => plotHeight - (value / maximum) * plotHeight;
  const ticks = Array.from(
    {
      length: 5,
    },
    (_, index) => maximum - index * step
  );
  const paths = Array.from(
    {
      length: seriesCount,
    },
    (_, series) =>
      data.map((group, index) => ({
        x: groupWidth * (index + 0.5),
        y: y(group.bars[series]?.value || 0),
      }))
  );
  const legend = options.legend || [];
  const marks =
    options.kind === 'line'
      ? paths.map((points, series) => {
          const path = adminChartLine(points);
          const area = `${path} L ${points[points.length - 1].x} ${plotHeight} L ${
            points[0].x
          } ${plotHeight} Z`;
          return (
            <path d={area} fill={`url(#${id}-fill-${series})`} key={series}>
              <path
                d={path}
                fill="none"
                stroke={color(series)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              >
                {points.map((point, index) => (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={index === points.length - 1 ? 3 : 2}
                    fill={index === points.length - 1 ? '#edb65c' : color(series)}
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    key={index}
                  ></circle>
                ))}
              </path>
            </path>
          );
        })
      : data.map((group, index) => {
          const barWidth = Math.min(14, groupWidth / (seriesCount * 3));
          const gap = 5;
          const start =
            groupWidth * (index + 0.5) - (seriesCount * barWidth + (seriesCount - 1) * gap) / 2;
          return (
            <React.Fragment key={index}>
              {group.bars.map((bar, series) => (
                <rect
                  x={start + series * (barWidth + gap)}
                  y={y(bar.value)}
                  width={barWidth}
                  height={plotHeight - y(bar.value)}
                  rx="2"
                  fill={color(series)}
                  fillOpacity="0.92"
                  key={bar?.value ?? series}
                ></rect>
              ))}
            </React.Fragment>
          );
        });
  return (
    <div
      className={`admin-chart admin-chart--${options.kind || 'bar'}`}
      role="group"
      aria-label={options.label || 'Analytics chart'}
      style={{
        '--admin-chart-height': `${Math.max(112, (height || 200) - 36)}px`,
      }}
    >
      {legend.length ? (
        <div className="admin-chart__legend">
          {legend.map((item, index) => (
            <span key={item?.label ?? index}>
              <i
                style={{
                  background: color(index),
                }}
              ></i>
              {item.label}
            </span>
          ))}
        </div>
      ) : (
        ''
      )}
      <div className="admin-chart__body">
        <div className="admin-chart__axis-y" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span
              style={{
                top: `${index * 25}%`,
              }}
              key={
                tick?.id ??
                tick?.requestId ??
                tick?.eventId ??
                tick?.registrationId ??
                tick?.reportId ??
                tick?.label ??
                (typeof tick === 'string' || typeof tick === 'number' ? tick : index)
              }
            >
              {adminChartNumber(tick, options)}
            </span>
          ))}
        </div>
        <div className="admin-chart__plot">
          <svg
            className="admin-chart__svg"
            viewBox={`0 0 ${width} ${plotHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {paths.map((points, series) => (
                <linearGradient
                  key={
                    points?.id ??
                    points?.requestId ??
                    points?.eventId ??
                    points?.registrationId ??
                    points?.reportId ??
                    points?.label ??
                    (typeof points === 'string' || typeof points === 'number' ? points : series)
                  }
                  id={`${id}-fill-${series}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color(series)} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={color(series)} stopOpacity="0.015" />
                </linearGradient>
              ))}
            </defs>
            {ticks.map((tick, index) => (
              <line
                x1="0"
                y1={y(tick)}
                x2={width}
                y2={y(tick)}
                className="admin-chart__grid"
                vectorEffect="non-scaling-stroke"
                key={
                  tick?.id ??
                  tick?.requestId ??
                  tick?.eventId ??
                  tick?.registrationId ??
                  tick?.reportId ??
                  tick?.label ??
                  (typeof tick === 'string' || typeof tick === 'number' ? tick : index)
                }
              ></line>
            ))}
            {marks}
          </svg>
          <div className="admin-chart__targets">
            {data.map((group, index) => {
              const values = group.bars.map(
                (bar, series) =>
                  `${
                    legend[series]?.label ||
                    options.label ||
                    (bar.label !== group.label ? bar.label : '') ||
                    'Total'
                  }: ${adminChartNumber(bar.value, options)}`
              );
              return (
                <button
                  type="button"
                  className="admin-chart__target"
                  style={{
                    '--point-y': `${(y(group.bars[0]?.value || 0) / plotHeight) * 100}%`,
                  }}
                  aria-label={`${group.label}. ${values.join('. ')}`}
                  key={group?.label ?? index}
                >
                  <span className="admin-chart__tooltip" aria-hidden="true">
                    <strong>{group.label}</strong>
                    {values.map((value, series) => (
                      <span
                        key={
                          value?.id ??
                          value?.requestId ??
                          value?.eventId ??
                          value?.registrationId ??
                          value?.reportId ??
                          value?.label ??
                          (typeof value === 'string' || typeof value === 'number' ? value : series)
                        }
                      >
                        <i
                          style={{
                            background: color(series),
                          }}
                        ></i>
                        {value}
                      </span>
                    ))}
                  </span>
                  {options.kind === 'line' ? (
                    <svg
                      className="admin-chart__focus-point"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="8" r="7" fill="#559ff5" fillOpacity="0.18"></circle>
                      <circle cx="8" cy="8" r="3.5" fill="#559ff5"></circle>
                    </svg>
                  ) : (
                    ''
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div
        className="admin-chart__axis-x"
        style={{
          gridTemplateColumns: `repeat(${data.length},minmax(0,1fr))`,
        }}
        aria-hidden="true"
      >
        {data.map((group, index) => (
          <span key={group?.label ?? index}>{group.label}</span>
        ))}
      </div>
    </div>
  );
}
