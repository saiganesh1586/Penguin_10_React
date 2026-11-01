import type { DataStore, EventCancellation, EventRequest } from './data-store';
import { getEventPolicy } from './event-policy';

export const CANCELLATION_DEMO_SCENARIO = 'event-cancellation-workflow-v1' as const;

type DemoStore = Pick<
  DataStore,
  | 'clients'
  | 'organizers'
  | 'eventRequests'
  | 'events'
  | 'eventPlans'
  | 'eventWorkflowPayments'
  | 'eventWorkflowRefunds'
  | 'notifications'
>;

function insertMissing<T>(rows: T[], key: keyof T, row: T): void {
  if (!rows.some(existing => existing[key] === row[key])) rows.push(row);
}

/** Add linked cancellation examples without resetting saved demo interactions. */
export function seedEventCancellationDemo(store: DemoStore, now = new Date()): void {
  if (process.env.NODE_ENV === 'production') return;
  const client = store.clients.find(item => item.clientId === 'cli-001');
  const organizer = store.organizers.find(item => item.organizerId === 'org-001');
  if (!client || !organizer) return;

  const day = (offset: number) =>
    new Date(now.getTime() + (offset * 24 + 5.5) * 3_600_000).toISOString().slice(0, 10);
  const createdAt = new Date(now.getTime() - 7 * 86_400_000);
  const paidAt = new Date(now.getTime() - 3 * 86_400_000);
  const cancelledAt = new Date(now.getTime() - 86_400_000);
  const scenarios = [
    {
      key: 'deposit-ready',
      title: 'Deposit Paid - Cancel and Preview Refund (Demo)',
      days: 45,
      budget: 100000,
      paid: 30000,
      description:
        'Cancel this booking to preview a 3,000 fee and 27,000 refund on the 30,000 deposit.',
    },
    {
      key: 'paid-ready',
      title: 'Fully Paid - Cancel and Preview Refund (Demo)',
      days: 60,
      budget: 120000,
      paid: 120000,
      description: 'Cancel this fully paid booking to preview a 12,000 fee and 108,000 refund.',
    },
    {
      key: 'unpaid-ready',
      title: 'No Payment - Cancel Without a Fee (Demo)',
      days: 30,
      budget: 80000,
      paid: 0,
      description:
        'Cancel this unpaid booking to see zero cancellation fee and no refund required.',
    },
    {
      key: 'deadline-closed',
      title: 'Deadline Passed - Cancellation Blocked (Demo)',
      days: 7,
      budget: 90000,
      paid: 27000,
      description:
        'The event starts in seven days. Client cancellation is blocked by the 14-day notice policy.',
    },
    {
      key: 'client-cancelled',
      title: 'Client Cancelled - Refund Pending (Demo)',
      days: 35,
      budget: 200000,
      paid: 60000,
      description:
        'Client cancellation recorded: 60,000 paid, 6,000 fee, and 54,000 refund pending review.',
      cancelledBy: 'client',
      reason: 'The client postponed the annual gathering after a change to the company schedule.',
    },
    {
      key: 'organizer-cancelled',
      title: 'Organizer Cancelled - Full Refund Pending (Demo)',
      days: 50,
      budget: 80000,
      paid: 24000,
      description:
        'Organizer cancellation recorded: the entire 24,000 deposit is refundable, with no cancellation fee.',
      cancelledBy: 'organizer',
      reason: 'The organizer cancelled because the venue closed for emergency maintenance.',
    },
  ];

  for (const scenario of scenarios) {
    const requestId = `req-demo-cancel-${scenario.key}`;
    if (store.eventRequests.some(item => item.requestId === requestId)) continue;
    const eventId = `evt-demo-cancel-${scenario.key}`;
    const planId = `plan-demo-cancel-${scenario.key}`;
    const paymentId = `pay-demo-cancel-${scenario.key}`;
    const refundId = `ref-demo-cancel-${scenario.key}`;
    const policy = getEventPolicy();
    const eventDate = day(scenario.days);
    const deadline = new Date(
      new Date(`${eventDate}T10:00:00+05:30`).getTime() -
        policy.cancellation.minimumNoticeDays * 86_400_000
    ).toISOString();
    const isCancelled = !!scenario.cancelledBy;
    const feePercent = scenario.cancelledBy === 'organizer' ? 0 : policy.cancellation.feePercent;
    const fee = Math.round(scenario.paid * feePercent) / 100;
    const cancellation: EventCancellation | undefined = isCancelled
      ? {
          reason: scenario.reason!,
          cancelledBy: scenario.cancelledBy === 'organizer' ? organizer.userId : client.userId,
          cancelledAt,
          policyVersion: policy.version,
          paidAmount: scenario.paid,
          cancellationFeePercent: feePercent,
          cancellationFee: fee,
          refundAmount: scenario.paid - fee,
          organizerRefundAmount: 0,
          refundSimulated: scenario.paid - fee > 0,
          refundStatus: scenario.paid - fee > 0 ? 'pending' : 'not_applicable',
          ...(scenario.paid - fee > 0 ? { refundId } : {}),
          cancellationDeadline: deadline,
        }
      : undefined;
    const paymentStatus: EventRequest['paymentStatus'] =
      scenario.paid >= scenario.budget
        ? 'fully_paid'
        : scenario.paid > 0
        ? 'deposit_paid'
        : 'unpaid';
    store.eventRequests.push({
      requestId,
      eventId,
      clientId: client.clientId,
      organizerId: organizer.organizerId,
      eventName: scenario.title,
      eventType: 'Corporate',
      eventDate,
      eventTime: '10:00',
      city: 'Bengaluru',
      venue: 'Demo Convention Hall, Bengaluru',
      visibility: 'private',
      budget: scenario.budget,
      capacity: 100,
      ticketPrice: 0,
      requirements: scenario.description,
      status: isCancelled ? 'cancelled' : 'confirmed',
      agreementStatus: 'agreed',
      paymentStatus,
      activeEventPlanId: planId,
      policySnapshot: policy,
      cancellation,
      clientPolicyAcceptedAt: createdAt,
      clientPolicyAcceptedBy: client.userId,
      organizerPolicyAcceptedAt: createdAt,
      organizerPolicyAcceptedBy: organizer.userId,
      proposals: [],
      negotiations: [],
      clarifications: [],
      auditHistory: [
        {
          id: `aud-demo-cancel-${scenario.key}-booked`,
          action: 'Demo Booking Created',
          performedBy: organizer.userId,
          role: 'event_organizer',
          timestamp: createdAt,
          details: { demoScenario: CANCELLATION_DEMO_SCENARIO },
        },
        ...(scenario.paid > 0
          ? [
              {
                id: `aud-demo-cancel-${scenario.key}-paid`,
                action: 'Demo Payment Verified',
                performedBy: client.userId,
                role: 'client',
                timestamp: paidAt,
                details: { amount: scenario.paid, paymentId },
              },
            ]
          : []),
        ...(cancellation
          ? [
              {
                id: `aud-demo-cancel-${scenario.key}-cancelled`,
                action:
                  scenario.cancelledBy === 'organizer'
                    ? 'Event Booking Cancelled by Organizer'
                    : 'Event Cancelled By Client',
                performedBy: cancellation.cancelledBy,
                role: scenario.cancelledBy === 'organizer' ? 'event_organizer' : 'client',
                timestamp: cancelledAt,
                details: { ...cancellation },
              },
            ]
          : []),
      ],
      demoScenario: CANCELLATION_DEMO_SCENARIO,
      createdAt,
      updatedAt: isCancelled ? cancelledAt : paidAt,
    });
    insertMissing(store.events, 'eventId', {
      eventId,
      clientId: client.clientId,
      organizerId: organizer.organizerId,
      name: scenario.title,
      category: 'Corporate',
      date: eventDate,
      time: '10:00',
      location: 'Demo Convention Hall, Bengaluru',
      city: 'Bengaluru',
      capacity: 100,
      ticketPrice: 0,
      visibility: 'private',
      status: isCancelled ? 'cancelled' : 'ongoing',
      description: scenario.description,
      cancellationDeadline: deadline,
      cancellationReason: cancellation?.reason,
      cancellation,
      policySnapshot: policy,
      demoScenario: CANCELLATION_DEMO_SCENARIO,
      createdAt,
      updatedAt: isCancelled ? cancelledAt : paidAt,
    });
    insertMissing(store.eventPlans, 'eventPlanId', {
      eventPlanId: planId,
      requestId,
      eventId,
      clientId: client.clientId,
      organizerId: organizer.organizerId,
      title: 'Approved cancellation demo plan',
      description: scenario.description,
      budget: scenario.budget,
      capacity: 100,
      revision: 1,
      status: 'approved',
      approvalStatus: 'approved',
      demoScenario: CANCELLATION_DEMO_SCENARIO,
      createdAt,
      updatedAt: createdAt,
    });
    if (scenario.paid > 0)
      insertMissing(store.eventWorkflowPayments, 'paymentId', {
        paymentId,
        requestId,
        eventId,
        clientId: client.clientId,
        organizerId: organizer.organizerId,
        amount: scenario.paid,
        status: 'completed',
        paymentDate: day(-3),
        paymentMethod: 'DEMO_PROVIDER',
        simulated: true,
        methodDetails: 'Cancellation workflow demo',
        createdAt: paidAt,
        updatedAt: paidAt,
      });
    if (cancellation?.refundId)
      insertMissing(store.eventWorkflowRefunds, 'refundId', {
        refundId,
        paymentId,
        requestId,
        eventId,
        clientId: client.clientId,
        organizerId: organizer.organizerId,
        payerId: client.clientId,
        recipientUserId: client.userId,
        recipientRole: 'client',
        paidAmount: scenario.paid,
        cancellationFee: cancellation.cancellationFee,
        amount: cancellation.refundAmount,
        reason: cancellation.reason,
        status: 'pending',
        simulated: true,
        requestedAt: cancelledAt,
      });
    if (cancellation)
      for (const userId of [client.userId, organizer.userId])
        insertMissing(store.notifications, 'notificationId', {
          notificationId: `notif-demo-cancel-${scenario.key}-${userId}`,
          userId,
          eventId,
          message: `${scenario.title}: ${
            cancellation.reason
          } Simulated refund due: INR ${cancellation.refundAmount.toLocaleString(
            'en-IN'
          )} (pending provider confirmation).`,
          type: 'event_cancelled',
          read: false,
          dateTime: cancelledAt,
          createdAt: cancelledAt,
        });
  }
}
