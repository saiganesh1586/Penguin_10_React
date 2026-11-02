import { useFinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
import { FinanceHeader, FinanceRanges, FinanceStat } from '../components/FinanceHeader.jsx';
import { FinanceReportHistory } from '../components/ReportHistory.jsx';
export default function ReportsPage() {
  const portalContext = useFinanceExecutiveContext();
  const portalActions = portalContext.actions;
  const { financeData, financeDate, financeFilters, financeMoney, financeQuery } = portalContext;
  let html = '';
  const params = new URLSearchParams(financeQuery());
  params.set('type', financeFilters.reportType);
  const data = financeData;
  const keys = data.rows.length
    ? Object.keys(data.rows[0]).filter(
        x => !['attendeeEmail', 'organizerId', 'eventId'].includes(x)
      )
    : [];
  html = (
    <>
      <FinanceHeader
        onRenderPage={portalContext.actions.onRenderPage}
        _currentPage={portalContext._currentPage}
        title={'Financial Reports'}
        subtitle={'Reports are generated from all matching backend records.'}
      />
      <FinanceRanges
        onFinanceSet={portalContext.actions.onFinanceSet}
        financeFilters={portalContext.financeFilters}
      />
      <>
        <div className="filter-row finance-filters">
          <label>
            Report{' '}
            <PortalSelect
              className="form-control"
              onChange={event =>
                portalActions.onFinanceSet('reportType', event.currentTarget.value)
              }
              value={financeFilters.reportType}
            >
              {[
                ['transactions', 'Payment Transactions'],
                ['refunds', 'Refunds'],
                ['events', 'Event Revenue'],
                ['daily', 'Daily Revenue'],
                ['monthly', 'Monthly Revenue'],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </PortalSelect>
          </label>
          <label>
            Event{' '}
            <PortalSelect
              className="form-control"
              onChange={event => portalActions.onFinanceSet('eventId', event.currentTarget.value)}
              value={financeFilters.eventId}
            >
              <option value="">All events</option>
              {data.options.events.map((row, index) => (
                <option value={row.id} key={row?.id ?? row?.name ?? index}>
                  {row.name}
                </option>
              ))}
            </PortalSelect>
          </label>
          <label>
            Organizer{' '}
            <PortalSelect
              className="form-control"
              onChange={event =>
                portalActions.onFinanceSet('organizerId', event.currentTarget.value)
              }
              value={financeFilters.organizerId}
            >
              <option value="">All organizers</option>
              {data.options.organizers.map((row, index) => (
                <option value={row.id} key={row?.id ?? row?.name ?? index}>
                  {row.name}
                </option>
              ))}
            </PortalSelect>
          </label>
          {['transactions', 'refunds'].includes(financeFilters.reportType) ? (
            <label>
              Status{' '}
              <PortalSelect
                className="form-control"
                onChange={event => portalActions.onFinanceSet('status', event.currentTarget.value)}
                value={financeFilters.status}
              >
                <option value="">All statuses</option>
                {(financeFilters.reportType === 'transactions'
                  ? ['pending', 'completed', 'failed', 'refunded']
                  : ['pending', 'completed', 'failed', 'not_applicable']
                ).map((value, index) => (
                  <option
                    value={value}
                    key={
                      value?.id ??
                      value?.requestId ??
                      value?.eventId ??
                      value?.registrationId ??
                      value?.reportId ??
                      value?.label ??
                      (typeof value === 'string' || typeof value === 'number' ? value : index)
                    }
                  >
                    {value}
                  </option>
                ))}
              </PortalSelect>
            </label>
          ) : (
            ''
          )}
          <button className="btn btn-primary" onClick={() => portalActions.onFinanceDownloadCsv()}>
            Download CSV
          </button>
          <button className="btn btn-ghost" onClick={() => portalActions.onFinanceDownloadPdf()}>
            Download PDF
          </button>
        </div>
        <div className="grid-4 mb-20">
          <FinanceStat label={'Gross Revenue'} value={financeMoney(data.summary.grossRevenue)} />
          <FinanceStat label={'Refunded'} value={financeMoney(data.summary.refundedAmount)} />
          <FinanceStat label={'Net Revenue'} value={financeMoney(data.summary.netRevenue)} />
          <FinanceStat label={'Matching Records'} value={data.total} />
        </div>
        <div className="card">
          <div className="small muted mb-12">
            Generated {financeDate(data.generatedAt)} · {data.total} rows
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {keys.map((key, index) => (
                    <th
                      key={
                        key?.id ??
                        key?.requestId ??
                        key?.eventId ??
                        key?.registrationId ??
                        key?.reportId ??
                        key?.label ??
                        (typeof key === 'string' || typeof key === 'number' ? key : index)
                      }
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listOrEmpty(
                  data.rows.slice(0, 100).map((row, index) => (
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
                      {keys.map(key => (
                        <td key={key}>{row[key]}</td>
                      ))}
                    </tr>
                  )),
                  <tr>
                    <td>No report records for these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.total > 100 ? (
            <div className="small muted">
              Showing first 100 rows. CSV includes all matching rows.
            </div>
          ) : (
            ''
          )}
        </div>
      </>
    </>
  );
  html = [
    html,
    <FinanceReportHistory
      financeSentPage={portalContext.financeSentPage}
      onFinanceOpenSubmitReport={portalContext.actions.onFinanceOpenSubmitReport}
      onRenderPage={portalContext.actions.onRenderPage}
      onFinanceSetSentStatus={portalContext.actions.onFinanceSetSentStatus}
      onFinanceViewSentReport={portalContext.actions.onFinanceViewSentReport}
      onFinanceChangeSentPage={portalContext.actions.onFinanceChangeSentPage}
      financeDate={portalContext.financeDate}
      financeSentReports={portalContext.financeSentReports}
      financeSentStatus={portalContext.financeSentStatus}
    />,
  ];
  return html;
}
