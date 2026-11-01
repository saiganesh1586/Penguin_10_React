import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataStore, ActivityLog } from '../../common/data-store';
import { UserRole } from '../../common/constants';

@Injectable()
export class ActivityLogService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  logActivity(logEntry: Omit<ActivityLog, 'id'>): ActivityLog {
    const log: ActivityLog = {
      id: this.dataStore.generateId('log'),
      ...logEntry,
    };

    this.dataStore.activityLogs.push(log);
    return log;
  }

  findAll(
    limit = 100,
    offset = 0
  ): {
    logs: ActivityLog[];
    total: number;
  } {
    const allLogs = this.dataStore.activityLogs.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return {
      logs: allLogs.slice(offset, offset + limit),
      total: allLogs.length,
    };
  }

  findByRole(role: string): ActivityLog[] {
    return this.dataStore.activityLogs
      .filter(log => log.role === role)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  findByAction(action: string): ActivityLog[] {
    return this.dataStore.activityLogs
      .filter(log => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Returns meaningful, client-specific activity derived from:
   *  1. The interceptor-logged activity entries that belong to this client.
   *  2. The audit-history embedded in the client's own event requests, synthesised
   *     into ActivityLog-shaped objects that carry eventName, requestId, amount, etc.
   *
   * This ensures the dashboard always shows real lifecycle events (submitted,
   * proposal received, accepted, booking confirmed, cancelled …) and never shows
   * raw HTTP method strings.
   */
  findForClient(userId: string, role: UserRole, limit = 5): ActivityLog[] {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only clients can view client activity');
    }

    const client = this.dataStore.clients.find(
      item => item.userId === userId || item.clientId === userId
    );
    const clientIdentifiers = new Set([userId, client?.clientId].filter(Boolean).map(String));

    // ── 1. Activity-log entries that belong to this client ──────────
    const directLogs = this.dataStore.activityLogs
      .filter(log => this.belongsToClient(log, clientIdentifiers))
      .filter(log => !RAW_METHOD_ACTIONS.includes(log.action))
      .filter(log => !['user_login', 'user_logout'].includes(log.action))
      .map(log => {
        const details = (log.details as any) || {};
        const nestedData = details.data || {};
        const eventName = details.eventName || nestedData.eventName || nestedData.name || '';
        const requestId = details.requestId || nestedData.requestId || '';
        const amount = details.amount || nestedData.amount || 0;
        const description =
          details.description ||
          nestedData.description ||
          buildActivityDescription(log.action, eventName, amount);
        return {
          ...log,
          details: {
            ...details,
            ...(eventName ? { eventName } : {}),
            ...(requestId ? { requestId } : {}),
            ...(amount ? { amount } : {}),
            description: description || 'Event request activity',
          },
        };
      });

    // ── 2. Synthesise from event-request audit history ───────────────
    const clientId = client?.clientId;
    const clientRequests = this.dataStore.eventRequests.filter(
      request =>
        request.clientId === clientId ||
        clientIdentifiers.has(String(request.clientId)) ||
        clientIdentifiers.has(String((request as any).userId))
    );

    const syntheticLogs: ActivityLog[] = [];
    for (const req of clientRequests) {
      const requestId = req.requestId;
      const eventName = req.eventName || 'Event Request';
      // Derive the latest payment amount from proposals or budget
      const latestProposal =
        Array.isArray(req.proposals) && req.proposals.length > 0
          ? req.proposals[req.proposals.length - 1]
          : null;
      const amount = latestProposal?.amount || req.budget || 0;

      for (const entry of req.auditHistory || []) {
        const action = mapAuditActionToActivityAction(entry.action, entry.role);
        if (!action) continue;

        syntheticLogs.push({
          id: `synthetic-${requestId}-${entry.id}`,
          action,
          resource: `event-request`,
          role: entry.role || 'client',
          actorUserId: entry.performedBy,
          timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
          status: 'success',
          details: {
            requestId,
            eventName,
            amount: clientActionShowsAmount(action) ? amount : undefined,
            description: buildActivityDescription(action, eventName, amount),
          },
        });
      }

      // Also add current-status entry if no audit entry covers it yet
      if (req.cancellation) {
        const cancelledAt =
          req.cancellation.cancelledAt instanceof Date
            ? req.cancellation.cancelledAt
            : new Date(req.cancellation.cancelledAt);
        syntheticLogs.push({
          id: `synthetic-cancel-${requestId}`,
          action: 'request_cancelled',
          resource: 'event-request',
          role: 'client',
          actorUserId: req.cancellation.cancelledBy || userId,
          timestamp: cancelledAt,
          status: 'success',
          details: {
            requestId,
            eventName,
            description: `Cancellation requested — ${eventName}`,
            reason: req.cancellation.reason,
            refundAmount: req.cancellation.refundAmount,
          },
        });
      }
    }

    // ── 3. Merge, de-duplicate by id, sort newest-first, and cap ────
    const combined = [...directLogs, ...syntheticLogs];
    const seen = new Set<string>();
    const deduped = combined.filter(log => {
      if (seen.has(log.id)) return false;
      seen.add(log.id);
      return true;
    });

    return deduped
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, Math.min(Math.max(limit, 1), 20));
  }

  private belongsToClient(log: ActivityLog, clientIdentifiers: Set<string>): boolean {
    if (log.actorUserId && clientIdentifiers.has(String(log.actorUserId))) {
      return true;
    }

    return this.containsClientIdentifier(log.details, clientIdentifiers);
  }

  private containsClientIdentifier(value: unknown, clientIdentifiers: Set<string>): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
      const normalizedKey = key.toLowerCase();
      if (
        ['clientid', 'userid', 'performedby'].includes(normalizedKey) &&
        typeof nestedValue !== 'object' &&
        clientIdentifiers.has(String(nestedValue))
      ) {
        return true;
      }

      return this.containsClientIdentifier(nestedValue, clientIdentifiers);
    });
  }

  getStatistics(): {
    totalActions: number;
    actionCounts: { [key: string]: number };
    roleCounts: { [key: string]: number };
  } {
    const logs = this.dataStore.activityLogs;

    const actionCounts: { [key: string]: number } = {};
    const roleCounts: { [key: string]: number } = {};

    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      roleCounts[log.role] = (roleCounts[log.role] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      roleCounts,
    };
  }

  clearLogs(): { message: string } {
    this.dataStore.activityLogs = [];
    return { message: 'All activity logs cleared' };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Old interceptor used to store the raw HTTP method as the action; skip those. */
const RAW_METHOD_ACTIONS = ['POST', 'PUT', 'PATCH', 'DELETE', 'GET'];

/**
 * Map an audit-history `action` string (human-readable, stored by the service)
 * to an activity-log action key (snake_case, used by the frontend label mapper).
 */
function mapAuditActionToActivityAction(auditAction: string, role?: string): string | null {
  const a = (auditAction || '').toLowerCase();

  if (a.includes('request submitted')) return 'event_request_submitted';
  if (a.includes('review started')) return 'request_review_started';
  if (a.includes('accepted') && a.includes('organizer')) return 'request_accepted_by_organizer';
  if (a.includes('rejected') && (role === 'event_organizer' || a.includes('organizer')))
    return 'request_rejected_by_organizer';
  if (a.includes('clarification requested') || a.includes('info requested'))
    return 'info_requested_by_organizer';
  if (a.includes('clarification provided') || a.includes('info provided'))
    return 'info_provided_by_client';
  if (a.includes('proposal sent') || a.startsWith('proposal (v')) return 'proposal_sent';
  if (a.includes('proposal revised') || a.includes('revise')) return 'proposal_revised';
  if (a.includes('proposal accepted') && (role === 'client' || a.includes('client')))
    return 'client_proposal_accepted';
  if (a.includes('revision requested')) return 'revision_requested_by_client';
  if (
    a.includes('agreement') &&
    (a.includes('signed') || a.includes('agreed') || a.includes('acknowledged'))
  )
    return 'agreement_status_updated';
  if (a.includes('deposit') && a.includes('paid')) return 'deposit_payment_completed';
  if (a.includes('deposit') && a.includes('confirm')) return 'deposit_payment_completed';
  if (a.includes('booking confirmed')) return 'booking_confirmed';
  if (a.includes('withdrawn') || (a.includes('withdraw') && role === 'client'))
    return 'request_withdrawn';
  if (a.includes('cancelled') || a.includes('event cancelled')) return 'request_cancelled';
  if (a.includes('modification requested')) return 'modification_requested';
  if (a.includes('modification approved') || a.includes('modification rejected'))
    return 'modification_responded';
  if (a.includes('counteroffer')) return 'counteroffer_sent';

  return null; // skip unrecognised entries
}

function clientActionShowsAmount(action: string): boolean {
  return [
    'proposal_sent',
    'proposal_revised',
    'client_proposal_accepted',
    'deposit_payment_completed',
    'booking_confirmed',
    'request_cancelled',
  ].includes(action);
}

/**
 * Build the human-readable description shown in the Recent Activity panel.
 */
function buildActivityDescription(action: string, eventName: string, amount: number): string {
  const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  switch (action) {
    case 'event_request_submitted':
      return `Event request submitted — ${eventName}`;
    case 'request_review_started':
      return `Organizer started reviewing request — ${eventName}`;
    case 'request_accepted_by_organizer':
      return `Organizer accepted request — ${eventName}`;
    case 'request_rejected_by_organizer':
      return `Organizer rejected request — ${eventName}`;
    case 'info_requested_by_organizer':
      return `Organizer requested more info — ${eventName}`;
    case 'info_provided_by_client':
      return `Additional information provided — ${eventName}`;
    case 'proposal_sent':
      return `Organizer proposal received${amount ? ` (${fmt(amount)})` : ''} — ${eventName}`;
    case 'proposal_revised':
      return `Revised proposal received${amount ? ` (${fmt(amount)})` : ''} — ${eventName}`;
    case 'client_proposal_accepted':
      return `Proposal accepted${amount ? ` (${fmt(amount)})` : ''} — ${eventName}`;
    case 'revision_requested_by_client':
      return `Proposal revision requested — ${eventName}`;
    case 'agreement_status_updated':
      return `Agreement signed — ${eventName}`;
    case 'deposit_payment_completed':
      return `Deposit payment confirmed${amount ? ` (${fmt(amount)})` : ''} — ${eventName}`;
    case 'booking_confirmed':
      return `Booking confirmed — ${eventName}`;
    case 'request_withdrawn':
      return `Request withdrawn — ${eventName}`;
    case 'request_cancelled':
      return `Cancellation requested — ${eventName}`;
    case 'modification_requested':
      return `Modification requested — ${eventName}`;
    case 'modification_responded':
      return `Modification responded — ${eventName}`;
    case 'counteroffer_sent':
      return `Counteroffer submitted — ${eventName}`;
    default:
      return `${action.replace(/_/g, ' ')} — ${eventName}`;
  }
}
