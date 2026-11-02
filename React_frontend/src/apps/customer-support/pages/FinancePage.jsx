import FilterInput from '../../../app/FilterInput.jsx';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
import { FinancePreview } from '../components/FinancePreview.jsx';
export default function FinancePage() {
  const portalContext = useSupportExecutiveContext();
  const portalActions = portalContext.actions;
  const { DB: workspaceData, financeResults, financeStatusBadge } = portalContext;
  const tab = sessionStorage.getItem('finance_tab') || 'dashboard';
  const query = sessionStorage.getItem('finance_query') || '';
  const page = Number(sessionStorage.getItem('finance_page') || 1);
  const status = sessionStorage.getItem('finance_status') || '';
  const method = sessionStorage.getItem('finance_method') || '';
  const from = sessionStorage.getItem('finance_from') || '';
  const to = sessionStorage.getItem('finance_to') || '';
  const eventId = sessionStorage.getItem('finance_event') || '';
  const sort = sessionStorage.getItem('finance_sort') || 'date';
  const refundRange = sessionStorage.getItem('finance_refund_range') || 'last30';
  const refundEvent = sessionStorage.getItem('finance_refund_event') || '';
  const refundOrganizer = sessionStorage.getItem('finance_refund_organizer') || '';
  const refundStatus = sessionStorage.getItem('finance_refund_status') || '';
  const refundSearch = sessionStorage.getItem('finance_refund_search') || '';
  const refundSort = sessionStorage.getItem('finance_refund_sort') || 'newest';
  let dashboard;
  let result;
  try {
    if (portalContext.financeError) throw new Error(portalContext.financeError);
    const data = financeResults;
    if (tab === 'refunds') result = data[0];
    else {
      dashboard = data[0];
      result = data[1];
    }
  } catch (error) {
    if ((workspaceData.financeTransactions || []).length)
      return (
        <FinancePreview
          financeTransactions={portalContext.DB.financeTransactions}
          financeRefunds={portalContext.DB.financeRefunds}
          registrations={portalContext.DB.registrations}
          users={portalContext.DB.users}
          events={portalContext.DB.events}
          onSwitchFinanceTab={portalContext.actions.onSwitchFinanceTab}
          onRefreshFinanceCenter={portalContext.actions.onRefreshFinanceCenter}
          financeStatusBadgeDemo={portalContext.financeStatusBadgeDemo}
        />
      );
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="page-title">Finance Executive</div>
            <div className="page-sub">Financial operations</div>
          </div>
        </div>
        <div className="card">
          <div className="empty-title">Finance data is unavailable</div>
          <p className="empty-desc">{error.message}</p>
          <button className="btn btn-primary" onClick={() => portalActions.onRenderPage('finance')}>
            Retry
          </button>
        </div>
      </>
    );
  }
  dashboard = dashboard || {
    currency: 'INR',
    totals: {},
  };
  const totals = dashboard.totals || {};
  const currency = value =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: dashboard.currency || 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  const dateText = value => (value ? new Date(value).toLocaleString('en-IN') : '—');
  const metric = (label, value, color) => (
    <div className="stat-card">
      <div
        className="stat-value"
        style={{
          color: color,
        }}
      >
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
  const metrics = (
    <div className="grid-4 mb-20">
      {metric('Gross captured revenue', currency(totals.grossRevenue), 'var(--green)')}
      {metric('Net after completed refunds', currency(totals.netRevenue), 'var(--accent)')}
      {metric('Successful payments', totals.successfulPayments || 0, 'var(--green)')}
      {metric('Tickets sold', totals.ticketsSold || 0, 'var(--blue)')}
      {metric('Failed payments', totals.failedPayments || 0, 'var(--red)')}
      {metric('Pending payments', totals.pendingPayments || 0, 'var(--yellow)')}
      {metric('Refund requests pending', totals.pendingRefundRequests || 0, 'var(--yellow)')}
      {metric('Completed refunds', currency(totals.refundedAmount), 'var(--purple)')}
    </div>
  );
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['transactions', 'Payment Transactions'],
    ['refunds', 'Refund Management'],
    ['settlements', 'Organizer Settlements'],
    ['commission', 'Commission & Revenue'],
    ['reconciliation', 'Payment Reconciliation'],
  ].map((item, index) => (
    <button
      className={`btn ${tab === item[0] ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => portalActions.onSwitchFinanceTab(item[0])}
      key={
        item?.id ??
        item?.eventReportId ??
        item?.requestId ??
        item?.registrationId ??
        item?.ticketId ??
        item?.eventId ??
        item?.reportId ??
        item?.paymentId ??
        item?.refundId ??
        item?.notificationId ??
        item?.label ??
        item?.fileName ??
        index
      }
    >
      {item[1]}
    </button>
  ));
  let content = '';
  if (tab === 'dashboard') {
    const rows = ((result && result.data) || []).slice(0, 8).map((item, index) => (
      <tr key={item?.paymentId ?? index}>
        <td className="mono">{item.paymentId}</td>
        <td>{item.eventName}</td>
        <td>{item.attendeeName}</td>
        <td>{currency(item.amount)}</td>
        <td>
          <span className={`badge badge-${financeStatusBadge(item.status)}`}>{item.status}</span>
        </td>
        <td>{dateText(item.paymentDate || item.createdAt)}</td>
      </tr>
    ));
    const eventMax = Math.max(
      1,
      ...(dashboard.eventRevenue || []).map((item, index) => Number(item.revenue || 0))
    );
    const eventBars = listOrEmpty(
      (dashboard.eventRevenue || []).map((item, index) => (
        <div
          className="finance-chart-row"
          key={
            item?.id ??
            item?.eventReportId ??
            item?.requestId ??
            item?.registrationId ??
            item?.ticketId ??
            item?.eventId ??
            item?.reportId ??
            item?.paymentId ??
            item?.refundId ??
            item?.notificationId ??
            item?.label ??
            item?.fileName ??
            index
          }
        >
          <span>{item.eventName}</span>
          <div className="finance-bar-track">
            <i
              style={{
                width: `${(Number(item.revenue || 0) / eventMax) * 100}%`,
              }}
            ></i>
          </div>
          <strong>{currency(item.revenue)}</strong>
        </div>
      )),
      <p className="small muted">No event revenue recorded.</p>
    );
    const trend = listOrEmpty(
      (dashboard.revenueTrend || []).map((item, index) => (
        <div className="finance-trend-item" key={item?.date ?? index}>
          <span>{item.date}</span>
          <strong>{currency(item.revenue)}</strong>
        </div>
      )),
      <p className="small muted">No revenue trend data available.</p>
    );
    content = (
      <>
        <div className="filter-row">
          <label className="small muted">
            From <FilterInput className="form-control" type="date" id="finance-from" value={from} />
          </label>
          <label className="small muted">
            To <FilterInput className="form-control" type="date" id="finance-to" value={to} />
          </label>
          <button
            className="btn btn-primary"
            onClick={() => portalActions.onApplyFinanceDateRange()}
          >
            Apply date range
          </button>
          <button className="btn btn-ghost" onClick={() => portalActions.onClearFinanceDateRange()}>
            Clear
          </button>
        </div>
        <div className="card">
          <div className="h4 mb-12">Recent payment activity</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Event</th>
                  <th>Attendee</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {listOrEmpty(
                  rows,
                  <tr>
                    <td colSpan="6" className="text-center py-20">
                      No payment records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid-2 mt-16">
          <div className="card">
            <div className="h4 mb-12">Revenue by event</div>
            {eventBars}
          </div>
          <div className="card">
            <div className="h4 mb-12">Captured revenue trend</div>
            <div className="finance-trend">{trend}</div>
          </div>
        </div>
      </>
    );
  } else if (tab === 'transactions') {
    const rows = (result.data || []).map((item, index) => (
      <tr key={item?.registrationId ?? item?.paymentId ?? index}>
        <td className="mono">{item.paymentId}</td>
        <td>{item.registrationId}</td>
        <td>{item.eventName}</td>
        <td>
          {item.attendeeName}
          <div className="small muted">{item.attendeeEmail}</div>
        </td>
        <td>{currency(item.amount)}</td>
        <td>{item.paymentMethod}</td>
        <td>
          <span className={`badge badge-${financeStatusBadge(item.status)}`}>{item.status}</span>
        </td>
        <td>{dateText(item.paymentDate || item.createdAt)}</td>
        <td>
          <button
            className="btn btn-ghost btn-sm"
            data-payment={encodeURIComponent(item.paymentId)}
            onClick={event =>
              portalActions.onOpenFinanceTransaction(event.currentTarget.dataset.payment)
            }
          >
            View
          </button>
        </td>
      </tr>
    ));
    content = (
      <div className="card">
        <div className="filter-row">
          <FilterInput
            className="form-control"
            id="finance-query"
            placeholder="Search payment, booking, attendee, or event"
            value={query}
          />
          <PortalSelect className="form-control" id="finance-status" value={status}>
            <option value="">All statuses</option>
            {['completed', 'pending', 'failed', 'refunded'].map((s, index) => (
              <option
                value={s}
                key={
                  s?.id ??
                  s?.requestId ??
                  s?.eventId ??
                  s?.registrationId ??
                  s?.reportId ??
                  s?.label ??
                  (typeof s === 'string' || typeof s === 'number' ? s : index)
                }
              >
                {s}
              </option>
            ))}
          </PortalSelect>
          <PortalSelect className="form-control" id="finance-method" value={method}>
            <option value="">All methods</option>
            <option value="DEMO_PROVIDER">Demo provider</option>
          </PortalSelect>
          <PortalSelect className="form-control" id="finance-event" value={eventId}>
            <option value="">All events</option>
            {(dashboard.eventRevenue || []).map((item, index) => (
              <option value={item.eventId || ''} key={item?.eventId ?? index}>
                {item.eventName}
              </option>
            ))}
          </PortalSelect>
          <PortalSelect className="form-control" id="finance-sort" value={sort}>
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
          </PortalSelect>
          <FilterInput className="form-control" type="date" id="finance-from" value={from} />
          <FilterInput className="form-control" type="date" id="finance-to" value={to} />
          <button
            className="btn btn-primary"
            onClick={() => portalActions.onRefreshFinanceCenter()}
          >
            Apply
          </button>
          <button className="btn btn-ghost" onClick={() => portalActions.onDownloadFinanceCsv()}>
            Download CSV
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Booking</th>
                <th>Event</th>
                <th>Attendee</th>
                <th>Amount (INR)</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listOrEmpty(
                rows,
                <tr>
                  <td colSpan="9" className="text-center py-20">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-16">
          <span className="small muted">
            {result.pagination.total || 0} matching records · page {result.pagination.page} of{' '}
            {Math.max(1, result.pagination.totalPages)}
          </span>
          <div>
            <button
              className="btn btn-ghost"
              {...(page <= 1
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => portalActions.onFinanceChangePage(-1)}
            >
              Previous
            </button>{' '}
            <button
              className="btn btn-ghost"
              {...(page >= result.pagination.totalPages
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => portalActions.onFinanceChangePage(1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  } else if (tab === 'refunds') {
    const filters = result.filters || {};
    const eventOptions = (filters.events || []).map((item, index) => (
      <option
        value={item.eventId}
        {...(refundEvent === item.eventId
          ? {
              selected: true,
            }
          : {})}
        key={item?.eventId ?? item?.name ?? index}
      >
        {item.name}
      </option>
    ));
    const organizerOptions = (filters.organizers || []).map((item, index) => (
      <option
        value={item.organizerId}
        {...(refundOrganizer === item.organizerId
          ? {
              selected: true,
            }
          : {})}
        key={item?.name ?? index}
      >
        {item.name}
      </option>
    ));
    const refundDate = value =>
      value
        ? new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          }).format(new Date(value))
        : '—';
    const refundMoney = value =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    const rows = (result.data || []).map((item, index) => (
      <tr key={item?.registrationId ?? item?.refundId ?? index}>
        <td className="mono">{item.refundId}</td>
        <td>{item.registrationId}</td>
        <td>
          {item.eventName}
          <div className="small muted">{item.organizerName}</div>
        </td>
        <td>{item.attendeeName}</td>
        <td>{refundMoney(item.originalPaymentAmount)}</td>
        <td>{refundMoney(item.amount)}</td>
        <td>{item.reason}</td>
        <td>
          <span
            className={`finance-refund-status finance-refund-status-${String(
              item.status
            ).toLowerCase()}`}
          >
            {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
          </span>
        </td>
        <td>{refundDate(item.requestedAt)}</td>
        <td>
          <button
            className="btn btn-ghost btn-sm"
            data-refund={encodeURIComponent(item.refundId)}
            onClick={event => portalActions.onOpenFinanceRefund(event.currentTarget.dataset.refund)}
          >
            View details
          </button>
        </td>
      </tr>
    ));
    const pagination = result.pagination || {
      page: 1,
      total: 0,
      totalPages: 0,
    };
    content = (
      <>
        <div className="finance-warning">
          <span className="finance-warning-icon">!</span>
          <span>
            Demo provider only; all existing payments are unverified or simulated. No live refunds
            or payouts are available. Commission policy is not configured; related amounts remain
            unavailable.
          </span>
        </div>
        <div className="finance-filter-toolbar">
          <label>
            <span>Date range</span>
            <PortalSelect className="form-control" id="finance-refund-range" value={refundRange}>
              <option value="last30">Last 30 days</option>
              <option value="last7">Last 7 days</option>
              <option value="thisMonth">This month</option>
              <option value="all">All time</option>
            </PortalSelect>
          </label>
          <label>
            <span>Event</span>
            <PortalSelect className="form-control" id="finance-refund-event" value={''}>
              <option value="">All events</option>
              {eventOptions}
            </PortalSelect>
          </label>
          <label>
            <span>Organizer</span>
            <PortalSelect className="form-control" id="finance-refund-organizer" value={''}>
              <option value="">All organizers</option>
              {organizerOptions}
            </PortalSelect>
          </label>
          <label>
            <span>Status</span>
            <PortalSelect className="form-control" id="finance-refund-status" value={refundStatus}>
              <option value="">All statuses</option>
              {['pending', 'completed', 'failed', 'not_applicable'].map(value => (
                <option value={value} key={value}>
                  {value.charAt(0).toUpperCase()}
                  {value.slice(1).replace('_', ' ')}
                </option>
              ))}
            </PortalSelect>
          </label>
          <label className="finance-refund-search">
            <span>Search</span>
            <FilterInput
              className="form-control"
              id="finance-refund-search"
              placeholder="Reference, booking, attendee"
              value={refundSearch}
            />
          </label>
          <label>
            <span>Sort</span>
            <PortalSelect className="form-control" id="finance-refund-sort" value={refundSort}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amountHigh">Amount: high to low</option>
              <option value="amountLow">Amount: low to high</option>
            </PortalSelect>
          </label>
          <div className="finance-filter-actions">
            <button
              className="btn btn-primary"
              onClick={() => portalActions.onApplyFinanceRefundFilters()}
            >
              Apply filters
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => portalActions.onResetFinanceRefundFilters()}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="card finance-refund-table-card">
          <div className="table-wrap">
            <table className="finance-refund-table">
              <thead>
                <tr>
                  <th>Refund request</th>
                  <th>Booking</th>
                  <th>Event</th>
                  <th>Attendee</th>
                  <th>Original payment</th>
                  <th>Requested amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listOrEmpty(
                  rows,
                  <tr>
                    <td colSpan="10" className="text-center py-20">
                      No refund requests match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="finance-refund-pagination">
            <span>
              {pagination.total} records · Page {pagination.page} of{' '}
              {Math.max(1, pagination.totalPages)}
            </span>
            <div>
              <button
                className="btn btn-ghost"
                {...(pagination.page <= 1
                  ? {
                      disabled: true,
                    }
                  : {})}
                onClick={() => portalActions.onFinanceChangePage(-1)}
              >
                Previous
              </button>
              <button
                className="btn btn-ghost"
                {...(pagination.page >= pagination.totalPages
                  ? {
                      disabled: true,
                    }
                  : {})}
                onClick={() => portalActions.onFinanceChangePage(1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </>
    );
  } else if (tab === 'commission') {
    content = (
      <div className="card">
        <div className="h4 mb-12">Commission &amp; revenue</div>
        <p className="small muted">
          Gross and net revenue below are calculated from persisted payment and refund records.
        </p>
        <div className="grid-3 mt-16">
          {metric('Gross captured revenue', currency(totals.grossRevenue), 'var(--green)')}
          {metric('Completed refunds', currency(totals.refundedAmount), 'var(--purple)')}
          {metric('Net revenue', currency(totals.netRevenue), 'var(--accent)')}
        </div>
        <div className="empty-desc mt-16">
          Commission policy is not configured. Commission and organizer payable amounts are
          unavailable until an administrator defines a policy.
        </div>
      </div>
    );
  } else {
    const title = tab === 'settlements' ? 'Organizer settlements' : 'Payment reconciliation';
    const explanation =
      tab === 'settlements'
        ? 'No payout provider or settlement policy is configured. No organizer payouts can be calculated or marked paid.'
        : 'The configured payment provider is DEMO_PROVIDER and does not provide gateway reconciliation records.';
    content = (
      <div className="card">
        <div className="h4 mb-12">{title}</div>
        <p className="empty-desc">{explanation}</p>
      </div>
    );
  }
  const pageTitle =
    {
      dashboard: 'Dashboard',
      transactions: 'Payment Transactions',
      refunds: 'Refund Management',
      settlements: 'Organizer Settlements',
      commission: 'Commission & Revenue',
      reconciliation: 'Payment Reconciliation',
    }[tab] || 'Finance';
  const pageHeader = (
    <div className="page-hd">
      <div className="page-hd-left">
        <div className="page-title">{pageTitle}</div>
        <div className="page-sub">Financial operations · INR · Asia/Kolkata</div>
      </div>
      <button className="btn btn-ghost" onClick={() => portalActions.onRenderPage('finance')}>
        Refresh
      </button>
    </div>
  );
  return [[pageHeader, tab === 'refunds' ? '' : metrics], content];
}
