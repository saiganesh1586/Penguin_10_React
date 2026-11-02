import { useFinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import {
  FinanceAreaChart,
  FinanceEventBars,
  FinanceRefundTrend,
  FinanceStatusDonut,
} from '../components/FinanceCharts.jsx';
import { FinanceHeader, FinanceRanges, FinanceStat } from '../components/FinanceHeader.jsx';
export default function DashboardPage() {
  const portalContext = useFinanceExecutiveContext();
  const portalActions = portalContext.actions;
  const { financeData, financeDate, financeFilters, financeMoney, financeTrend } = portalContext;
  let html = '';
  const data = financeData;
  const t = data.totals;
  const activity = [
    ...data.recentTransactions.map((row, index) => ({
      type: 'Payment',
      id: row.paymentId,
      date: row.createdAt,
      amount: row.amount,
      status: row.status,
      event: row.eventName,
      target: 'transactions',
    })),
    ...data.recentRefunds.map((row, index) => ({
      type: 'Refund',
      id: row.refundId,
      date: row.processedAt || row.requestedAt,
      amount: row.amount,
      status: row.status,
      event: row.eventName,
      target: 'refunds',
    })),
  ]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 10);
  html = (
    <>
      <FinanceHeader
        onRenderPage={portalContext.actions.onRenderPage}
        _currentPage={portalContext._currentPage}
        title={'Finance Dashboard'}
        subtitle={'Amounts come from persisted payment and refund records.'}
      />
      <FinanceRanges
        onFinanceSet={portalContext.actions.onFinanceSet}
        financeFilters={portalContext.financeFilters}
      />
      <>
        <div className="grid-4 finance-stats">
          <FinanceStat label={'Gross Ticket Revenue'} value={financeMoney(t.grossRevenue)} />
          <FinanceStat label={'Refunded Amount'} value={financeMoney(t.refundedAmount)} />
          <FinanceStat label={'Net Ticket Revenue'} value={financeMoney(t.netRevenue)} />
          <FinanceStat label={'Tickets Sold'} value={t.ticketsSold} />
          <FinanceStat label={'Successful Payments'} value={t.successfulPayments} />
          <FinanceStat label={'Failed Payments'} value={t.failedPayments} />
          <FinanceStat label={'Pending Payments'} value={t.pendingPayments} />
          <FinanceStat label={'Pending Refund Requests'} value={t.pendingRefundRequests} />
        </div>
        <div className="card mb-20">
          <div className="flex justify-between">
            <div className="h4">Revenue Trend</div>
            <PortalSelect
              className="form-control finance-granularity"
              onChange={event =>
                portalActions.onFinanceSet('granularity', event.currentTarget.value)
              }
              value={financeFilters.granularity}
            >
              {['daily', 'weekly', 'monthly', 'yearly'].map((x, index) => (
                <option
                  key={
                    x?.id ??
                    x?.requestId ??
                    x?.eventId ??
                    x?.registrationId ??
                    x?.reportId ??
                    x?.label ??
                    (typeof x === 'string' || typeof x === 'number' ? x : index)
                  }
                >
                  {x}
                </option>
              ))}
            </PortalSelect>
          </div>
          <FinanceAreaChart
            financeMoney={portalContext.financeMoney}
            rows={financeTrend(data.revenueTrend)}
          />
        </div>
        <div className="grid-2 mb-20">
          <div className="card">
            <div className="h4 mb-12">Payment Status</div>
            <FinanceStatusDonut rows={data.paymentStatuses} />
          </div>
          <div className="card">
            <div className="h4 mb-12">Event Revenue</div>
            <FinanceEventBars financeMoney={portalContext.financeMoney} rows={data.eventRevenue} />
          </div>
        </div>
        <div className="card mb-20">
          <div className="h4 mb-12">Refund Trend</div>
          <FinanceRefundTrend financeMoney={portalContext.financeMoney} rows={data.refundTrend} />
        </div>
        <div className="card">
          <div className="h4 mb-12">Recent Financial Activity</div>
          {activity.length ? (
            activity.map((row, index) => (
              <button
                className="finance-activity"
                onClick={() => {
                  portalActions.onFinanceNavigate(row.target);
                  portalActions.onFinanceDetail(row.target, row.id);
                }}
                key={row?.id ?? row?.date ?? index}
              >
                <span>
                  <strong>
                    {row.type} · {row.id}
                  </strong>
                  <small>
                    {row.event} · {financeDate(row.date)}
                  </small>
                </span>
                <span>
                  {financeMoney(row.amount)} · {row.status}
                </span>
              </button>
            ))
          ) : (
            <div className="empty">No recent activity in this range.</div>
          )}
        </div>
        <p className="small muted mt-14">
          The current payment provider is simulated. Revenue and refunds above reflect persisted
          demo-provider records.
        </p>
      </>
    </>
  );
  return html;
}
