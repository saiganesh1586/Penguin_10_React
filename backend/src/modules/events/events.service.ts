import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DataStore, Event, EventCancellation } from '../../common/data-store';
import { CancelClientEventDto, CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
import { assertEventPolicyAccepted, getEventPolicy } from '../../common/event-policy';
import { completedEventPayments, eventAmountPaid } from '../../common/utils/event-payments';
import { isEventOpenForRegistration } from '../../common/utils/event-registration';

@Injectable()
export class EventsService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  private eventStart(date: string, time: string): Date {
    const match = String(time || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !match) return new Date(NaN);
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    if (hour > 23 || minute > 59) return new Date(NaN);
    return new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  }

  private localDateKey(value = new Date()): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  private requireOrganizer(role: UserRole, userId: string | undefined, requestedOrganizerId?: string) {
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(item => item.userId === userId);
      if (!organizer) throw new ForbiddenException('Organizer profile not found');
      return organizer;
    }
    const organizer = this.dataStore.organizers.find(item => item.organizerId === requestedOrganizerId || item.userId === requestedOrganizerId);
    if (!organizer) throw new BadRequestException('A valid organizer is required');
    return organizer;
  }

  private isActiveReservation(registration: DataStore['registrations'][number]): boolean {
    return registration.status !== 'pending_payment' || !registration.reservationExpiresAt || registration.reservationExpiresAt > new Date();
  }

  // Create Event - Organizer or Super Admin
  create(createEventDto: CreateEventDto, role: UserRole, organizerId?: string): any {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_ORGANIZER].includes(role)) {
      throw new ForbiddenException('Only organizers and super admin can create events');
    }

    const name = (createEventDto as any).title || createEventDto.name;
    if (!name || !createEventDto.date || !createEventDto.time) {
      throw new BadRequestException('Event name, date, and time are required');
    }

    const organizer = this.requireOrganizer(role, organizerId, createEventDto.organizerId);
    const start = this.eventStart(createEventDto.date, createEventDto.time);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Enter a valid event date and time');
    if (start.getTime() < Date.now()) throw new BadRequestException('A new event cannot be scheduled in the past');
    if (role === UserRole.EVENT_ORGANIZER && !['draft', 'published', undefined].includes(createEventDto.status)) {
      throw new BadRequestException('Organizers can create events only as draft or published');
    }
    if (role === UserRole.EVENT_ORGANIZER && createEventDto.status === 'published') {
      const user = this.dataStore.users.find(u => u.userId === organizer.userId || u.userId === organizerId);
      if ((user && user.status !== 'active') || ((organizer as any).verificationStatus && (organizer as any).verificationStatus !== 'Approved')) {
        throw new ForbiddenException('Only approved organizers can publish events');
      }
    }
    const eventId = this.dataStore.generateId('evt');
    const event: Event = {
      eventId,
      visibility: createEventDto.visibility ?? 'public',
      organizerId: organizer.organizerId,
      clientId: createEventDto.clientId,
      name,
      category: createEventDto.category || 'General',
      date: createEventDto.date,
      time: createEventDto.time,
      location: createEventDto.location || '',
      capacity: createEventDto.capacity || 100,
      ticketPrice: (createEventDto as any).price ?? createEventDto.ticketPrice ?? 0,
      status: (createEventDto as any).status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (event as any).description = (createEventDto as any).description || '';
    (event as any).city = (createEventDto as any).city || '';
    event.registrationDeadline = createEventDto.registrationDeadline;
    event.cancellationDeadline = createEventDto.cancellationDeadline;
    event.eligibility = createEventDto.eligibility;
    event.waitlistEnabled = createEventDto.waitlistEnabled ?? false;

    this.dataStore.events.push(event);
    this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, type: 'status_changed',
      summary: `Event created as ${event.status}`, newValue: event.status, createdAt: new Date() });
    this.dataStore.persist();
    return this.mapEventToFrontend(event);
  }

  // ─── Normalize backend event to include frontend-friendly aliases ───────────
  private mapEventToFrontend(event: Event): any {
    // Extract city from location (e.g., "Convention Center, New York" → "New York")
    const locationParts = event.location.split(',');
    const city = (event as any).city ||
      (locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : event.location);

    // Count registrations for this event
    const actualRegistrations = this.dataStore.registrations.filter(
      r => r.eventId === event.eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r),
    ).length;
    const registered = actualRegistrations;
    const registrations = this.dataStore.registrations.filter(registration => registration.eventId === event.eventId);
    const registrationIds = new Set(registrations.map(registration => registration.registrationId));
    const payments = this.dataStore.payments.filter(payment => registrationIds.has(payment.registrationId));
    const refunds = this.dataStore.refunds.filter(refund => registrationIds.has(refund.registrationId));
    const tasks = event.preparationTasks || [];
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const issues = this.dataStore.supportTickets.filter(ticket => ticket.eventId === event.eventId && ticket.status !== 'resolved');
    const nowDate = this.localDateKey();
    const attentionReasons = [
      ...tasks.filter(task => task.status !== 'completed' && task.deadline < nowDate).map(task => `Overdue preparation: ${task.title}`),
      ...issues.map(ticket => `Unresolved issue: ${ticket.concern}`),
      ...(!event.name || !event.category || !event.location || !event.date || !event.time || event.capacity < 1 ? ['Required event information is missing'] : []),
      ...(['published', 'ongoing'].includes(event.status) && event.date < nowDate ? ['Event date has passed but the event is not completed'] : []),
    ];

    return {
      ...event,
      // Frontend-compatible aliases
      id: event.eventId,
      organizerUserId: this.dataStore.organizers.find(organizer => organizer.organizerId === event.organizerId)?.userId,
      clientUserId: event.clientId
        ? this.dataStore.clients.find(client => client.clientId === event.clientId)?.userId
        : undefined,
      title: event.name,
      price: event.ticketPrice,
      city,
      registered,
      remainingCapacity: Math.max(0, event.capacity - registered),
      needsAttention: attentionReasons.length > 0,
      attentionReasons,
      preparationSummary: { total: tasks.length, completed: completedTasks,
        progress: tasks.length ? Math.round(completedTasks / tasks.length * 100) : 0 },
      registrationSummary: {
        confirmed: registrations.filter(item => ['registered', 'attended'].includes(item.status)).length,
        pendingPayment: registrations.filter(item => item.status === 'pending_payment' && this.isActiveReservation(item)).length,
        waitlisted: registrations.filter(item => item.status === 'waitlisted').length,
        cancelled: registrations.filter(item => item.status === 'cancelled').length,
        attended: registrations.filter(item => item.status === 'attended').length,
        payments: {
          successful: payments.filter(item => item.status === 'completed').length,
          pending: payments.filter(item => item.status === 'pending').length,
          failed: payments.filter(item => item.status === 'failed').length,
          refunded: payments.filter(item => item.status === 'refunded').length,
        },
        refunds: {
          pending: refunds.filter(item => item.status === 'pending').length,
          completed: refunds.filter(item => item.status === 'completed').length,
          failed: refunds.filter(item => item.status === 'failed').length,
        },
      },
      issues: issues.map(ticket => ({ id: ticket.ticketId, concern: ticket.concern, status: ticket.status,
        description: ticket.description, updatedAt: ticket.updatedAt })),
      registrationDeadline: event.registrationDeadline || event.date,
      cancellationDeadline: event.cancellationDeadline || event.date,
      eligibility: event.eligibility || 'Open to all active attendees',
      waitlistEnabled: event.waitlistEnabled ?? false,
      changes: this.dataStore.eventChanges.filter(c => c.eventId === event.eventId),
      description: (event as any).description || '',
    };
  }

  // Get all events - filtered based on role
  findAll(role: UserRole, search?: string, status?: string, userId?: string): any[] {
    let events = [...this.dataStore.events];

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(item => item.userId === userId);
      if (!organizer) throw new ForbiddenException('Organizer profile not found');
      events = events.filter(event => event.organizerId === organizer.organizerId);
    }

    if (role === UserRole.CLIENT) {
      const client = this.dataStore.clients.find(item => item.userId === userId || item.clientId === userId);
      const clientId = client?.clientId || userId;
      const clientRequestEventIds = new Set(
        this.dataStore.eventRequests
          .filter(r => r.clientId === clientId || r.clientId === userId)
          .map(r => r.eventId)
          .filter(Boolean),
      );
      events = events.filter(event =>
        event.clientId === clientId ||
        event.clientId === userId ||
        clientRequestEventIds.has(event.eventId),
      );
    }

    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (status) {
      events = events.filter((e) => e.status === status);
    }

    if (role === UserRole.ATTENDEE) {
      events = events.filter(e => isEventOpenForRegistration(e, this.dataStore.eventRequests) && new Date(`${e.date}T23:59:59`) >= new Date());
    }

    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get all published events without role restriction (public endpoint)
  findAllPublic(search?: string): any[] {
    let events = this.dataStore.events.filter(e => e.status === 'published' && e.visibility !== 'private');

    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get all events (no role filter — for super_admin dashboard)
  findAllAdmin(role: UserRole, search?: string, status?: string): any[] {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only super admin can access the complete event catalog');
    let events = [...this.dataStore.events];
    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (status) {
      events = events.filter((e) => e.status === status);
    }
    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get event by ID
  findOne(eventId: string, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find((e) => e.eventId === eventId);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (role === UserRole.ATTENDEE && (!isEventOpenForRegistration(event, this.dataStore.eventRequests) || new Date(`${event.date}T23:59:59`) < new Date())) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) throw new ForbiddenException('You can only access your own events');
    }
    if (role === UserRole.CLIENT) {
      const client = this.dataStore.clients.find(item => item.userId === userId || item.clientId === userId);
      const clientId = client?.clientId || userId;
      const clientRequestEventIds = new Set(
        this.dataStore.eventRequests
          .filter(r => r.clientId === clientId || r.clientId === userId)
          .map(r => r.eventId)
          .filter(Boolean),
      );
      if (event.clientId !== clientId && event.clientId !== userId && !clientRequestEventIds.has(event.eventId)) {
        throw new ForbiddenException('You can only access your own events');
      }
    }

    return this.mapEventToFrontend(event);
  }

  // Update event - only by organizer who created it or super admin
  update(eventId: string, updateEventDto: UpdateEventDto, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const isOwner = organizer
        ? (organizer.organizerId === event.organizerId || organizer.userId === event.organizerId)
        : event.organizerId === userId;
      if (!isOwner) {
        throw new ForbiddenException('You can only update your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can update events');
    }
    if (event.status === 'cancelled' || event.cancellation) {
      throw new BadRequestException('This event has already been cancelled. Duplicate cancellations are blocked.');
    }

    const before = { name: event.name, category: event.category, date: event.date, time: event.time, location: event.location,
      capacity: event.capacity, ticketPrice: event.ticketPrice, description: event.description || '', status: event.status,
      preparationTasks: JSON.stringify(event.preparationTasks || []) };
    if (event.clientId && updateEventDto.status === 'completed') {
      throw new BadRequestException('Client events must be completed through the payment-verified completion workflow');
    }
    const booked = Boolean(event.clientId) || this.dataStore.eventRequests.some(request => request.eventId === eventId);
    const cancellationOnly = updateEventDto.status === 'cancelled' && Object.keys(updateEventDto).every(key => ['status', 'changeReason'].includes(key));
    if (booked && !cancellationOnly) {
      throw new BadRequestException('Booked event details cannot be edited');
    }
    const occupied = this.dataStore.registrations.filter(r =>
      r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r),
    ).length;
    if ((updateEventDto as any).capacity !== undefined && (updateEventDto as any).capacity < occupied) throw new BadRequestException(`Capacity cannot be lower than ${occupied} active registrations`);
    // Support both backend (name) and frontend (title) field names
    const dto = updateEventDto as any;
    const proposedDate = dto.date || event.date, proposedTime = dto.time || event.time;
    const proposedStart = this.eventStart(proposedDate, proposedTime);
    if (Number.isNaN(proposedStart.getTime())) throw new BadRequestException('Enter a valid event date and time');
    if ((dto.date || dto.time) && !['ongoing', 'completed', 'cancelled'].includes(event.status) && proposedStart.getTime() < Date.now()) {
      throw new BadRequestException('An upcoming event cannot be moved into the past');
    }
    if (dto.status && dto.status !== event.status) {
      const validTransitions: Record<Event['status'], Event['status'][]> = {
        draft: ['published', 'cancelled'], published: ['ongoing', 'completed', 'cancelled'],
        ongoing: ['completed', 'cancelled'], completed: [], cancelled: [],
      };
      if (!validTransitions[event.status].includes(dto.status)) throw new BadRequestException(`Cannot change an event from ${event.status} to ${dto.status}`);
      if (dto.status === 'published') {
        const organizer = this.dataStore.organizers.find(o => o.organizerId === event.organizerId);
        const user = organizer ? this.dataStore.users.find(u => u.userId === organizer.userId || u.userId === userId) : null;
        if ((user && user.status !== 'active') || (organizer && (organizer as any).verificationStatus && (organizer as any).verificationStatus !== 'Approved')) {
          throw new ForbiddenException('Only approved organizers can publish events');
        }
      }
      if (dto.status === 'ongoing' && proposedStart.getTime() > Date.now()) throw new BadRequestException('An event cannot start before its scheduled date and time');
      if (dto.status === 'completed' && proposedStart.getTime() > Date.now()) throw new BadRequestException('A future event cannot be marked completed');
      if (dto.status === 'cancelled' && String(dto.changeReason || '').trim().length < 10) throw new BadRequestException('A cancellation reason of at least 10 characters is required');
    }
    const postponed = (dto.date && dto.date > before.date) || (dto.date === before.date && dto.time && dto.time > before.time);
    if (postponed && event.status !== 'draft' && String(dto.changeReason || '').trim().length < 10) {
      throw new BadRequestException('A postponement reason of at least 10 characters is required');
    }
    if (dto.preparationTasks !== undefined && dto.preparationTasks.some((task: any) => !/^\d{4}-\d{2}-\d{2}$/.test(task.deadline)
      || Number.isNaN(new Date(`${task.deadline}T00:00:00`).getTime()))) {
      throw new BadRequestException('Every preparation task requires a valid deadline');
    }
    if (dto.name || dto.title) event.name = dto.name || dto.title;
    if (dto.category) event.category = dto.category;
    if (dto.date) event.date = dto.date;
    if (dto.time) event.time = dto.time;
    if (dto.location) event.location = dto.location;
    if (dto.capacity) event.capacity = dto.capacity;
    if (dto.ticketPrice !== undefined) event.ticketPrice = dto.ticketPrice;
    if (dto.price !== undefined) event.ticketPrice = dto.price;
    if (dto.status) event.status = dto.status;
    if (dto.status === 'cancelled') event.cancellationReason = dto.changeReason;
    if (dto.description !== undefined) (event as any).description = dto.description;
    if (dto.city) (event as any).city = dto.city;
    if (dto.registrationDeadline !== undefined) event.registrationDeadline = dto.registrationDeadline;
    if (dto.cancellationDeadline !== undefined) event.cancellationDeadline = dto.cancellationDeadline;
    if (dto.eligibility !== undefined) event.eligibility = dto.eligibility;
    if (dto.waitlistEnabled !== undefined) event.waitlistEnabled = dto.waitlistEnabled;
    if (dto.preparationTasks !== undefined) {
      event.preparationTasks = dto.preparationTasks.map((task: any) => ({
        taskId: task.taskId || this.dataStore.generateId('prep'), title: task.title.trim(), deadline: task.deadline,
        status: task.status, updatedAt: new Date(),
      }));
    }

    event.updatedAt = new Date();
    const changes: Array<{ type: 'cancelled' | 'postponed' | 'date_changed' | 'time_changed' | 'venue_changed' | 'status_changed' | 'preparation_updated' | 'details_updated'; summary: string; previousValue?: string; newValue?: string }> = [];
    if (before.date !== event.date) changes.push({ type: event.date > before.date ? 'postponed' : 'date_changed', summary: `Event date changed from ${before.date} to ${event.date}${dto.changeReason ? `: ${dto.changeReason}` : ''}`, previousValue: before.date, newValue: event.date });
    if (before.time !== event.time) changes.push({ type: 'time_changed', summary: `Event time changed from ${before.time} to ${event.time}`, previousValue: before.time, newValue: event.time });
    if (before.location !== event.location) changes.push({ type: 'venue_changed', summary: `Event venue changed from ${before.location} to ${event.location}`, previousValue: before.location, newValue: event.location });
    const detailFields = [before.name !== event.name && 'title', before.category !== event.category && 'category',
      before.capacity !== event.capacity && 'capacity', before.ticketPrice !== event.ticketPrice && 'ticket price',
      before.description !== (event.description || '') && 'description'].filter(Boolean);
    if (detailFields.length) changes.push({ type: 'details_updated', summary: `Updated ${detailFields.join(', ')}` });
    if (before.status !== event.status) changes.push({ type: event.status === 'cancelled' ? 'cancelled' : 'status_changed',
      summary: event.status === 'cancelled' ? `Event cancelled: ${dto.changeReason}` : `Status changed from ${before.status} to ${event.status}`,
      previousValue: before.status, newValue: event.status });
    if (before.preparationTasks !== JSON.stringify(event.preparationTasks || [])) changes.push({ type: 'preparation_updated', summary: 'Preparation checklist updated' });
    for (const change of changes) {
      this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, ...change, createdAt: new Date() });
      const affected = this.dataStore.registrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
      for (const registration of affected) {
        const attendee = this.dataStore.attendees.find(a => a.attendeeId === registration.attendeeId);
        if (change.type === 'cancelled') {
          registration.status = 'cancelled'; registration.cancelledAt = new Date(); registration.cancellationReason = dto.changeReason; registration.qrCode = undefined; registration.verificationId = undefined; registration.updatedAt = new Date();
          const payment = this.dataStore.payments.find(p => p.registrationId === registration.registrationId && p.status === 'completed');
          if (payment && !this.dataStore.refunds.some(r => r.registrationId === registration.registrationId)) {
            const refund = { refundId: this.dataStore.generateId('ref'), paymentId: payment.paymentId, registrationId: registration.registrationId, amount: payment.amount, status: 'pending' as const, reason: dto.changeReason, requestedAt: new Date() };
            this.dataStore.refunds.push(refund);
            if (attendee) this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, paymentId: payment.paymentId, message: `Event cancelled. Simulated refund of ₹${refund.amount} is pending.`, type: 'refund_pending', read: false, dateTime: new Date(), createdAt: new Date() });
          }
        }
        if (change.type === 'postponed') {
          registration.qrCode = undefined; registration.verificationId = undefined; registration.updatedAt = new Date();
        }
        if (attendee) this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, message: `${event.name}: ${change.summary}`, type: change.type === 'cancelled' ? 'event_cancelled' : 'event_changed', read: false, dateTime: new Date(), createdAt: new Date() });
      }
    }
    if (before.status !== event.status && event.status === 'cancelled') {
      const cancellationRecord: EventCancellation = {
        reason: dto.changeReason,
        cancelledBy: userId || 'organizer',
        cancelledAt: new Date(),
        policyVersion: '1.0',
        paidAmount: 0,
        cancellationFeePercent: 0,
        cancellationFee: 0,
        refundAmount: 0,
        refundStatus: 'not_applicable',
        cancellationDeadline: event.cancellationDeadline || new Date().toISOString(),
      };
      event.cancellation = cancellationRecord;

      const request = this.dataStore.eventRequests.find(item => item.eventId === eventId);
      if (request && request.status !== 'cancelled') {
        const captured = completedEventPayments(this.dataStore.eventWorkflowPayments, request);
        const paidAmount = captured.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        let firstRefundId: string | undefined;
        captured.forEach(payment => {
          const refundId = this.dataStore.generateId('ref-event');
          firstRefundId ||= refundId;
          this.dataStore.eventWorkflowRefunds.push({
            refundId, paymentId: payment.paymentId, eventId, requestId: request.requestId,
            clientId: request.clientId, organizerId: request.organizerId,
            paidAmount: payment.amount, cancellationFee: 0, amount: payment.amount,
            reason: dto.changeReason, status: 'pending', simulated: true, requestedAt: new Date(),
          });
        });
        request.status = 'cancelled';
        request.cancellation = {
          reason: dto.changeReason,
          cancelledBy: userId!,
          cancelledAt: new Date(),
          policyVersion: '1.0',
          paidAmount,
          cancellationFeePercent: 0,
          cancellationFee: 0,
          refundAmount: paidAmount,
          refundStatus: paidAmount > 0 ? 'pending' : 'not_applicable',
          refundId: firstRefundId,
          cancellationDeadline: new Date().toISOString(),
        };
        event.cancellation = request.cancellation;
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
          id: this.dataStore.generateId('aud'),
          action: 'Event Booking Cancelled by Organizer',
          performedBy: userId!,
          role,
          timestamp: new Date(),
          details: { reason: dto.changeReason, paidAmount, clientRefundAmount: paidAmount, organizerRefundAmount: 0 },
        });
        const client = this.dataStore.clients.find(item => item.clientId === request.clientId);
        if (client) this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: client.userId, eventId, registrationId: undefined, paymentId: undefined, message: `The organizer cancelled "${event.name}". Your simulated refund of ₹${paidAmount.toFixed(2)} is ${paidAmount > 0 ? 'pending' : 'not applicable because no payment was collected'}.`, type: 'event_cancelled', read: false, dateTime: new Date(), createdAt: new Date() });
      }
    }
    this.dataStore.persist();
    return this.mapEventToFrontend(event);
  }

  private ownClientEvent(eventId: string, role: UserRole, userId?: string): Event {
    if (role !== UserRole.CLIENT) throw new ForbiddenException('Only the event client can cancel this event');
    const event = this.dataStore.events.find(item => item.eventId === eventId);
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);
    const client = this.dataStore.clients.find(item => item.userId === userId);
    if (!client || event.clientId !== client.clientId) throw new ForbiddenException('You can only cancel your own events');
    return event;
  }

  clientCancellationPreview(eventId: string, role: UserRole, userId?: string) {
    const event = this.ownClientEvent(eventId, role, userId);
    const request = this.dataStore.eventRequests.find(item => item.eventId === eventId);
    const policy = event.policySnapshot || request?.policySnapshot || getEventPolicy();
    const paidPaise = Math.round((request ? eventAmountPaid(this.dataStore.eventWorkflowPayments, request) : 0) * 100);
    const feePercent = policy.cancellation.refundEligible === false ? 100 : policy.cancellation.feePercent;
    const feePaise = Math.round(paidPaise * feePercent / 100);
    const match = String(event.time || '10:00').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    let hours = match ? Number(match[1]) : NaN;
    if (match?.[3]) hours = hours % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    const time = match && hours >= 0 && hours <= 23 && Number(match[2]) <= 59
      ? `${String(hours).padStart(2, '0')}:${match[2]}:00` : '';
    const start = time ? new Date(`${event.date}T${time}+05:30`) : new Date(NaN);
    const deadline = new Date(start.getTime() - policy.cancellation.minimumNoticeDays * 86400000);
    const validDate = !Number.isNaN(deadline.getTime());
    const canCancel = event.status === 'ongoing' && validDate && new Date() <= deadline;
    const unavailableReason = event.status !== 'ongoing'
      ? 'Only an ongoing event can be cancelled.'
      : !validDate ? 'The scheduled event date or time is unavailable.'
      : `Cancellation closes ${policy.cancellation.minimumNoticeDays} days before the scheduled event start.`;
    return {
      eventId, canCancel, unavailableReason: canCancel ? '' : unavailableReason,
      cancellationDeadline: validDate ? deadline.toISOString() : null,
      minimumNoticeDays: policy.cancellation.minimumNoticeDays,
      paidAmount: paidPaise / 100, cancellationFeePercent: feePercent,
      cancellationFee: feePaise / 100, refundAmount: (paidPaise - feePaise) / 100,
      refundEligible: policy.cancellation.refundEligible !== false,
      approvalMode: policy.cancellation.approvalMode || 'manual',
      additionalTerms: policy.cancellation.additionalTerms || '',
      policy,
    };
  }

  cancelClientEvent(eventId: string, dto: CancelClientEventDto, role: UserRole, userId?: string): any {
    const event = this.ownClientEvent(eventId, role, userId);
    if (event.status === 'cancelled') throw new ConflictException('This event has already been cancelled');
    const preview = this.clientCancellationPreview(eventId, role, userId);
    if (!preview.canCancel) throw new BadRequestException(preview.unavailableReason);
    assertEventPolicyAccepted(dto, preview.policy);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    if (reason.length < 10 || reason.length > 1000) throw new BadRequestException('Provide a cancellation reason of 10 to 1000 characters');
    if (dto.expectedPaidAmount !== preview.paidAmount) {
      throw new ConflictException('The amount paid has changed. Review the updated cancellation fee and refund amount before confirming.');
    }

    const now = new Date();
    const request = this.dataStore.eventRequests.find(item => item.eventId === eventId);
    const refundId = preview.refundAmount > 0 ? this.dataStore.generateId('ref-event') : undefined;
    const cancellation: EventCancellation = {
      reason, cancelledBy: userId!, cancelledAt: now, policyVersion: preview.policy.version,
      paidAmount: preview.paidAmount, cancellationFeePercent: preview.cancellationFeePercent,
      cancellationFee: preview.cancellationFee, refundAmount: preview.refundAmount,
      refundStatus: refundId ? 'pending' : 'not_applicable', refundId,
      cancellationDeadline: preview.cancellationDeadline!,
    };
    if (refundId && request) {
      const captured = completedEventPayments(this.dataStore.eventWorkflowPayments, request);
      captured.forEach((payment, index) => {
        const fee = Math.round(payment.amount * preview.cancellationFeePercent) / 100;
        this.dataStore.eventWorkflowRefunds.push({
          refundId: index === 0 ? refundId : this.dataStore.generateId('ref-event'),
          paymentId: payment.paymentId, eventId, requestId: request.requestId,
          clientId: event.clientId!, organizerId: event.organizerId,
          paidAmount: payment.amount, cancellationFee: fee,
          amount: Math.max(0, payment.amount - fee), reason, status: 'pending', simulated: true, requestedAt: now,
        });
      });
    }
    event.status = 'cancelled';
    event.cancellation = cancellation;
    event.updatedAt = now;
    if (request) {
      request.status = 'cancelled';
      request.cancellation = cancellation;
      request.updatedAt = now;
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({ id: this.dataStore.generateId('aud'), action: 'Event Cancelled by Client', performedBy: userId!, role, timestamp: now, details: { ...cancellation } });
    }
    this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, type: 'cancelled', summary: `Event cancelled by client: ${reason}`, createdAt: now });
    const notify = (recipient: string, message: string, registrationId?: string, paymentId?: string) => {
      this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: recipient, eventId, registrationId, paymentId, message, type: 'event_cancelled', read: false, dateTime: now, createdAt: now });
    };
    const organizer = this.dataStore.organizers.find(item => item.organizerId === event.organizerId);
    if (organizer) notify(organizer.userId, `The client cancelled "${event.name}": ${reason}`);
    notify(userId!, `You cancelled "${event.name}". Cancellation fee: ₹${cancellation.cancellationFee.toFixed(2)}. Refund due: ₹${cancellation.refundAmount.toFixed(2)}${refundId ? ' (pending review)' : ''}.`);
    for (const registration of this.dataStore.registrations.filter(item => item.eventId === eventId && ['pending_approval', 'registered', 'pending_payment', 'waitlisted'].includes(item.status))) {
      registration.status = 'cancelled';
      registration.cancellationReason = `Event cancelled by client: ${reason}`;
      registration.cancelledAt = now;
      registration.updatedAt = now;
      registration.qrCode = undefined;
      registration.verificationId = undefined;
      registration.offerExpiresAt = undefined;
      const payment = this.dataStore.payments.find(item => item.registrationId === registration.registrationId && item.status === 'completed');
      const attendee = this.dataStore.attendees.find(item => item.attendeeId === registration.attendeeId);
      if (payment && !this.dataStore.refunds.some(item => item.registrationId === registration.registrationId)) {
        this.dataStore.refunds.push({ refundId: this.dataStore.generateId('ref'), paymentId: payment.paymentId, registrationId: registration.registrationId, amount: payment.amount, status: 'pending', reason: 'Event cancelled by client', requestedAt: now });
      }
      if (attendee) notify(attendee.userId, `"${event.name}" was cancelled by the client. Your ticket is invalid.${payment ? ' Your ticket refund is pending review.' : ''}`, registration.registrationId, payment?.paymentId);
    }
    return { success: true, message: 'Event cancelled. Any refund due is pending review.', data: { event: this.mapEventToFrontend(event), cancellation } };
  }

  completeClientEvent(eventId: string, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_ORGANIZER) {
      throw new ForbiddenException('Only the assigned organizer can complete this event');
    }
    const event = this.dataStore.events.find(item => item.eventId === eventId);
    if (!event || !event.clientId) throw new NotFoundException(`Client event ${eventId} not found`);
    const organizer = this.dataStore.organizers.find(item => item.userId === userId);
    if (!organizer || organizer.organizerId !== event.organizerId) {
      throw new ForbiddenException('You can only complete your own events');
    }
    if (event.status !== 'ongoing') {
      throw new BadRequestException('Only ongoing events can be marked completed');
    }
    const eventDateEnd = new Date(`${event.date}T23:59:59`);
    if (Number.isNaN(eventDateEnd.getTime()) || eventDateEnd > new Date()) {
      throw new BadRequestException('The event can only be completed after its event date');
    }
    const request = this.dataStore.eventRequests.find(item =>
      item.eventId === eventId && item.organizerId === organizer.organizerId,
    );
    const verifiedPayment = request && eventAmountPaid(this.dataStore.eventWorkflowPayments, request) >= Number(request.budget);
    if (!request || request.status !== 'confirmed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment) {
      throw new BadRequestException('Verified full payment is required before completing the event');
    }
    event.status = 'completed';
    event.updatedAt = new Date();
    request.status = 'completed';
    request.updatedAt = event.updatedAt;
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.dataStore.generateId('aud'),
      action: 'Event Marked Completed',
      performedBy: userId || organizer.organizerId,
      role,
      timestamp: event.updatedAt,
      details: { eventId },
    });
    const client = this.dataStore.clients.find(item => item.clientId === request.clientId);
    if (client) {
      this.dataStore.notifications.push({
        notificationId: this.dataStore.generateId('notif'),
        userId: client.userId,
        eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `The organizer marked "${event.name}" as completed.`,
        type: 'event_completed',
        read: false,
        dateTime: event.updatedAt,
        createdAt: event.updatedAt,
      });
    }
    return { success: true, message: 'Event marked completed', data: this.mapEventToFrontend(event) };
  }

  // Delete event
  delete(eventId: string, role: UserRole, userId?: string): { message: string } {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const isOwner = organizer
        ? (organizer.organizerId === event.organizerId || organizer.userId === event.organizerId)
        : event.organizerId === userId;
      if (!isOwner) {
        throw new ForbiddenException('You can only delete your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can delete events');
    }
    if (event.cancellation) {
      throw new BadRequestException('A client-cancelled event cannot be deleted. Its cancellation and refund record must be preserved.');
    }
    const hasRegistrations = this.dataStore.registrations.some(registration => registration.eventId === eventId);
    const hasPayments = this.dataStore.payments.some(p => (p as any).eventId === eventId) ||
      this.dataStore.eventWorkflowPayments?.some(p => p.eventId === eventId);
    if (event.status !== 'draft' || hasRegistrations || hasPayments) {
      throw new ConflictException('Only draft events without registrations can be deleted; cancel an active event instead');
    }

    const index = this.dataStore.events.findIndex((e) => e.eventId === eventId);
    this.dataStore.events.splice(index, 1);

    this.dataStore.persist();

    return { message: `Event ${eventId} deleted successfully` };
  }

  // Publish event
  publish(eventId: string, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) {
        throw new ForbiddenException('You can only publish your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can publish events');
    }
    if (event.cancellation) {
      throw new BadRequestException('A client-cancelled event cannot be published again.');
    }
    if (event.clientId || this.dataStore.eventRequests.some(request => request.eventId === eventId)) {
      throw new BadRequestException('Booked event details cannot be edited');
    }

    event.status = 'published';
    event.updatedAt = new Date();
    this.dataStore.persist();
    return this.mapEventToFrontend(event);
  }

  // Get event statistics
  getStatistics(): any {
    const events = this.dataStore.events;
    const totalRegistrations = this.dataStore.registrations.length;
    const totalRevenue = this.dataStore.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === 'published').length,
      ongoingEvents: events.filter((e) => e.status === 'ongoing').length,
      completedEvents: events.filter((e) => e.status === 'completed').length,
      totalRegistrations,
      totalRevenue,
    };
  }
}
