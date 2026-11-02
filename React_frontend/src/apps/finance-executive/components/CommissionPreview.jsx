import { FinanceHeader, FinanceStat } from './FinanceHeader.jsx';
import { FinanceEventBars } from './FinanceCharts.jsx';
export function CommissionPreview({
  financeCommissionDemo,
  financeMoney,
  onRenderPage,
  _currentPage,
}) {
  const rows = financeCommissionDemo;
  const sum = key => rows.reduce((total, row) => total + row[key], 0);
  return (
    <>
      <FinanceHeader
        onRenderPage={onRenderPage}
        _currentPage={_currentPage}
        title={'Commission & Revenue'}
        subtitle={'Illustrative sample for previewing commission reporting.'}
        refresh={false}
      />
      <>
        <div className="finance-demo-banner">
          <strong>DEMO DATA</strong>
          <span>
            These figures are examples only. They are not connected to EventFlow payments or an
            approved commission policy.
          </span>
        </div>
        <div className="grid-4 finance-stats mb-20">
          <FinanceStat label={'Sample Gross Revenue'} value={financeMoney(sum('gross'))} />
          <FinanceStat label={'Sample Refunds'} value={financeMoney(sum('refunds'))} />
          <FinanceStat label={'Sample Net Revenue'} value={financeMoney(sum('net'))} />
          <FinanceStat label={'Sample Commission · 12%'} value={financeMoney(sum('commission'))} />
        </div>
        <div className="grid-2 mb-20">
          <div className="card">
            <div className="h4 mb-14">Net Revenue by Event</div>
            <FinanceEventBars
              financeMoney={financeMoney}
              rows={rows.map((row, index) => ({
                eventName: row.event,
                revenue: row.net,
              }))}
            />
          </div>
          <div className="card">
            <div className="h4 mb-14">Commission by Event</div>
            <FinanceEventBars
              financeMoney={financeMoney}
              rows={rows.map((row, index) => ({
                eventName: row.event,
                revenue: row.commission,
              }))}
            />
          </div>
        </div>
        <div className="card">
          <div className="h4 mb-14">Illustrative Breakdown</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Tickets</th>
                  <th>Gross</th>
                  <th>Refunds</th>
                  <th>Net</th>
                  <th>Demo Rate</th>
                  <th>Commission</th>
                  <th>Organizer Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
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
                    <td>{row.event}</td>
                    <td>{row.organizer}</td>
                    <td>{row.tickets}</td>
                    <td>{financeMoney(row.gross)}</td>
                    <td>{financeMoney(row.refunds)}</td>
                    <td>{financeMoney(row.net)}</td>
                    <td>12% (demo)</td>
                    <td>{financeMoney(row.commission)}</td>
                    <td>{financeMoney(row.organizerShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted mt-14">
            Demo formula: (gross revenue − refunds) × 12%. These sample figures do not initiate
            payments.
          </p>
        </div>
      </>
    </>
  );
}
