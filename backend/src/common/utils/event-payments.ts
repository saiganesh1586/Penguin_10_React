import type { EventRequest, EventWorkflowPayment } from '../data-store';

export function completedEventPayments(payments: EventWorkflowPayment[], request: Pick<EventRequest, 'requestId' | 'eventId' | 'clientId'>): EventWorkflowPayment[] {
  const seen = new Set<string>();
  return payments.filter(payment => {
    if (payment.status !== 'completed' || payment.clientId !== request.clientId ||
      !(payment.requestId === request.requestId || Boolean(request.eventId && payment.eventId === request.eventId)) ||
      seen.has(payment.paymentId)) return false;
    seen.add(payment.paymentId);
    return true;
  });
}

export function eventAmountPaid(payments: EventWorkflowPayment[], request: Pick<EventRequest, 'requestId' | 'eventId' | 'clientId'>): number {
  return completedEventPayments(payments, request).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export function allocatePaymentRefunds<T extends { amount: number }>(
  payments: T[],
  feePercent: number,
): Array<{ payment: T; paidAmount: number; cancellationFee: number; amount: number }> {
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
    throw new Error('Cancellation fee percentage must be between 0 and 100');
  }
  const amounts = payments.map(payment => {
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Successful payment amount must be a non-negative number');
    return Math.round(amount * 100);
  });
  const totalPaid = amounts.reduce((sum, amount) => sum + amount, 0);
  const totalFee = Math.min(totalPaid, Math.round(totalPaid * feePercent / 100));
  let allocatedPaid = 0;
  let allocatedFee = 0;
  return payments.map((payment, index) => {
    const paidPaise = amounts[index];
    allocatedPaid += paidPaise;
    const nextFee = totalPaid === 0 ? 0 : Math.round(totalFee * allocatedPaid / totalPaid);
    const feePaise = nextFee - allocatedFee;
    allocatedFee = nextFee;
    return {
      payment,
      paidAmount: paidPaise / 100,
      cancellationFee: feePaise / 100,
      amount: (paidPaise - feePaise) / 100,
    };
  });
}
