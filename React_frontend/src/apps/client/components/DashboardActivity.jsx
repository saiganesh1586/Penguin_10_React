const actionStatuses = {
  event_request_submitted: 'submitted',
  request_rejected_by_organizer: 'rejected',
  request_withdrawn: 'withdrawn',
  request_cancelled: 'cancelled',
  booking_confirmed: 'confirmed',
  deposit_payment_completed: 'active',
  client_proposal_accepted: 'active',
  agreement_status_updated: 'active',
};
export default function DashboardActivity({
  rows,
  loading,
  error,
  onRetry,
  onViewRequest,
  clientActivityLabel,
  clientActivityIcon,
  clientActivityTime,
  reqBadge,
}) {
  return (
    <>
      <div className="h4 mb-12">Recent Activity</div>
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {[1, 2, 3].map(row => (
            <div
              key={row}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  height: 14,
                  width: '65%',
                  background: 'var(--surface2)',
                  borderRadius: 4,
                  marginBottom: 6,
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <div
                style={{
                  height: 11,
                  width: '40%',
                  background: 'var(--surface2)',
                  borderRadius: 4,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            </div>
          ))}
        </div>
      ) : error || !rows.length ? (
        <div
          className="empty"
          style={{
            padding: '20px 0',
          }}
        >
          <div className="empty-icon">{error ? '⚠️' : '📭'}</div>
          <div className="empty-title">
            {error ? 'Unable to load activity' : 'No recent activity'}
          </div>
          <div className="empty-desc">
            {error ? 'Please try again later.' : 'Updates to your event requests will appear here.'}
          </div>
          {error && (
            <button className="btn btn-ghost btn-sm mt-12" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {rows.map(activity => {
            const details = activity.details || {};
            const description =
              details.description || activity.description || clientActivityLabel(activity);
            const amount = details.amount || activity.amount || 0;
            const requestId = details.requestId || activity.requestId;
            const status = actionStatuses[activity.action] || activity.status || 'active';
            return (
              <div
                key={activity.id ?? JSON.stringify([
                  activity.timestamp || activity.createdAt,
                  activity.action,
                  requestId,
                  description,
                ])}
                className="flex justify-between items-center gap-10"
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {clientActivityIcon(activity.action)}
                  </span>
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: 'var(--text)',
                        }}
                      >
                        {description}
                      </span>
                      <span
                        className={`badge badge-${reqBadge(status)}`}
                        style={{
                          fontSize: 10.5,
                          padding: '2px 6px',
                        }}
                      >
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div
                      className="small"
                      style={{
                        color: 'var(--text2)',
                        marginTop: 3,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      {Boolean(amount) && (
                        <span
                          style={{
                            color: 'var(--green)',
                            fontWeight: 600,
                          }}
                        >
                          ₹{Number(amount).toLocaleString('en-IN')}
                        </span>
                      )}
                      <time
                        dateTime={activity.timestamp || activity.createdAt || ''}
                        style={{
                          color: 'var(--text3)',
                        }}
                      >
                        {clientActivityTime(activity.timestamp || activity.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  style={{
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                    flexShrink: 0,
                  }}
                  onClick={() => onViewRequest(requestId)}
                >
                  View Request Status
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
