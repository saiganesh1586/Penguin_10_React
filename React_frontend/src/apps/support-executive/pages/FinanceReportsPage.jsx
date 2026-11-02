import FilterInput from '../../../app/FilterInput.jsx';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
export default function FinanceReportsPage() {
  const portalContext = useSupportExecutiveContext();
  const portalActions = portalContext.actions;
  const { financeReportData } = portalContext;
  const from = sessionStorage.getItem('finance_from') || '';
  const to = sessionStorage.getItem('finance_to') || '';
  try {
    if (portalContext.financeReportError) throw new Error(portalContext.financeReportError);
    const data = financeReportData;
    const totals = data.totals || {};
    const money = value =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: data.currency || 'INR',
      }).format(Number(value || 0));
    const rows = (data.eventRevenue || []).map((row, index) => (
      <tr
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
        <td>{row.eventName}</td>
        <td>{row.ticketsSold}</td>
        <td>{money(row.revenue)}</td>
      </tr>
    ));
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="page-title">Financial Reports</div>
            <div className="page-sub">Database-backed revenue summary and transaction export</div>
          </div>
        </div>
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
            Generate report
          </button>
          <button className="btn btn-ghost" onClick={() => portalActions.onDownloadFinanceCsv()}>
            Download transaction CSV
          </button>
        </div>
        <div className="grid-3 mb-20">
          <div className="stat-card">
            <div className="stat-value">{money(totals.grossRevenue)}</div>
            <div className="stat-label">Gross captured revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{money(totals.refundedAmount)}</div>
            <div className="stat-label">Completed refunds</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{money(totals.netRevenue)}</div>
            <div className="stat-label">Net revenue</div>
          </div>
        </div>
        <div className="card">
          <div className="h4 mb-12">Event revenue report</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Tickets sold</th>
                  <th>Captured revenue</th>
                </tr>
              </thead>
              <tbody>
                {listOrEmpty(
                  rows,
                  <tr>
                    <td colSpan="3" className="text-center py-20">
                      No event revenue for this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="small muted mt-16">
            Generated {new Date().toLocaleString('en-IN')}. PDF, payout, and gateway reconciliation
            reports are not available in the current demo integration.
          </p>
        </div>
      </>
    );
  } catch (error) {
    return (
      <div className="card">
        <div className="empty-title">Report data is unavailable</div>
        <p className="empty-desc">{error.message}</p>
        <button className="btn btn-primary" onClick={() => portalActions.onNavigate('reports')}>
          Retry
        </button>
      </div>
    );
  }
}
