import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { ActivityLogService } from '../../modules/activity-log/activity-log.service';

/**
 * Activity logging interceptor
 * Logs all CREATE, UPDATE, DELETE operations with meaningful action names
 * derived from the route path and HTTP method.
 */
@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(private activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;
    const role = (request as any).userRole;
    const actorUserId = (request as any).user?.userId;

    // Only log non-GET requests
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        this.activityLogService.logActivity({
          action: deriveActionName(method, path),
          resource: path,
          role: role || 'unknown',
          actorUserId,
          timestamp: new Date(),
          status: 'success',
          details: data,
        });
      }),
    );
  }
}

/**
 * Derive a meaningful snake_case action name from the HTTP method and URL path.
 *
 * Examples:
 *   POST /api/event-requests              → event_request_submitted
 *   POST /api/event-requests/:id/proposal → proposal_sent
 *   POST /api/event-requests/:id/cancel   → request_cancelled
 *   POST /api/events/:id/cancel           → event_cancelled
 */
function deriveActionName(method: string, path: string): string {
  // Normalise the path: remove leading /api, collapse UUIDs and numeric IDs
  const segments = path
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)
    .map((s) => (/^[a-f0-9-]{8,}$|^\d+$/.test(s) ? ':id' : s));

  const resource = segments[0] || 'resource';
  const sub = segments[2]; // action after /:id/

  // ── Event-request workflow ──────────────────────────────────────
  if (resource === 'event-requests') {
    if (!sub && method === 'POST') return 'event_request_submitted';
    if (sub === 'review') return 'request_review_started';
    if (sub === 'accept') return 'request_accepted_by_organizer';
    if (sub === 'accept-counteroffer') return 'counteroffer_accepted';
    if (sub === 'request-info') return 'info_requested_by_organizer';
    if (sub === 'provide-info') return 'info_provided_by_client';
    if (sub === 'proposal') return 'proposal_sent';
    if (sub === 'revise-proposal') return 'proposal_revised';
    if (sub === 'reject') return 'request_rejected_by_organizer';
    if (sub === 'client-response') return 'client_proposal_response';
    if (sub === 'agreement') return 'agreement_status_updated';
    if (sub === 'confirm') return 'booking_confirmed';
    if (sub === 'pay-deposit') return 'deposit_payment_completed';
    if (sub === 'modifications') {
      return method === 'POST' ? 'modification_requested' : 'modification_responded';
    }
    if (sub === 'cancellation-preview') return 'cancellation_preview_viewed';
    if (sub === 'cancel') return 'request_cancelled';
    if (sub === 'status') return 'request_status_updated';
    if (method === 'PATCH') return 'request_updated';
  }

  // ── Events ───────────────────────────────────────────────────────
  if (resource === 'events') {
    if (!sub && method === 'POST') return 'event_created';
    if (sub === 'cancel') return 'event_cancelled';
    if (sub === 'cancellation-preview') return 'event_cancellation_preview';
    if (method === 'PATCH') return 'event_updated';
    if (method === 'DELETE') return 'event_deleted';
  }

  // ── Payments ─────────────────────────────────────────────────────
  if (resource === 'payments') {
    if (method === 'POST') return 'payment_initiated';
    if (method === 'PATCH') return 'payment_status_updated';
  }

  // ── Registrations ────────────────────────────────────────────────
  if (resource === 'registrations') {
    if (!sub && method === 'POST') return 'registration_created';
    if (sub === 'cancel') return 'registration_cancelled';
    if (method === 'PATCH') return 'registration_updated';
  }

  // ── Auth ─────────────────────────────────────────────────────────
  if (resource === 'auth') {
    const authSub = segments[1];
    if (authSub === 'login') return 'user_login';
    if (authSub === 'logout') return 'user_logout';
  }

  // Fallback: derive from resource + method
  const methodLabel: Record<string, string> = {
    POST: 'created',
    PUT: 'updated',
    PATCH: 'updated',
    DELETE: 'deleted',
  };
  const label = methodLabel[method] || method.toLowerCase();
  return `${resource.replace(/-/g, '_')}_${label}`;
}
