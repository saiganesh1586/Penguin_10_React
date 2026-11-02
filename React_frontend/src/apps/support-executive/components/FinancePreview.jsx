import FilterInput from '../../../app/FilterInput.jsx';
import React from 'react';
import { listOrEmpty } from '../../../app/view-utils.js';
export function FinancePreview({
  financeTransactions,
  financeRefunds,
  registrations,
  users,
  events,
  onSwitchFinanceTab,
  onRefreshFinanceCenter,
  financeStatusBadgeDemo,
}) {
  const tab = sessionStorage.getItem('finance_tab') || 'transactions';
  const query = (sessionStorage.getItem('finance_query') || '').toLowerCase();
  const commissionRate = 0.15;
  const allTransactions = Array.isArray(financeTransactions) ? financeTransactions : [];
  const refundRecords = Array.isArray(financeRefunds) ? financeRefunds : [];
  const paidRegistrations = (registrations || []).filter(
    registration =>
      String(registration.payment || '').toLowerCase() === 'paid' &&
      ['confirmed', 'verified'].includes(String(registration.status || '').toLowerCase())
  );
  const successfulTransactions = allTransactions.filter(tx => tx.status === 'Successful');
  const totalRevenue = successfulTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const platformCommission = totalRevenue * commissionRate;
  const organizerPayout = totalRevenue - platformCommission;
  const records = tab === 'transactions' ? allTransactions : refundRecords;
  const filtered = records.filter(item => {
    const user = users.find(u => String(u.id) === String(item.userId)) || {};
    const event =
      events.find(currentEvent => String(currentEvent.id) === String(item.eventId)) || {};
    const text = `${item.id || ''} ${user.name || ''} ${user.email || ''} ${event.title || ''} ${
      item.status || ''
    } ${item.reason || ''}`.toLowerCase();
    return !query || text.includes(query);
  });
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Finance &amp; Revenue</div>
          <div className="page-sub">
            Track registration revenue, platform commission, organizer payouts, and customer payment
            activity.
          </div>
        </div>
      </div>
      <div className="grid-4 mb-20">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            💰
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-sub neutral">Completed payment records</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            📈
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            ₹{platformCommission.toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Platform Commission</div>
          <div className="stat-sub neutral">Fixed 15% fee share</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
            }}
          >
            💸
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--yellow)',
            }}
          >
            ₹{organizerPayout.toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Organizer Payouts</div>
          <div className="stat-sub neutral">Net payout after commission</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--purple-dim)',
              color: 'var(--purple)',
            }}
          >
            🧾
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--purple)',
            }}
          >
            {successfulTransactions.length}
          </div>
          <div className="stat-label">Successful Transactions</div>
          <div className="stat-sub neutral">Monitored payment records</div>
        </div>
      </div>
      <div
        className="card"
        style={{
          marginBottom: '20px',
        }}
      >
        <div className="flex justify-between items-center mb-12">
          <div className="h4">Event-wise Revenue &amp; Commission</div>
          <div className="small muted">Commission formula: registration fee × 15%</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Payments</th>
                <th>Gross Revenue</th>
                <th>Platform Commission</th>
                <th>Organizer Payout</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const eventSummary = {};
                successfulTransactions.forEach(tx => {
                  const event = events.find(
                    currentEvent => String(currentEvent.id) === String(tx.eventId)
                  ) || {
                    title: 'Unknown Event',
                  };
                  const eventKey = String(tx.eventId || event.title);
                  if (!eventSummary[eventKey]) {
                    eventSummary[eventKey] = {
                      eventTitle: event.title,
                      attendeeCount: 0,
                      revenue: 0,
                    };
                  }
                  eventSummary[eventKey].attendeeCount += 1;
                  eventSummary[eventKey].revenue += Number(tx.amount || 0);
                });
                const rows = Object.values(eventSummary);
                return rows.length ? (
                  rows.map((row, index) => {
                    const commission = row.revenue * commissionRate;
                    const payout = row.revenue - commission;
                    return (
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
                        <td>{row.eventTitle}</td>
                        <td>{row.attendeeCount}</td>
                        <td
                          style={{
                            color: 'var(--green)',
                            fontWeight: '700',
                          }}
                        >
                          ₹{row.revenue}
                        </td>
                        <td
                          style={{
                            color: 'var(--accent)',
                            fontWeight: '700',
                          }}
                        >
                          ₹{commission}
                        </td>
                        <td
                          style={{
                            color: 'var(--yellow)',
                            fontWeight: '700',
                          }}
                        >
                          ₹{payout}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-20">
                      No successful event revenue data found.
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        <button
          className={`btn ${tab === 'transactions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onSwitchFinanceTab('transactions')}
        >
          💳 Transactions
        </button>
        <button
          className={`btn ${tab === 'refunds' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onSwitchFinanceTab('refunds')}
        >
          ↩️ Refunds
        </button>
      </div>
      <div className="filter-row">
        <div className="search-box input-group">
          <span className="input-icon">🔍</span>
          <FilterInput
            className="form-control"
            id="finance-query"
            placeholder="Search finance records..."
            value={query}
            onInput={() => onRefreshFinanceCenter()}
          />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              {tab === 'transactions' ? (
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                </tr>
              ) : (
                <tr>
                  <th>Refund ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              )}
            </thead>
            <tbody>
              {listOrEmpty(
                filtered.map((item, index) => {
                  const user = users.find(u => String(u.id) === String(item.userId)) || {
                    name: 'Unknown',
                  };
                  const event = events.find(
                    currentEvent => String(currentEvent.id) === String(item.eventId)
                  ) || {
                    title: 'Unknown Event',
                  };
                  return (
                    <React.Fragment
                      key={item?.id ?? item?.eventId ?? item?.userId ?? item?.date ?? index}
                    >
                      {tab === 'transactions' ? (
                        <tr>
                          <td className="mono">{item.id}</td>
                          <td>{user.name}</td>
                          <td>{event.title}</td>
                          <td
                            style={{
                              color: 'var(--green)',
                              fontWeight: '700',
                            }}
                          >
                            ₹{item.amount}
                          </td>
                          <td>
                            <span className={`badge badge-${financeStatusBadgeDemo(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.date}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="mono">{item.id}</td>
                          <td>{user.name}</td>
                          <td>{event.title}</td>
                          <td
                            style={{
                              color: 'var(--green)',
                              fontWeight: '700',
                            }}
                          >
                            ₹{item.amount}
                          </td>
                          <td>{item.reason}</td>
                          <td>
                            <span className={`badge badge-${financeStatusBadgeDemo(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.date}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }),
                <tr>
                  <td colSpan={tab === 'transactions' ? 6 : 7} className="text-center py-20">
                    No finance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
