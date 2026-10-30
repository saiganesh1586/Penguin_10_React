import type { EventRequest, EventWorkflowPayment } from '../data-store';

export function completedEventPayments(payments: EventWorkflowPayment[], request: Pick<EventRequest, 'requestId' | 'eventId' | 'clientId'>): EventWorkflowPayment[] {
  return payments.filter(payment => payment.status === 'completed' && payment.clientId === request.clientId &&
    (payment.requestId === request.requestId || Boolean(request.eventId && payment.eventId === request.eventId)));
}

export function eventAmountPaid(payments: EventWorkflowPayment[], request: Pick<EventRequest, 'requestId' | 'eventId' | 'clientId'>): number {
  return completedEventPayments(payments, request).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}
