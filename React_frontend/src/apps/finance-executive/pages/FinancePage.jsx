import FilterInput from '../../../app/FilterInput.jsx';
import React from 'react';
import { useFinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
import { FinanceHeader, FinanceRanges } from '../components/FinanceHeader.jsx';
export default function FinancePage({ page }) {
  const portalContext = useFinanceExecutiveContext();
  const portalActions = portalContext.actions;
  const { financeData, financeDate, financeFilters, financeMoney } = portalContext;
  let html = '';
  const data = financeData;
  const rows = data.data || [];
  html = (
    <>
      <FinanceHeader
        onRenderPage={portalContext.actions.onRenderPage}
        _currentPage={portalContext._currentPage}
        title={page === 'transactions' ? 'Payment Transactions' : 'Refund Management'}
        subtitle={
          page === 'transactions'
            ? 'Search and inspect persisted payment attempts.'
            : 'Review refund requests and their current processing status.'
        }
      />
      <FinanceRanges
        onFinanceSet={portalContext.actions.onFinanceSet}
        financeFilters={portalContext.financeFilters}
      />
      <>
        <div className="filter-row finance-filters">
          <label>
            Search{' '}
            <FilterInput
              className="form-control"
              value={financeFilters.search}
              placeholder="ID, attendee or event"
              onChange={event => portalActions.onFinanceSet('search', event.currentTarget.value)}
            />
          </label>
          <label>
            Status{' '}
            <PortalSelect
              className="form-control"
              onChange={event => portalActions.onFinanceSet('status', event.currentTarget.value)}
              value={financeFilters.status}
            >
              <option value="">All</option>
              {(page === 'transactions'
                ? ['pending', 'completed', 'failed', 'refunded']
                : ['pending', 'completed', 'failed', 'not_applicable']
              ).map((x, index) => (
                <option
                  value={x}
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
          </label>
          <label>
            Event{' '}
            <PortalSelect
              className="form-control"
              onChange={event => portalActions.onFinanceSet('eventId', event.currentTarget.value)}
              value={financeFilters.eventId}
            >
              <option value="">All events</option>
              {(data.filters?.events || []).map((event, index) => (
                <option value={event.eventId} key={event?.eventId ?? event?.name ?? index}>
                  {event.name}
                </option>
              ))}
            </PortalSelect>
          </label>
          {page === 'transactions' ? (
            <>
              <label>
                Method{' '}
                <PortalSelect
                  className="form-control"
                  onChange={event =>
                    portalActions.onFinanceSet('paymentMethod', event.currentTarget.value)
                  }
                  value={financeFilters.paymentMethod}
                >
                  <option value="">All methods</option>
                  {(data.filters?.methods || []).map((value, index) => (
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
              <label>
                Sort{' '}
                <PortalSelect
                  className="form-control"
                  onChange={event => portalActions.onFinanceSet('sort', event.currentTarget.value)}
                  value={financeFilters.sort}
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                </PortalSelect>
              </label>
              <label>
                Direction{' '}
                <PortalSelect
                  className="form-control"
                  onChange={event =>
                    portalActions.onFinanceSet('direction', event.currentTarget.value)
                  }
                  value={financeFilters.direction}
                >
                  <option value="desc">Newest / highest</option>
                  <option value="asc">Oldest / lowest</option>
                </PortalSelect>
              </label>
            </>
          ) : (
            ''
          )}
          <button className="btn btn-ghost" onClick={() => portalActions.onFinanceReset()}>
            Reset
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                {page === 'transactions' ? (
                  <tr>
                    <th>Transaction</th>
                    <th>Booking</th>
                    <th>Event</th>
                    <th>Attendee</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                ) : (
                  <tr>
                    <th>Refund</th>
                    <th>Booking</th>
                    <th>Event</th>
                    <th>Attendee</th>
                    <th>Payment</th>
                    <th>Requested</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody>
                {listOrEmpty(
                  rows.map((row, index) => (
                    <React.Fragment
                      key={row?.registrationId ?? row?.paymentId ?? row?.refundId ?? index}
                    >
                      {page === 'transactions' ? (
                        <tr>
                          <td className="mono">{row.paymentId}</td>
                          <td>{row.registrationId}</td>
                          <td>{row.eventName}</td>
                          <td>{row.attendeeName}</td>
                          <td>{financeMoney(row.amount)}</td>
                          <td>{row.paymentMethod}</td>
                          <td>{row.status}</td>
                          <td>{financeDate(row.createdAt)}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() =>
                                portalActions.onFinanceDetail('transactions', row.paymentId)
                              }
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="mono">{row.refundId}</td>
                          <td>{row.registrationId}</td>
                          <td>{row.eventName}</td>
                          <td>{row.attendeeName}</td>
                          <td>{financeMoney(row.originalPaymentAmount)}</td>
                          <td>{financeMoney(row.amount)}</td>
                          <td>{row.reason}</td>
                          <td>{row.status}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => portalActions.onFinanceDetail('refunds', row.refundId)}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )),
                  <tr>
                    <td colSpan="9">No {page} match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="finance-pager">
            <span>
              {data.pagination.total} records · page {data.pagination.page} of{' '}
              {data.pagination.totalPages || 1}
            </span>
            <button
              className="btn btn-ghost btn-xs"
              {...(data.pagination.page <= 1
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => portalActions.onFinanceSet('page', data.pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-ghost btn-xs"
              {...(data.pagination.page >= data.pagination.totalPages
                ? {
                    disabled: true,
                  }
                : {})}
              onClick={() => portalActions.onFinanceSet('page', data.pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </>
    </>
  );
  return html;
}
