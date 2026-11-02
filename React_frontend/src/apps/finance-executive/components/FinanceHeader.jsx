import FilterInput from '../../../app/FilterInput.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
export function FinanceHeader({ onRenderPage, _currentPage, title, subtitle, refresh = true }) {
  return (
    <div className="page-hd">
      <div className="page-hd-left">
        <div className="page-title">{title}</div>
        <div className="page-sub">{subtitle}</div>
      </div>
      {refresh ? (
        <div className="page-hd-right">
          <button className="btn btn-ghost" onClick={() => onRenderPage(_currentPage)}>
            ↻ Refresh
          </button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}
export function FinanceRanges({ onFinanceSet, financeFilters }) {
  return (
    <div className="filter-row finance-filters">
      <label>
        Date range{' '}
        <PortalSelect
          className="form-control"
          onChange={event => onFinanceSet('range', event.currentTarget.value)}
          value={financeFilters.range}
        >
          {[
            ['today', 'Today'],
            ['last7', 'Last 7 Days'],
            ['last30', 'Last 30 Days'],
            ['thisMonth', 'This Month'],
            ['custom', 'Custom'],
            ['all', 'All Time'],
          ].map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </PortalSelect>
      </label>
      {financeFilters.range === 'custom' ? (
        <>
          <label>
            From{' '}
            <FilterInput
              className="form-control"
              type="date"
              value={financeFilters.from}
              onChange={event => onFinanceSet('from', event.currentTarget.value)}
            />
          </label>
          <label>
            To{' '}
            <FilterInput
              className="form-control"
              type="date"
              value={financeFilters.to}
              onChange={event => onFinanceSet('to', event.currentTarget.value)}
            />
          </label>
        </>
      ) : (
        ''
      )}
    </div>
  );
}
export function FinanceStat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
export function FinanceProviderBanner() {
  return (
    <div className="finance-provider-banner">
      Demo provider only. Payments are simulated; live gateway reconciliation and payouts are
      unavailable.
    </div>
  );
}
