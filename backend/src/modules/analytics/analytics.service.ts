import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { EmployeeType, UserRole } from '../../common/constants';
import '../../common/account-access';
@Injectable()
export class AnalyticsService {
  private db: DataStore;
  constructor() {
    this.db = DataStore.getInstance();
  }
  getDashboard(role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view analytics dashboard');
    }
    const totalRevenue =
      this.db.payments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0) +
      this.db.eventWorkflowPayments
        .filter(payment => payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);
    const users = this.db.users;
    return {
      success: true,
      message: 'Dashboard analytics',
      data: {
        users: {
          total: users.length,
          active: users.filter(user => user.status === 'active').length,
          suspended: users.filter(user => user.status === 'suspended').length,
          byRole: {
            super_admin: this.db.users.filter(user => user.userRole === UserRole.SUPER_ADMIN)
              .length,
            client: this.db.users.filter(user => user.userRole === UserRole.CLIENT).length,
            event_organizer: this.db.users.filter(
              user => user.userRole === UserRole.EVENT_ORGANIZER
            ).length,
            employee: users.filter(user => user.userRole === UserRole.EMPLOYEE).length,
            attendee: this.db.users.filter(user => user.userRole === UserRole.ATTENDEE).length,
          },
        },
        events: {
          total: this.db.events.length,
          draft: this.db.events.filter(event => event.status === 'draft').length,
          published: this.db.events.filter(event => event.status === 'published').length,
          ongoing: this.db.events.filter(event => event.status === 'ongoing').length,
          completed: this.db.events.filter(event => event.status === 'completed').length,
          cancelled: this.db.events.filter(event => event.status === 'cancelled').length,
        },
        eventRequests: {
          total: this.db.eventRequests.length,
          pending: this.db.eventRequests.filter(request => request.status === 'pending').length,
          approved: this.db.eventRequests.filter(request => request.status === 'approved').length,
          rejected: this.db.eventRequests.filter(request => request.status === 'rejected').length,
        },
        registrations: {
          total: this.db.registrations.length,
          registered: this.db.registrations.filter(
            registration => registration.status === 'registered'
          ).length,
          attended: this.db.registrations.filter(registration => registration.status === 'attended')
            .length,
          cancelled: this.db.registrations.filter(
            registration => registration.status === 'cancelled'
          ).length,
        },
        payments: {
          total: this.db.payments.length,
          completed: this.db.payments.filter(payment => payment.status === 'completed').length,
          totalRevenue,
        },
        attendance: {
          totalCheckIns: this.db.attendance.filter(a => a.status === 'checked-in').length,
        },
        reviews: {
          totalEventReviews: this.db.eventReviews.length,
          avgEventRating:
            this.db.eventReviews.length > 0
              ? parseFloat(
                  (
                    this.db.eventReviews.reduce((s, r) => s + r.rating, 0) /
                    this.db.eventReviews.length
                  ).toFixed(1)
                )
              : 0,
        },
        reports: {
          totalEventReports: this.db.eventReports.length,
        },
      },
    };
  }
  getOrganizerDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    const organizer = this.db.organizers.find(o => o.userId === userId);
    if (!organizer) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return {
        success: false,
        message: 'Organizer profile not found',
      };
    }

    const myEvents = this.db.events.filter(e => e.organizerId === organizer.organizerId);
    const myEventIds = myEvents.map(e => e.eventId);
    const activeEventIds = new Set(
      myEvents.filter(event => event.status !== 'cancelled').map(event => event.eventId)
    );
    const myRegs = this.db.registrations.filter(r => myEventIds.includes(r.eventId));
    const myRegistrationIds = new Set(myRegs.map(registration => registration.registrationId));
    const capturedTicketPayments = new Map<string, (typeof this.db.payments)[number]>();
    this.db.payments.forEach(payment => {
      if (
        !myRegistrationIds.has(payment.registrationId) ||
        !activeEventIds.has(
          myRegs.find(registration => registration.registrationId === payment.registrationId)
            ?.eventId || ''
        ) ||
        !['completed', 'refunded'].includes(payment.status)
      )
        return;
      const previous = capturedTicketPayments.get(payment.registrationId);
      if (
        !previous ||
        new Date(payment.createdAt).getTime() > new Date(previous.createdAt).getTime()
      ) {
        capturedTicketPayments.set(payment.registrationId, payment);
      }
    });
    const ticketPayments = [...capturedTicketPayments.values()];
    const workflowPayments = this.db.eventWorkflowPayments.filter(
      payment => activeEventIds.has(payment.eventId) && payment.status === 'completed'
    );
    const completedTicketRefunds = this.db.refunds.filter(
      refund =>
        myRegistrationIds.has(refund.registrationId) &&
        activeEventIds.has(
          myRegs.find(registration => registration.registrationId === refund.registrationId)
            ?.eventId || ''
        ) &&
        refund.status === 'completed'
    );
    const completedWorkflowRefunds = this.db.eventWorkflowRefunds.filter(
      refund => activeEventIds.has(refund.eventId) && (refund.status as string) === 'completed'
    );
    const grossRevenue = [...ticketPayments, ...workflowPayments].reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const refundedAmount = [...completedTicketRefunds, ...completedWorkflowRefunds].reduce(
      (sum, refund) => sum + Number(refund.amount || 0),
      0
    );
    const myRevenue = grossRevenue - refundedAmount;
    const myRequests = this.db.eventRequests.filter(
      request => request.organizerId === organizer.organizerId
    );
    const actionableStatuses = new Set([
      'submitted',
      'pending',
      'under_review',
      'changes_requested',
      'counteroffer_received',
    ]);
    const actionableRequests = myRequests.filter(request => actionableStatuses.has(request.status));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;
    const overduePreparation = myEvents.flatMap(event =>
      (event.preparationTasks || [])
        .filter(task => task.status !== 'completed' && task.deadline < todayString)
        .map(task => ({
          event,
          task,
        }))
    );
    const unresolvedIssues = this.db.supportTickets.filter(
      ticket =>
        ticket.userId === userId &&
        ticket.requestType === 'Event Related Issues' &&
        ticket.status !== 'resolved'
    );
    const attentionEventIds = new Set<string>();
    const attentionDetails = new Map<string, string>();
    myEvents.forEach(event => {
      const overdueTask = (event.preparationTasks || []).find(
        task => task.status !== 'completed' && task.deadline < todayString
      );
      const issue = unresolvedIssues.find(ticket => ticket.eventId === event.eventId);
      const detail = overdueTask
        ? `Overdue preparation: ${overdueTask.title}`
        : issue
        ? `Unresolved issue: ${issue.concern}`
        : !event.name ||
          !event.category ||
          !event.location ||
          !event.date ||
          !event.time ||
          event.capacity < 1
        ? 'Required event information is missing.'
        : ['published', 'ongoing'].includes(event.status) && event.date < todayString
        ? 'Event date has passed but the event is not completed.'
        : '';
      if (detail) {
        attentionEventIds.add(event.eventId);
        attentionDetails.set(event.eventId, detail);
      }
    });
    const eventStatusCounts = {
      upcoming: myEvents.filter(event => event.status === 'published' && event.date >= todayString)
        .length,
      inProgress: myEvents.filter(event => event.status === 'ongoing').length,
      completed: myEvents.filter(event => event.status === 'completed').length,
      cancelled: myEvents.filter(event => event.status === 'cancelled').length,
      needsAttention: attentionEventIds.size,
    };
    const upcomingSchedule = myEvents
      .filter(
        event =>
          event.status === 'published' &&
          new Date(`${event.date}T23:59:59`).getTime() >= today.getTime()
      )
      .sort((leftEvent, rightEvent) =>
        `${leftEvent.date}T${leftEvent.time}`.localeCompare(`${rightEvent.date}T${rightEvent.time}`)
      )
      .slice(0, 3)
      .map(event => ({
        eventId: event.eventId,
        title: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        status: event.status,
      }));
    const priorityActions: any[] = [];
    const nextRequest = actionableRequests[0];
    if (nextRequest)
      priorityActions.push({
        type: 'request',
        id: nextRequest.requestId,
        title: nextRequest.eventName,
        detail: `Client request needs your response (${nextRequest.status.replace(/_/g, ' ')})`,
        dueDate: nextRequest.eventDate,
      });
    const nextPreparation = overduePreparation[0];
    if (nextPreparation)
      priorityActions.push({
        type: 'preparation',
        id: nextPreparation.task.taskId,
        eventId: nextPreparation.event.eventId,
        title: nextPreparation.event.name,
        detail: `Preparation task is overdue: ${nextPreparation.task.title}`,
        dueDate: nextPreparation.task.deadline,
      });
    const nextIssue = unresolvedIssues[0];
    if (nextIssue)
      priorityActions.push({
        type: 'issue',
        id: nextIssue.ticketId,
        title: nextIssue.concern,
        detail: nextIssue.description,
        updatedAt: nextIssue.updatedAt,
      });
    const financialRecords = [
      ...ticketPayments.map(payment => ({
        id: payment.paymentId,
        type: 'Ticket payment',
        amount: payment.amount,
        status: payment.status,
        date: payment.paymentDate,
        eventId: myRegs.find(registration => registration.registrationId === payment.registrationId)
          ?.eventId,
      })),
      ...workflowPayments.map(payment => ({
        id: payment.paymentId,
        type: 'Event payment',
        amount: payment.amount,
        status: payment.status,
        date: payment.paymentDate,
        eventId: payment.eventId,
      })),
      ...completedTicketRefunds.map(refund => ({
        id: refund.refundId,
        type: 'Refund',
        amount: -Number(refund.amount || 0),
        status: refund.status,
        date: refund.processedAt || refund.requestedAt,
        eventId: myRegs.find(registration => registration.registrationId === refund.registrationId)
          ?.eventId,
      })),
      ...completedWorkflowRefunds.map(refund => ({
        id: refund.refundId,
        type: 'Refund',
        amount: -Number(refund.amount || 0),
        status: refund.status,
        date: refund.requestedAt,
        eventId: refund.eventId,
      })),
    ].sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime());
    return {
      success: true,
      data: {
        totalEvents: myEvents.length,
        activeEvents: myEvents.filter(
          event => event.status === 'published' || event.status === 'ongoing'
        ).length,
        draftEvents: myEvents.filter(event => event.status === 'draft').length,
        completedEvents: myEvents.filter(event => event.status === 'completed').length,
        totalRegistrations: myRegs.length,
        totalRevenue: myRevenue,
        grossRevenue,
        refundedAmount,
        pendingRequests: actionableRequests.length,
        approvedRequests: myRequests.filter(request => request.status === 'approved').length,
        eventsNeedingAttention: attentionEventIds.size,
        eventStatusCounts,
        attentionEventIds: [...attentionEventIds],
        priorityActions,
        upcomingSchedule,
        financialRecords,
      },
    };
  }

  // ✅ NEW: Client Dashboard
  getClientDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can view this dashboard');
    }
    const client = this.db.clients.find(c => c.userId === userId);
    if (!client) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return {
        success: false,
        message: 'Client profile not found',
      };
    }
    const myRequests = this.db.eventRequests.filter(
      request => request.clientId === client.clientId
    );
    const myPlans = this.db.eventPlans.filter(plan => plan.clientId === client.clientId);
    const approvedPlanIds = myPlans
      .filter(p => p.status === 'approved')
      .map(p => p.eventId)
      .filter(Boolean);
    const confirmedRequestEventIds = myRequests
      .filter(
        request =>
          ['confirmed', 'completed'].includes(request.status) &&
          request.eventId &&
          !['cancelled', 'withdrawn', 'rejected', 'expired'].includes(request.status) &&
          !request.cancellation
      )
      .map(request => request.eventId);
    const myEvents = this.db.events.filter(
      event =>
        !['cancelled'].includes(event.status) &&
        !event.cancellation &&
        (event.clientId === client.clientId ||
          approvedPlanIds.includes(event.eventId) ||
          confirmedRequestEventIds.includes(event.eventId))
    );
    const upcomingEvents = myEvents
      .filter(
        event =>
          ['published', 'ongoing', 'upcoming'].includes(event.status) &&
          new Date(`${event.date}T23:59:59`) >= new Date()
      )
      .sort((leftEvent, rightEvent) =>
        `${leftEvent.date}T${leftEvent.time}`.localeCompare(`${rightEvent.date}T${rightEvent.time}`)
      )
      .map(event => ({
        eventId: event.eventId,
        title: event.name,
        date: event.date,
        time: event.time,
        location: event.location,
        status: event.status,
      }));
    return {
      success: true,
      data: {
        totalRequests: myRequests.length,
        pendingRequests: myRequests.filter(request => request.status === 'pending').length,
        approvedRequests: myRequests.filter(
          request => request.status === 'approved' || request.status === 'confirmed'
        ).length,
        rejectedRequests: myRequests.filter(request => request.status === 'rejected').length,
        totalEventPlans: myPlans.length,
        pendingPlans: myPlans.filter(p => p.status === 'submitted').length,
        approvedPlans: myPlans.filter(p => p.status === 'approved').length,
        ongoingEvents: myEvents.filter(event => event.status === 'ongoing').length,
        completedEvents: myEvents.filter(event => event.status === 'completed').length,
        totalEvents: myEvents.length,
        upcomingEvents,
      },
    };
  }
  getEmployeeDashboard(role: UserRole, userId: string): any {
    if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
    if (role !== UserRole.EMPLOYEE)
      throw new ForbiddenException('Only employees can view this dashboard');
    const employeeType = this.db.findUserById(userId)?.employeeType;
    const finance = [EmployeeType.SUPPORT_FINANCE, EmployeeType.FINANCE_EXECUTIVE].includes(
      employeeType as EmployeeType
    );
    return {
      success: true,
      data: {
        totalUsers: this.db.users.filter(
          user => user.userRole !== UserRole.EMPLOYEE && !user.employeeType
        ).length,
        totalEvents: this.db.events.length,
        totalRegistrations: this.db.registrations.length,
        registrationsAwaitingReview: this.db.registrations.filter(
          registration =>
            !registration.reviewStatus &&
            ['pending_approval', 'registered', 'pending_payment', 'waitlisted'].includes(
              registration.status
            )
        ).length,
        openSupportTickets: this.db.supportTickets.filter(ticket => ticket.status !== 'resolved')
          .length,
        operationalIssues: this.db.supportTickets.filter(
          ticket => ticket.requestType === 'Event Related Issues' && ticket.status !== 'resolved'
        ).length,
        activeEvents: this.db.events.filter(event =>
          ['published', 'ongoing'].includes(event.status)
        ).length,
        upcomingEvents: this.db.events.filter(event => new Date(event.date) >= new Date()).length,
        ...(finance
          ? {
              successfulTransactions: this.db.payments.filter(
                payment => payment.status === 'completed'
              ).length,
              pendingPayments: this.db.payments.filter(payment => payment.status === 'pending')
                .length,
            }
          : {}),
      },
    };
  }

  // ✅ NEW: Attendee Dashboard
  getAttendeeDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE can view this dashboard');
    }
    const attendeeUser = this.db.attendees.find(attendee => attendee.userId === userId);
    if (!attendeeUser) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return {
        success: false,
        message: 'Attendee profile not found',
      };
    }
    const myRegistrations = this.db.registrations.filter(
      registration => registration.attendeeId === attendeeUser.attendeeId
    );
    const myEventIds = myRegistrations.map(registration => registration.eventId);
    const myEvents = this.db.events.filter(event => myEventIds.includes(event.eventId));
    const myAttendance = this.db.attendance.filter(a => a.attendeeId === attendeeUser.attendeeId);
    const upcomingEvents = myEvents.filter(
      event => new Date(event.date).setHours(23, 59, 59, 999) > new Date().setHours(0, 0, 0, 0)
    );
    const completedEvents = myEvents.filter(
      event => new Date(event.date).setHours(23, 59, 59, 999) <= new Date().setHours(0, 0, 0, 0)
    );
    return {
      success: true,
      data: {
        totalRegistrations: myRegistrations.length,
        registeredEvents: myRegistrations.filter(
          registration => registration.status === 'registered'
        ).length,
        attendedEvents: myRegistrations.filter(registration => registration.status === 'attended')
          .length,
        cancelledRegistrations: myRegistrations.filter(
          registration => registration.status === 'cancelled'
        ).length,
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        checkedInCount: myAttendance.filter(a => a.status === 'checked-in').length,
        noShowCount: myAttendance.filter(a => a.status === 'no-show').length,
        registeredEventDetails: myRegistrations.map(registration => {
          const event = myEvents.find(
            currentEvent => currentEvent.eventId === registration.eventId
          );
          return {
            registrationId: registration.registrationId,
            eventId: registration.eventId,
            eventName: event?.name,
            eventDate: event?.date,
            status: registration.status,
            ticketType: registration.ticketType,
            verificationId: registration.verificationId,
          };
        }),
      },
    };
  }
}
