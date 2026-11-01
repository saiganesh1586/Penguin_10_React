import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataStore, Registration } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateRegistrationDto, ReviewRegistrationDto, UpdateRegistrationDetailsDto } from './dto/registration.dto';
import { QrCodeService } from '../../common/utils/qr-code.service';
import { isSupportExecutive } from '../../common/account-access';
import { isEventOpenForRegistration, requiresRegistrationApproval } from '../../common/utils/event-registration';

@Injectable()
export class RegistrationsService {
  private db = DataStore.getInstance();

  private attendeeForUser(userId?: string) { return this.db.attendees.find(a => a.userId === userId); }
  private activeReservation(r: Registration) { return r.status !== 'pending_payment' || !r.reservationExpiresAt || r.reservationExpiresAt > new Date(); }
  private occupied(eventId: string) {
    return this.db.registrations.filter(r => r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.activeReservation(r)).length;
  }
  private assertOwner(registration: Registration, role: UserRole, userId?: string) {
    if (role === UserRole.SUPER_ADMIN) return;
    const attendee = this.attendeeForUser(userId);
    if (role !== UserRole.ATTENDEE || attendee?.attendeeId !== registration.attendeeId) throw new ForbiddenException('You can only access your own registration');
  }
  private async issueTicket(registration: Registration) {
    const verificationId = QrCodeService.generateVerificationId();
    const qrCode = await QrCodeService.generateQRCode(verificationId);
    if (registration.status !== 'registered') throw new ConflictException('Registration changed before the ticket could be issued');
    registration.verificationId = verificationId;
    registration.qrCode = qrCode;
    registration.updatedAt = new Date();
  }
  private notify(registration: Registration, message: string, type: string, paymentId?: string) {
    const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
    if (!attendee) return;
    this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: attendee.userId, eventId: registration.eventId, registrationId: registration.registrationId, paymentId, message, type, read: false, dateTime: new Date(), createdAt: new Date() });
  }
  private enrich(registration: Registration) {
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
    const attendeeUser = attendee && this.db.users.find(u => u.userId === attendee.userId);
    const payment = this.db.payments.filter(p => p.registrationId === registration.registrationId).sort((a, b) => +b.createdAt - +a.createdAt)[0] || null;
    const refund = this.db.refunds.filter(r => r.registrationId === registration.registrationId).sort((a, b) => +b.requestedAt - +a.requestedAt)[0] || null;
    const attendance = this.db.attendance.find(a => a.attendeeId === registration.attendeeId && a.eventId === registration.eventId);
    const queue = this.db.registrations.filter(r => r.eventId === registration.eventId && r.status === 'waitlisted').sort((a, b) => +a.createdAt - +b.createdAt);
    const waitlistPosition = registration.status === 'waitlisted' ? queue.findIndex(r => r.registrationId === registration.registrationId) + 1 : null;
    return {
      ...registration,
      attendee: attendee && attendeeUser ? {
        attendeeId: attendee.attendeeId,
        userId: attendeeUser.userId,
        name: attendeeUser.name,
        email: attendeeUser.email,
        phoneNo: attendeeUser.phoneNo,
      } : null,
      event,
      payment,
      refund,
      checkInStatus: attendance?.status || 'not_checked_in',
      waitlistPosition,
    };
  }

  async create(dto: CreateRegistrationDto, role: UserRole, userId?: string): Promise<any> {
    if (![UserRole.ATTENDEE, UserRole.SUPER_ADMIN].includes(role)) throw new ForbiddenException('Only attendees can register for events');
    const attendee = role === UserRole.SUPER_ADMIN ? this.db.attendees.find(a => a.attendeeId === dto.attendeeId) : this.attendeeForUser(userId);
    if (!attendee) throw new NotFoundException('Attendee profile not found');
    if (role === UserRole.ATTENDEE && attendee.attendeeId !== dto.attendeeId && attendee.userId !== dto.attendeeId) throw new ForbiddenException('You cannot register another attendee');
    const user = this.db.users.find(u => u.userId === attendee.userId);
    if (!user || user.status !== 'active' || !user.name || !user.email) throw new BadRequestException('An active attendee profile with name and email is required');
    const event = this.db.events.find(e => e.eventId === dto.eventId);
    if (!event) throw new NotFoundException(`Event ${dto.eventId} not found`);
    if (!isEventOpenForRegistration(event, this.db.eventRequests)) throw new BadRequestException('Event is not open for registration');
    if (new Date(`${event.date}T23:59:59`) < new Date()) throw new BadRequestException('This event has already concluded');
    if (event.registrationDeadline && new Date(`${event.registrationDeadline}T23:59:59`) < new Date()) throw new BadRequestException('The registration deadline has passed');
    this.db.registrations.filter(r => r.attendeeId === attendee.attendeeId && r.eventId === event.eventId && r.status === 'pending_payment' && !this.activeReservation(r)).forEach(r => { r.status = 'cancelled'; r.cancellationReason = 'Payment reservation expired'; r.cancelledAt = new Date(); r.updatedAt = new Date(); });
    const existing = this.db.registrations.find(r => r.attendeeId === attendee.attendeeId && r.eventId === event.eventId && r.status !== 'cancelled');
    if (existing) throw new ConflictException('You already have an active registration for this event');

    const full = this.occupied(event.eventId) >= event.capacity;
    if (full && (!event.waitlistEnabled || !dto.joinWaitlist)) throw new ConflictException(event.waitlistEnabled ? 'Event is full. Join the waitlist instead.' : 'Event is full and the waitlist is closed');
    const needsApproval = requiresRegistrationApproval(event);
    const status: Registration['status'] = full ? 'waitlisted' : needsApproval ? 'pending_approval' : event.ticketPrice > 0 ? 'pending_payment' : 'registered';
    const now = new Date();
    const registration: Registration = { registrationId: this.db.generateId('reg'), attendeeId: attendee.attendeeId, eventId: event.eventId, registrationDate: now.toISOString().slice(0, 10), status, additionalInfo: dto.additionalInfo, ticketType: dto.ticketType,
      reviewStatus: event.visibility === 'public' ? 'approved' : undefined, reviewedAt: event.visibility === 'public' ? now : undefined,
      reservationExpiresAt: status === 'pending_payment' ? new Date(now.getTime() + 15 * 60 * 1000) : undefined, createdAt: now, updatedAt: now };
    // Insert the reservation before asynchronous ticket generation so concurrent requests see occupied capacity.
    this.db.registrations.push(registration);
    if (status === 'registered') {
      try { await this.issueTicket(registration); }
      catch { this.db.registrations = this.db.registrations.filter(r => r.registrationId !== registration.registrationId); throw new BadRequestException('Ticket generation failed; registration was rolled back'); }
    }
    this.notify(registration, status === 'registered' ? `Registration confirmed for "${event.name}".` : status === 'waitlisted' ? `You joined the waitlist for "${event.name}".` : status === 'pending_approval' ? `Your registration request for "${event.name}" is awaiting organizer approval. No payment has been collected.` : `Registration for "${event.name}" is pending payment.`, status === 'registered' ? 'registration_confirmed' : status);
    if (needsApproval) {
      const organizer = this.db.organizers.find(profile => profile.organizerId === event.organizerId);
      if (organizer) this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: organizer.userId, eventId: event.eventId, registrationId: registration.registrationId,
        message: `An attendee requested approval to register for "${event.name}".`, type: 'registration_requested', read: false, dateTime: now, createdAt: now });
    }
    return { success: true, message: status === 'registered' ? 'Registration confirmed' : status === 'waitlisted' ? 'Waitlist joined' : status === 'pending_approval' ? 'Registration request sent for organizer approval' : 'Registration pending payment', data: this.enrich(registration) };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let registrations = [...this.db.registrations];
    if (role === UserRole.ATTENDEE) { const attendee = this.attendeeForUser(userId); registrations = attendee ? registrations.filter(r => r.attendeeId === attendee.attendeeId) : []; }
    else if (role === UserRole.EVENT_ORGANIZER) { const organizer = this.db.organizers.find(o => o.userId === userId); const ids = this.db.events.filter(e => e.organizerId === organizer?.organizerId).map(e => e.eventId); registrations = registrations.filter(r => ids.includes(r.eventId)); }
    else if (role === UserRole.CLIENT) { const client = this.db.clients.find(c => c.userId === userId); const ids = this.db.events.filter(e => e.clientId === client?.clientId).map(e => e.eventId); registrations = registrations.filter(r => ids.includes(r.eventId)); }
    else if (role !== UserRole.SUPER_ADMIN && !(role === UserRole.EMPLOYEE && isSupportExecutive(this.db.findUserById(userId || '')))) throw new ForbiddenException('Access denied');
    return registrations.map(r => this.enrich(r));
  }

  findOne(id: string, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId); return this.enrich(registration);
  }

  markDeclineViewed(id: string, role: UserRole, userId?: string): any {
    if (role !== UserRole.ATTENDEE) throw new ForbiddenException('Only the attendee can mark their decline as viewed');
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException('Registration not found');
    this.assertOwner(registration, role, userId);
    if (registration.status !== 'rejected') throw new ConflictException('This registration has not been declined');
    if (!registration.declineViewedAt) {
      registration.declineViewedAt = new Date();
      registration.updatedAt = registration.declineViewedAt;
    }
    return { success: true, data: this.enrich(registration) };
  }

  updateDetails(id: string, dto: UpdateRegistrationDetailsDto, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (['cancelled', 'rejected', 'attended', 'no-show'].includes(registration.status)) throw new BadRequestException('Historical registrations cannot be changed');
    registration.additionalInfo = dto.additionalInfo; registration.updatedAt = new Date();
    return { success: true, message: 'Registration details updated', data: this.enrich(registration) };
  }

  review(id: string, dto: ReviewRegistrationDto, role: UserRole, userId?: string): any {
    const support = role === UserRole.EMPLOYEE && isSupportExecutive(this.db.findUserById(userId || ''));
    if (![UserRole.EVENT_ORGANIZER, UserRole.SUPER_ADMIN].includes(role) && !support) throw new ForbiddenException('Only the event organizer or support executives can review registrations');
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException('Registration not found');
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event) throw new NotFoundException('Event not found');
    const organizer = this.db.organizers.find(o => o.userId === userId);
    if (role !== UserRole.SUPER_ADMIN && !support && (!organizer || organizer.organizerId !== event.organizerId)) throw new ForbiddenException('You can only review registrations for your own events');
    if (!['approved', 'rejected'].includes(dto.decision)) throw new BadRequestException('Choose an approval or decline decision');
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    if (dto.decision === 'rejected' && (reason.length < 10 || reason.length > 1000)) throw new BadRequestException('Please explain the decline in 10 to 1000 characters');
    if (event.visibility === 'public') throw new ConflictException('Public event registrations do not require organizer approval');
    if (registration.reviewStatus || !['pending_approval', 'registered', 'pending_payment', 'waitlisted'].includes(registration.status)) throw new ConflictException('This registration is no longer pending review');
    if (['completed', 'cancelled'].includes(event.status) || new Date(`${event.date}T23:59:59`) < new Date()) throw new BadRequestException('Registrations for a past or closed event cannot be reviewed');

    const now = new Date();
    const priorStatus = registration.status;
    const needsActivation = requiresRegistrationApproval(event) && ['pending_approval', 'pending_payment'].includes(priorStatus);
    if (dto.decision === 'approved' && needsActivation && this.occupied(event.eventId) - (priorStatus === 'pending_payment' && this.activeReservation(registration) ? 1 : 0) >= event.capacity) {
      throw new ConflictException('No seats are available to approve this registration');
    }
    const beforeApproval = { status: registration.status, reviewStatus: registration.reviewStatus, reviewedAt: registration.reviewedAt, updatedAt: registration.updatedAt,
      reservationExpiresAt: registration.reservationExpiresAt, verificationId: registration.verificationId, qrCode: registration.qrCode };
    const releasedSeat = ['registered', 'pending_payment'].includes(priorStatus) && this.activeReservation(registration);
    const hadWaitlistOffer = !!registration.offerExpiresAt;
    registration.reviewStatus = dto.decision;
    registration.reviewedAt = now;
    registration.updatedAt = now;
    if (dto.decision === 'approved') {
      if (needsActivation) {
        registration.status = event.ticketPrice > 0 ? 'pending_payment' : 'registered';
        registration.reservationExpiresAt = event.ticketPrice > 0 ? new Date(now.getTime() + 15 * 60 * 1000) : undefined;
        if (!event.ticketPrice) {
          return this.issueTicket(registration).then(() => {
            this.notify(registration, `The organizer approved your registration for "${event.name}". Your free ticket is ready in My Tickets.`, 'registration_approved');
            return { success: true, message: 'Registration approved and free ticket issued', data: this.enrich(registration) };
          }).catch(error => {
            if (registration.status === 'registered' && registration.reviewedAt === now) Object.assign(registration, beforeApproval);
            throw error;
          });
        }
      }
      if (requiresRegistrationApproval(event) && registration.status === 'waitlisted' && this.occupied(event.eventId) < event.capacity) this.offerNext(event.eventId);
      this.notify(registration, `The organizer approved your registration for "${event.name}".${needsActivation && event.ticketPrice > 0 ? ` Pay ₹${event.ticketPrice} from My Tickets within 15 minutes to confirm your seat.` : ''}`, 'registration_approved');
      return { success: true, message: 'Registration approved', data: this.enrich(registration) };
    }

    registration.status = 'rejected';
    registration.rejectionReason = reason;
    registration.qrCode = undefined;
    registration.verificationId = undefined;
    registration.reservationExpiresAt = undefined;
    registration.offerExpiresAt = undefined;
    const payment = this.db.payments.find(p => p.registrationId === id && p.status === 'completed');
    const attendee = this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
    if (payment && !this.db.refunds.some(refund => refund.paymentId === payment.paymentId && ['pending', 'completed'].includes(refund.status))) {
      this.db.refunds.push({ refundId: this.db.generateId('ref'), paymentId: payment.paymentId, payerId: registration.attendeeId, recipientUserId: attendee?.userId, recipientRole: 'attendee', registrationId: id, amount: payment.amount, status: 'pending', simulated: true, reason: `Organizer declined registration: ${reason}`, requestedAt: now });
    }
    this.notify(registration, `Your registration for "${event.name}" was declined. Reason: ${reason}${payment ? ' A full refund of your ticket payment is pending.' : ''}`, 'registration_rejected', payment?.paymentId);
    if (releasedSeat || hadWaitlistOffer) this.offerNext(event.eventId);
    return { success: true, message: 'Registration declined and reason sent to the attendee', data: this.enrich(registration) };
  }

  async confirmWaitlist(id: string, role: UserRole, userId?: string): Promise<any> {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (registration.status !== 'waitlisted' || !registration.offerExpiresAt) throw new BadRequestException('No active waitlist offer exists');
    if (registration.offerExpiresAt < new Date()) { registration.offerExpiresAt = undefined; throw new BadRequestException('The waitlist offer has expired'); }
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event || !isEventOpenForRegistration(event, this.db.eventRequests)) throw new BadRequestException('Event is no longer open');
    if (requiresRegistrationApproval(event) && registration.reviewStatus !== 'approved') throw new ForbiddenException('Organizer approval is required before accepting a private event place');
    if (this.occupied(event.eventId) >= event.capacity) throw new ConflictException('The offered place is no longer available');
    registration.offerExpiresAt = undefined;
    registration.status = event.ticketPrice > 0 ? 'pending_payment' : 'registered';
    registration.reservationExpiresAt = event.ticketPrice > 0 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;
    if (!event.ticketPrice) await this.issueTicket(registration);
    this.notify(registration, event.ticketPrice > 0 ? `Your place for "${event.name}" is reserved pending payment.` : `Your waitlist place for "${event.name}" is confirmed.`, event.ticketPrice > 0 ? 'pending_payment' : 'registration_confirmed');
    return { success: true, message: 'Waitlist offer accepted', data: this.enrich(registration) };
  }

  cancel(id: string, reason: string, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (registration.status === 'rejected') throw new ConflictException('A declined registration cannot be cancelled');
    if (registration.status === 'cancelled') throw new ConflictException('Registration is already cancelled');
    if (registration.status === 'attended') throw new BadRequestException('A checked-in registration cannot be cancelled');
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event) throw new NotFoundException('Event not found');
    const payment = this.db.payments.find(p => p.registrationId === id && p.status === 'completed');
    const attendee = this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
    if (payment && this.db.refunds.some(item => item.paymentId === payment.paymentId && ['pending', 'completed'].includes(item.status))) {
      throw new ConflictException('A refund has already been requested for this ticket payment');
    }
    const priorStatus = registration.status; const now = new Date();
    registration.status = 'cancelled'; registration.cancellationReason = reason; registration.cancelledAt = now; registration.qrCode = undefined; registration.verificationId = undefined; registration.offerExpiresAt = undefined; registration.updatedAt = now;
    let refund: any = null;
    if (payment) {
      const eligible = !event.cancellationDeadline || now <= new Date(`${event.cancellationDeadline}T23:59:59`);
      refund = { refundId: this.db.generateId('ref'), paymentId: payment.paymentId, payerId: registration.attendeeId, recipientUserId: attendee?.userId, recipientRole: 'attendee', registrationId: id, amount: eligible ? payment.amount : 0, status: eligible ? 'pending' : 'not_applicable', simulated: true, reason, requestedAt: now };
      this.db.refunds.push(refund);
    }
    this.notify(registration, refund?.status === 'pending' ? `Registration cancelled. Refund of ₹${refund.amount} is pending.` : `Registration cancelled for "${event.name}".`, refund?.status === 'pending' ? 'refund_pending' : 'registration_cancelled', payment?.paymentId);
    if (['registered', 'pending_payment'].includes(priorStatus)) this.offerNext(event.eventId);
    this.db.persist();
    return { success: true, message: 'Registration cancelled', data: this.enrich(registration) };
  }

  private offerNext(eventId: string) {
    const event = this.db.events.find(e => e.eventId === eventId);
    if (!event || this.occupied(eventId) >= event.capacity) return;
    const next = this.db.registrations.filter(r => r.eventId === eventId && r.status === 'waitlisted' && !r.offerExpiresAt
      && (!requiresRegistrationApproval(event) || r.reviewStatus === 'approved')).sort((a, b) => +a.createdAt - +b.createdAt)[0];
    if (!next) return;
    next.offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); next.updatedAt = new Date();
    this.notify(next, `A place is available for "${event?.name || eventId}". Accept it within 48 hours.`, 'waitlist_offer');
  }
}
