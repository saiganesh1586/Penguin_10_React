import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataStore, ProposalVersion } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { constants, createReadStream, existsSync } from 'fs';
import { access } from 'fs/promises';
import * as path from 'path';
import { assertEventPolicyAccepted, EventPolicyAcknowledgementDto, getEventPolicy } from '../../common/event-policy';
import { completedEventPayments } from '../../common/utils/event-payments';
import {
  CreateEventRequestDto,
  UpdateEventRequestStatusDto,
  RequestMissingInfoDto,
  ProvideMissingInfoDto,
  SendProposalDto,
  ReviseProposalDto,
  RejectRequestDto,
  ClientResponseDto,
  UpdateAgreementStatusDto,
  UpdatePaymentStatusDto,
  ConfirmBookingDto,
  PayDepositDto,
  RequestEventModificationDto,
  RespondToEventModificationDto,
} from './dto/event-request.dto';

@Injectable()
export class EventRequestsService {
  private db: DataStore;
  constructor() {
    this.db = DataStore.getInstance();
  }

  /** Reject invalid dates and dates that are not strictly in the future. */
  private isPastDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return true;
    }
    const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(normalizedDate.getTime()) || normalizedDate.toISOString().slice(0, 10) !== dateStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${dateStr}T00:00:00`);
    return targetDate <= today;
  }

  /** Validate the event date; organizers can handle any number of events per day. */
  checkDateAvailability(_organizerId: string, dateStr: string, _excludeRequestId?: string): {
    available: boolean;
    reason?: string;
    pastDate?: boolean;
  } {
    if (!dateStr || !dateStr.trim()) {
      return { available: false, reason: 'Date string is required' };
    }

    if (this.isPastDate(dateStr)) {
      return {
        available: false,
        reason: 'Event date must be in the future',
        pastDate: true,
      };
    }

    return { available: true, reason: 'Future event date accepted' };
  }

  /**
   * Auto-expire proposals that have passed their validUntil date
   */
  private checkAndExpireProposals(requests: any[]): void {
    const now = new Date();
    for (const req of requests) {
      if (
        (req.status === 'proposal_sent' || req.status === 'awaiting_client') &&
        Array.isArray(req.proposals) &&
        req.proposals.length > 0
      ) {
        const activeProposal = req.proposals[req.proposals.length - 1];
        if (
          activeProposal &&
          activeProposal.status === 'pending_client' &&
          activeProposal.validUntil
        ) {
          const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
          if (validUntilDate < now) {
            activeProposal.status = 'expired';
            req.status = 'expired';
            req.updatedAt = new Date();
            req.auditHistory = req.auditHistory || [];
            req.auditHistory.push({
              id: this.db.generateId('aud'),
              action: `Proposal (v${activeProposal.version}) Expired`,
              performedBy: 'system',
              role: 'system',
              timestamp: new Date(),
              details: { validUntil: activeProposal.validUntil },
            });
          }

        }
      }
    }
  }

  private addAudit(request: any, action: string, userId: string | undefined, role: UserRole, details?: any): void {
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action,
      performedBy: userId || role,
      role,
      timestamp: new Date(),
      ...(details ? { details } : {}),
    });
  }

  private notifyRequestClient(request: any, message: string, type: string): void {
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    if (!client) return;
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: client.userId,
      eventId: request.eventId,
      registrationId: undefined,
      paymentId: undefined,
      message,
      type,
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });
  }

  private notifyRequestOrganizer(request: any, message: string, type: string): void {
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (!organizer) return;
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: organizer.userId,
      eventId: request.eventId,
      registrationId: undefined,
      paymentId: undefined,
      message,
      type,
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });
  }

  findOrganizers(role: UserRole): any[] {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can browse organizers');
    }
    return this.db.organizers.flatMap(organizer => {
      const user = this.db.findUserById(organizer.userId);
      if (!user || user.status !== 'active') return [];
      const reviews = this.db.clientOrganizerReviews.filter(review => review.organizerId === organizer.organizerId);
      const averageReviewRating = reviews.length
        ? Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1))
        : undefined;

      // Compute years of experience from account creation date
      const createdDate = organizer.createdAt ? new Date(organizer.createdAt) : new Date();
      const yearsExperience = Math.max(1, new Date().getFullYear() - createdDate.getFullYear());

      // Completed events count
      const completedEvents = this.db.events.filter(e => e.organizerId === organizer.organizerId && e.status === 'completed').length;

      return [{
        organizerId: organizer.organizerId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        businessName: organizer.businessName || '',
        rating: averageReviewRating || organizer.rating,
        reviewCount: reviews.length,
        yearsExperience,
        completedEvents,
        verified: yearsExperience >= 1,
      }];
    });
  }

  create(dto: CreateEventRequestDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can create event requests');
    }
    const policy = getEventPolicy();
    assertEventPolicyAccepted(dto, policy);

    const client = this.db.clients.find(
      (item) => item.userId === userId || item.clientId === userId,
    );
    if (role === UserRole.CLIENT && !client) {
      throw new ForbiddenException('Client profile not found');
    }
    const clientId = role === UserRole.CLIENT ? client!.clientId : dto.clientId;
    const organizer = this.db.organizers.find(
      (item) => item.organizerId === dto.organizerId || item.userId === dto.organizerId,
    );
    if (!organizer) {
      throw new BadRequestException('Selected organizer was not found');
    }

    if (this.isPastDate(dto.eventDate)) {
      throw new BadRequestException('Desired event date must be in the future');
    }

    if (dto.budget <= 0) {
      throw new BadRequestException('Budget must be greater than zero');
    }

    if (dto.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1 guest');
    }

    const ticketPrice = dto.ticketPrice ?? 0;
    const visibility = dto.visibility ?? 'public';
    if (!['public', 'private'].includes(visibility)) throw new BadRequestException('Choose public or private event visibility');
    if (!Number.isFinite(ticketPrice) || ticketPrice < 0 || Math.abs(ticketPrice * 100 - Math.round(ticketPrice * 100)) > 0.000001) {
      throw new BadRequestException('Ticket price must be zero or greater with at most two decimal places');
    }

    const clientProfile = role === UserRole.CLIENT
      ? this.db.clients.find(c => c.userId === userId)
      : this.db.clients.find(c => c.clientId === dto.clientId || c.userId === dto.clientId);
    if (!clientProfile) throw new NotFoundException('Client profile not found');
    if (role === UserRole.SUPER_ADMIN && dto.clientId && clientProfile.clientId !== dto.clientId && clientProfile.userId !== dto.clientId) {
      throw new BadRequestException('Invalid client');
    }

    const organizerProfile = this.db.organizers.find(o =>
      o.organizerId === dto.organizerId || o.userId === dto.organizerId,
    );
    if (!organizerProfile) throw new NotFoundException('Organizer not found');

    // Check for duplicate active requests
    const isDuplicate = this.db.eventRequests.some(
      r =>
        r.clientId === clientProfile.clientId &&
        r.organizerId === organizerProfile.organizerId &&
        r.eventName.toLowerCase().trim() === dto.eventName.toLowerCase().trim() &&
        r.eventDate === dto.eventDate &&
        ['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'changes_requested', 'counteroffer_received', 'planning', 'plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status)
    );

    if (isDuplicate) {
      throw new ConflictException(
        `A pending or active event request for "${dto.eventName}" on ${dto.eventDate} already exists.`
      );
    }

    const requestId = this.db.generateId('req');
    const request = {
      requestId,
      clientId: clientProfile.clientId,
      organizerId: organizerProfile.organizerId,
      eventName: dto.eventName.trim(),
      eventType: dto.eventType?.trim() || 'General',
      venue: dto.venue?.trim() || '',
      eventDate: dto.eventDate,
      eventTime: dto.eventTime?.trim() || '00:00',
      city: dto.city?.trim() || '',
      dateFlexibility: dto.dateFlexibility || 'exact',
      budget: Number(dto.budget),
      ticketPrice,
      visibility,
      capacity: Number(dto.capacity),
      requirements: dto.requirements || '',
      notes: dto.notes || '',
      policySnapshot: policy,
      clientPolicyAcceptedAt: new Date(),
      clientPolicyAcceptedBy: userId || clientProfile.userId,
      status: 'submitted' as const,
      agreementStatus: 'not_sent' as const,
      paymentStatus: 'unpaid' as const,
      currentProposalVersion: 0,
      proposals: [],
      clarifications: [],
      auditHistory: [
        {
          id: this.db.generateId('aud'),
          action: 'Request Submitted',
          performedBy: userId || clientProfile.userId,
          role: role,
          timestamp: new Date(),
          details: {
            budget: dto.budget,
            ticketPrice,
            visibility,
            capacity: dto.capacity,
            eventDate: dto.eventDate,
            eventType: dto.eventType,
            city: dto.city,
          },
        },
      ],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.eventRequests.push(request);

    // Notify organizer
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: organizerProfile.userId,
      eventId: undefined,
      registrationId: undefined,
      paymentId: undefined,
      message: `New event request: "${dto.eventName}" from client ${clientId}`,
      type: 'event_request',
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });

    return { success: true, message: 'Event request submitted successfully', data: request };
  }

  findAll(role: UserRole, userId?: string): any[] {
    this.checkAndExpireProposals(this.db.eventRequests);

    let requests = [...this.db.eventRequests];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      const clientId = client ? client.clientId : userId;
      requests = requests.filter(r => r.clientId === clientId || (r as any).clientId === userId);
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const organizerId = organizer ? organizer.organizerId : userId;
      requests = requests.filter(
        r => r.organizerId === organizerId || (r as any).organizerId === userId || (r as any).organizer === userId || (r as any).organizer === organizerId
      );
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const getRequestTimestamp = (r: any) => {
      const u = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      const c = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      let p = 0;
      if (Array.isArray(r.proposals) && r.proposals.length > 0) {
        const latestProp = r.proposals[r.proposals.length - 1];
        p = latestProp?.sentAt ? new Date(latestProp.sentAt).getTime() : 0;
      }
      return Math.max(u, c, p);
    };

    requests.sort((a, b) => {
      const diff = getRequestTimestamp(b) - getRequestTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.requestId || (b as any).id || '').localeCompare(String(a.requestId || (a as any).id || ''));
    });

    return requests.map(request => {
      const clientProfile = this.db.clients.find(client => client.clientId === request.clientId);
      const clientUser = clientProfile && this.db.findUserById(clientProfile.userId);
      const organizerProfile = this.db.organizers.find(organizer => organizer.organizerId === request.organizerId);
      const organizerUser = organizerProfile && this.db.findUserById(organizerProfile.userId);
      return {
        ...request,
        clientUserId: clientUser?.userId,
        organizerUserId: organizerUser?.userId,
        clientDetails: clientUser ? {
          userId: clientUser.userId, name: clientUser.name, email: clientUser.email,
          phoneNo: clientUser.phoneNo, companyName: clientProfile?.companyName,
        } : undefined,
        organizerDetails: organizerUser ? {
          userId: organizerUser.userId, name: organizerUser.name, businessName: organizerProfile?.businessName,
        } : undefined,
      };
    });
  }

  findOne(requestId: string, role: UserRole, userId?: string): any {
    this.checkAndExpireProposals(this.db.eventRequests);

    const request = this.db.eventRequests.find(r => r.requestId === requestId || (r as any).id === requestId);
    if (!request) throw new NotFoundException(`Event request ${requestId} not found`);

    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      const clientId = client ? client.clientId : userId;
      if (request.clientId !== clientId && (request as any).clientId !== userId) {
        throw new ForbiddenException('Access denied to this request');
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const organizerId = organizer ? organizer.organizerId : userId;
      if (
        request.organizerId !== organizerId &&
        (request as any).organizerId !== userId &&
        (request as any).organizer !== userId &&
        (request as any).organizer !== organizerId
      ) {
        throw new ForbiddenException('Access denied to this request');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  private findMutableRequest(requestId: string, role: UserRole, userId?: string): any {
    const request = this.findOne(requestId, role, userId);
    if (['cancelled', 'completed', 'rejected', 'withdrawn', 'expired'].includes(request.status)) {
      throw new BadRequestException(`Cannot change a request that is already ${request.status}`);
    }
    return request;
  }

  /**
   * Organizer starts review of a submitted request
   */
  startReview(requestId: string, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can start request reviews');
    }

    if (!['submitted', 'pending', 'under_review'].includes(request.status)) {
      throw new BadRequestException(`Cannot review a request in ${request.status} status`);
    }

    if (request.status !== 'under_review') {
      const previousStatus = request.status;
      request.status = 'under_review';
      request.updatedAt = new Date();
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: 'Review Started',
        performedBy: userId || 'organizer',
        role,
        timestamp: new Date(),
        details: { previousStatus },
      });
    }

    return { success: true, message: 'Request is now under review', data: request };
  }

  acceptRequest(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can accept event requests');
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const user = this.db.users.find(u => u.userId === userId);
      const org = this.db.organizers.find(o => o.organizerId === request.organizerId || o.userId === userId);
      if ((user && user.status !== 'active') || (org && (org as any).verificationStatus && (org as any).verificationStatus !== 'Approved')) {
        throw new ForbiddenException('Only approved organizers can accept event bookings or requests');
      }
    }
    if (!['submitted', 'pending', 'under_review', 'info_requested'].includes(request.status)) {
      throw new BadRequestException(`Cannot accept a request in ${request.status} status`);
    }
    const availability = this.checkDateAvailability(request.organizerId, request.eventDate, request.requestId);
    if (!availability.available) throw new ConflictException(availability.reason);
    const policy = request.policySnapshot || getEventPolicy();
    assertEventPolicyAccepted(acknowledgement || {}, policy);

    request.policySnapshot = policy;
    request.organizerPolicyAcceptedAt = new Date();
    request.organizerPolicyAcceptedBy = userId;
    request.status = 'planning';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Event Request Accepted; Planning Started',
      performedBy: userId || 'organizer',
      role,
      timestamp: new Date(),
    });
    this.notifyRequestClient(request, `Your event request "${request.eventName}" was accepted. The organizer can now prepare your event plan.`, 'request_accepted');
    return { success: true, message: 'Request accepted; event planning can begin', data: request };
  }

  /**
   * Organizer requests missing info from client
   */
  requestMissingInfo(requestId: string, dto: RequestMissingInfoDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can request missing information');
    }

    if (!['submitted', 'pending', 'under_review', 'info_requested'].includes(request.status)) {
      throw new BadRequestException(`Cannot request information while the request is ${request.status}`);
    }

    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException('Message is required when requesting information');
    }

    request.clarifications = request.clarifications || [];
    request.clarifications.push({
      id: this.db.generateId('clr'),
      senderId: userId || 'organizer',
      senderRole: 'organizer',
      senderName: 'Organizer',
      message: dto.message.trim(),
      timestamp: new Date(),
    });

    request.status = 'info_requested';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Missing Information Requested',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { query: dto.message.trim() },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Organizer requested additional information for "${request.eventName}": "${dto.message.slice(0, 60)}..."`,
        type: 'info_requested',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Information requested from client', data: request };
  }

  /**
   * Client provides missing information
   */
  provideMissingInfo(requestId: string, dto: ProvideMissingInfoDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only client can respond to missing information requests');
    }
    if (request.status !== 'info_requested') {
      throw new BadRequestException('This request is not waiting for clarification');
    }

    if (!dto.response || !dto.response.trim()) {
      throw new BadRequestException('Response is required');
    }

    request.clarifications = request.clarifications || [];
    request.clarifications.push({
      id: this.db.generateId('clr'),
      senderId: userId || 'client',
      senderRole: 'client',
      senderName: 'Client',
      message: dto.response.trim(),
      timestamp: new Date(),
    });

    request.status = 'under_review';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Information Provided by Client',
      performedBy: userId || 'client',
      role: role,
      timestamp: new Date(),
      details: { response: dto.response.trim() },
    });

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (organizer) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: organizer.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Client provided information for "${request.eventName}"`,
        type: 'info_provided',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Information sent to organizer', data: request };
  }

  /**
   * Organizer sends proposal
   */
  sendProposal(requestId: string, dto: SendProposalDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can send proposals');
    }

    const hasAcceptedProposal = Array.isArray(request.proposals) && request.proposals.length > 0;
    const canReviseAcceptedProposal = hasAcceptedProposal &&
      ['under_review', 'proposal_sent', 'awaiting_client'].includes(request.status);
    if (!['planning', 'plan_revision_requested', 'submitted', 'pending', 'under_review'].includes(request.status) && !canReviseAcceptedProposal) {
      throw new BadRequestException('A proposal can only be sent after the organizer accepts the request');
    }

    if (['submitted', 'pending', 'under_review'].includes(request.status)) {
      if (!request.policySnapshot) {
        request.policySnapshot = getEventPolicy();
      }
      if (!request.organizerPolicyAcceptedAt) {
        request.organizerPolicyAcceptedAt = new Date();
        request.organizerPolicyAcceptedBy = userId;
      }
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Proposal amount must be greater than zero');
    }

    if (dto.depositRequired < 0 || dto.depositRequired > dto.amount) {
      throw new BadRequestException('Deposit required must be between 0 and total amount');
    }

    if (this.isPastDate(dto.validUntil)) {
      throw new BadRequestException('Proposal expiration date must be in the future');
    }

    const proposedDate = dto.proposedDate || request.eventDate;
    if (this.isPastDate(proposedDate)) {
      throw new BadRequestException('Proposed event date must be in the future');
    }

    // Check date availability
    const avail = this.checkDateAvailability(request.organizerId, proposedDate, request.requestId);
    if (!avail.available) {
      throw new ConflictException(`Cannot propose date ${proposedDate}: ${avail.reason}`);
    }

    request.proposals = request.proposals || [];
    // If there were any existing pending proposals, mark them superseded
    request.proposals.forEach((p: any) => {
      if (p.status === 'pending_client') p.status = 'revision_requested';
    });

    const newVersion = (request.proposals.length || 0) + 1;

    let docName = dto.documentName;
    let docFileName = dto.documentFileName;
    let docSize = dto.documentSize;
    let docType = dto.documentType || (docFileName ? 'application/pdf' : undefined);

    if (!docFileName && request.pendingPlanDocument) {
      docName = request.pendingPlanDocument.originalName;
      docFileName = request.pendingPlanDocument.fileName;
      docSize = request.pendingPlanDocument.size;
      docType = 'application/pdf';
      delete request.pendingPlanDocument;
    }

    const organizerProfile = this.db.organizers.find(o => o.organizerId === request.organizerId || o.userId === userId);
    const organizerUser = organizerProfile ? this.db.findUserById(organizerProfile.userId) : null;
    const uploaderName = organizerUser?.name || organizerProfile?.businessName || 'Organizer';

    const proposal: any = {
      version: newVersion,
      amount: Number(dto.amount),
      depositRequired: Number(dto.depositRequired),
      proposedDate,
      validUntil: dto.validUntil,
      terms: dto.terms || 'Standard service agreement terms apply.',
      notes: dto.notes || '',
      eventPlan: dto.eventPlan || '',
      timeline: dto.timeline || '',
      organizerFee: dto.organizerFee !== undefined ? Number(dto.organizerFee) : undefined,
      itemizedCosts: dto.itemizedCosts || '',
      taxes: dto.taxes !== undefined ? Number(dto.taxes) : undefined,
      includedServices: dto.includedServices || '',
      excludedServices: dto.excludedServices || '',
      attendeeCapacity: dto.attendeeCapacity !== undefined ? Number(dto.attendeeCapacity) : undefined,
      constraints: dto.constraints || '',
      paymentSchedule: dto.paymentSchedule || '',
      cancellationTerms: dto.cancellationTerms || '',
      conditions: dto.conditions || '',
      status: 'pending_client' as const,
      sentAt: new Date(),
      documentName: docName,
      documentFileName: docFileName,
      documentSize: docSize,
      documentType: docType,
      uploadedAt: docFileName ? new Date() : undefined,
      uploaderId: userId || request.organizerId,
      uploaderName: docFileName ? uploaderName : undefined,
    };

    if (docFileName) {
      const existingPlan = this.db.eventPlans.find(
        p => p.requestId === request.requestId && p.documentFileName === docFileName,
      );
      if (!existingPlan) {
        const plan = {
          eventPlanId: this.db.generateId('plan'),
          requestId: request.requestId,
          clientId: request.clientId,
          organizerId: request.organizerId,
          title: `Proposal Plan v${newVersion} - ${request.eventName}`,
          description: dto.notes || dto.eventPlan || `Event plan for ${request.eventName}`,
          budget: Number(dto.amount),
          capacity: dto.attendeeCapacity || request.capacity,
          schedule: dto.timeline || '',
          services: dto.includedServices || '',
          arrangements: '',
          budgetBreakdown: dto.itemizedCosts || '',
          documentName: docName,
          documentFileName: docFileName,
          documentSize: docSize,
          documentType: docType || 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: userId || request.organizerId,
          uploaderName,
          revision: newVersion,
          status: 'submitted' as const,
          approvalStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.db.eventPlans.push(plan);
        request.activeEventPlanId = plan.eventPlanId;
      }
    }

    request.proposals.push(proposal);
    request.currentProposalVersion = newVersion;
    request.status = 'proposal_sent';
    request.agreementStatus = 'not_sent';
    request.paymentStatus = 'unpaid';
    request.updatedAt = new Date();

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: `Proposal Sent (v${newVersion})`,
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: {
        version: newVersion,
        amount: dto.amount,
        depositRequired: dto.depositRequired,
        validUntil: dto.validUntil,
        proposedDate,
        documentName: docName,
      },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `New proposal received for "${request.eventName}" (v${newVersion}: ₹${dto.amount.toLocaleString()})`,
        type: 'proposal_sent',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: `Proposal v${newVersion} sent successfully`, data: request };
  }

  /**
   * Organizer revises existing proposal
   */
  reviseProposal(requestId: string, dto: ReviseProposalDto, role: UserRole, userId?: string): any {
    return this.sendProposal(requestId, dto, role, userId);
  }

  /**
   * Organizer rejects request with mandatory reason
   */
  rejectRequest(requestId: string, dto: RejectRequestDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can reject event requests');
    }

    if (request.status === 'confirmed') {
      throw new BadRequestException('Cannot reject an already confirmed request. Please cancel the booking instead.');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason is mandatory when declining/rejecting a request');
    }

    const reasonType = dto.reasonType || 'permanent';
    if (reasonType !== 'permanent') {
      const policy = request.policySnapshot || getEventPolicy();
      assertEventPolicyAccepted(dto, policy);
      if (reasonType === 'budget' || reasonType === 'both') {
        if (!dto.proposedBudget || dto.proposedBudget <= request.budget) {
          throw new BadRequestException('A requested budget increase must be greater than the current budget');
        }
      }
      if (reasonType === 'date' || reasonType === 'both') {
        if (!dto.proposedDate || this.isPastDate(dto.proposedDate)) {
          throw new BadRequestException('A future proposed date is required');
        }
        const availability = this.checkDateAvailability(request.organizerId, dto.proposedDate, request.requestId);
        if (!availability.available) throw new ConflictException(availability.reason);
      }
      request.negotiations = request.negotiations || [];
      request.policySnapshot = policy;
      request.organizerPolicyAcceptedAt = new Date();
      request.organizerPolicyAcceptedBy = userId;
      request.negotiations.push({
        id: this.db.generateId('neg'),
        action: 'changes_requested',
        performedBy: userId || 'organizer',
        role,
        reason: dto.reason.trim(),
        ...(dto.proposedBudget ? { budget: Number(dto.proposedBudget) } : {}),
        ...(dto.proposedDate ? { eventDate: dto.proposedDate } : {}),
        timestamp: new Date(),
      });
      request.status = 'changes_requested';
      request.updatedAt = new Date();
      this.addAudit(request, 'Changes Requested by Organizer', userId, role, {
        reasonType,
        reason: dto.reason.trim(),
        proposedBudget: dto.proposedBudget,
        proposedDate: dto.proposedDate,
      });
      this.notifyRequestClient(
        request,
        `The organizer requested changes to "${request.eventName}": ${dto.reason.trim()}`,
        'request_changes',
      );
      return { success: true, message: 'Requested changes sent to client', data: request };
    }

    request.status = 'rejected';
    request.rejectionReason = dto.reason.trim();
    if (dto.comments && dto.comments.trim()) {
      request.rejectionComments = dto.comments.trim();
    }
    request.updatedAt = new Date();

    // Mark any active proposal as rejected
    if (Array.isArray(request.proposals)) {
      request.proposals.forEach((p: any) => {
        if (p.status === 'pending_client') p.status = 'rejected';
      });
    }

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Request Rejected',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { reason: dto.reason.trim(), comments: dto.comments?.trim() },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Your event request "${request.eventName}" was declined: ${dto.reason.trim()}`,
        type: 'request_rejected',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Request rejected with reason recorded', data: request };
  }

  /**
   * Client responds to proposal (accept, request_revision, reject, withdraw)
   */
  clientResponse(requestId: string, dto: ClientResponseDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can respond to proposals');
    }

    if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
      throw new BadRequestException(`Cannot respond to a request that is already ${request.status}`);
    }

    const proposals = request.proposals || [];
    const activeProposal = proposals[proposals.length - 1];

    if (dto.decision === 'withdraw') {
      request.status = 'withdrawn';
      request.withdrawalReason = dto.notes || 'Withdrawn by client';
      request.updatedAt = new Date();
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: 'Request Withdrawn by Client',
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
      return { success: true, message: 'Event request withdrawn', data: request };
    }

    if (['accept_changes', 'reject_changes', 'counteroffer'].includes(dto.decision)) {
      if (!['changes_requested', 'counteroffer_received'].includes(request.status)) {
        throw new BadRequestException('There are no organizer-requested changes to respond to');
      }
      const latestChange = [...(request.negotiations || [])].reverse().find(n => n.action === 'changes_requested');
      if (dto.decision === 'accept_changes') {
        if (latestChange?.eventDate) {
          const availability = this.checkDateAvailability(request.organizerId, latestChange.eventDate, request.requestId);
          if (!availability.available) throw new ConflictException(availability.reason);
          request.eventDate = latestChange.eventDate;
        }
        if (latestChange?.budget) request.budget = latestChange.budget;
        request.status = 'planning';
        request.updatedAt = new Date();
        this.addAudit(request, 'Client Accepted Requested Changes', userId, role, { notes: dto.notes });
      } else if (dto.decision === 'reject_changes') {
        request.status = 'under_review';
        request.updatedAt = new Date();
        request.negotiations = request.negotiations || [];
        request.negotiations.push({
          id: this.db.generateId('neg'),
          action: 'changes_rejected',
          performedBy: userId || 'client',
          role,
          reason: dto.notes?.trim() || 'Client rejected the requested changes',
          timestamp: new Date(),
        });
        this.addAudit(request, 'Client Rejected Requested Changes', userId, role, { notes: dto.notes });
      } else {
        if (
          !dto.counterofferBudget &&
          !dto.counterofferDate &&
          !dto.counterofferEventName &&
          !dto.counterofferEventType &&
          dto.counterofferCapacity === undefined &&
          !dto.counterofferVenue &&
          !dto.counterofferRequirements
        ) {
          throw new BadRequestException('A counteroffer must include at least one changed event detail');
        }
        if (dto.counterofferBudget && dto.counterofferBudget <= 0) {
          throw new BadRequestException('Counteroffer budget must be greater than zero');
        }
        if (dto.counterofferDate) {
          if (this.isPastDate(dto.counterofferDate)) throw new BadRequestException('Counteroffer date must be in the future');
          const availability = this.checkDateAvailability(request.organizerId, dto.counterofferDate, request.requestId);
          if (!availability.available) throw new ConflictException(availability.reason);
        }
        request.negotiations = request.negotiations || [];
        const prevProposal = (request.proposals || [])[request.proposals.length - 1];
        const coBudget = dto.counterofferBudget ? Number(dto.counterofferBudget) : (request.budget || 0);
        const coDeposit = dto.counterofferDeposit !== undefined
          ? Number(dto.counterofferDeposit)
          : (prevProposal ? Math.round(coBudget * ((prevProposal.depositRequired || (coBudget * 0.3)) / (prevProposal.amount || coBudget || 1))) : Math.round(coBudget * 0.3));
        const coBalance = Math.max(0, coBudget - coDeposit);
        const coVersion = ((request.negotiations || []).filter((n: any) => n.action === 'counteroffer').length + 1);

        request.negotiations.push({
          id: this.db.generateId('neg'),
          action: 'counteroffer',
          performedBy: userId || 'client',
          role,
          version: coVersion,
          reason: dto.notes?.trim() || '',
          budget: coBudget,
          proposedPrice: coBudget,
          depositRequired: coDeposit,
          remainingBalance: coBalance,
          ...(dto.counterofferDate ? { eventDate: dto.counterofferDate } : {}),
          ...(dto.counterofferEventName ? { eventName: dto.counterofferEventName.trim() } : {}),
          ...(dto.counterofferEventType ? { eventType: dto.counterofferEventType.trim() } : {}),
          ...(dto.counterofferCapacity !== undefined ? { capacity: Number(dto.counterofferCapacity) } : {}),
          ...(dto.counterofferVenue !== undefined ? { venue: dto.counterofferVenue.trim() } : {}),
          requirements: dto.counterofferRequirements?.trim() || request.requirements || '',
          services: dto.counterofferServices?.trim() || prevProposal?.includedServices || prevProposal?.services || 'Event coordination and vendor management',
          deliverables: dto.counterofferDeliverables?.trim() || prevProposal?.eventPlan || prevProposal?.deliverables || 'Full event planning and execution',
          eventPlan: dto.counterofferEventPlan?.trim() || prevProposal?.eventPlan || 'Event plan and scope per client requirements',
          timeline: dto.counterofferTimeline?.trim() || prevProposal?.timeline || '09:00 Setup; 11:00 Registration; 13:00 Main event; 17:00 Wrap-up',
          paymentTerms: dto.counterofferPaymentTerms?.trim() || prevProposal?.paymentSchedule || prevProposal?.paymentTerms || '30% Advance Deposit on Agreement, 70% Remaining Balance upon Completion',
          cancellationTerms: dto.counterofferCancellationTerms?.trim() || prevProposal?.cancellationTerms || prevProposal?.cancellationPolicy || '14+ days notice: 10% fee, 90% net refund. Within 14 days: Non-refundable.',
          validUntil: dto.counterofferValidUntil?.trim() || prevProposal?.validUntil || '',
          status: 'pending',
          timestamp: new Date(),
        });
        request.status = 'counteroffer_received';
        request.updatedAt = new Date();
        this.addAudit(request, 'Counteroffer Sent by Client', userId, role, {
          budget: dto.counterofferBudget,
          eventDate: dto.counterofferDate,
          eventName: dto.counterofferEventName,
          eventType: dto.counterofferEventType,
          capacity: dto.counterofferCapacity,
          venue: dto.counterofferVenue,
          requirements: dto.counterofferRequirements,
          notes: dto.notes,
        });
      }
      if (dto.decision === 'accept_changes') {
        this.notifyRequestOrganizer(request, `Client accepted the requested changes for "${request.eventName}".`, 'changes_accepted');
      } else {
        this.notifyRequestOrganizer(request, `Client responded to changes for "${request.eventName}": ${dto.decision.replace('_', ' ')}.`, `changes_${dto.decision}`);
      }
      return { success: true, message: `Response "${dto.decision}" recorded`, data: request };
    }

    if (!activeProposal) {
      throw new BadRequestException('No active proposal found on this request to respond to');
    }

    if (request.status !== 'proposal_sent' || activeProposal.status !== 'pending_client') {
      throw new BadRequestException('This proposal is no longer awaiting a client decision');
    }

    if (dto.decision === 'request_revision' && !dto.notes?.trim()) {
      throw new BadRequestException('A reason is required when requesting a revised proposal');
    }

    // Check expiry
    if (activeProposal.validUntil) {
      const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
      if (validUntilDate < new Date()) {
        activeProposal.status = 'expired';
        request.status = 'expired';
        request.updatedAt = new Date();
        throw new BadRequestException('This proposal has expired. Please request a revised proposal.');
      }
    }

    activeProposal.clientResponseAt = new Date();
    activeProposal.clientNotes = dto.notes?.trim() || '';

    if (dto.decision === 'accept') {
      activeProposal.status = 'accepted';
      if (activeProposal.proposedDate) request.eventDate = activeProposal.proposedDate;
      request.status = 'awaiting_client';
      request.agreementStatus = 'pending_signature';
      request.paymentStatus = 'deposit_pending';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Proposal Accepted (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    } else if (dto.decision === 'request_revision') {
      activeProposal.status = 'revision_requested';
      request.status = 'under_review';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Revision Requested by Client (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    } else if (dto.decision === 'reject') {
      activeProposal.status = 'rejected';
      request.status = 'rejected';
      request.rejectionReason = dto.notes || 'Proposal rejected by client';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Proposal Rejected by Client (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    }

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (organizer) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: organizer.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: dto.decision === 'request_revision'
          ? `Client requested a revised plan for "${request.eventName}": ${activeProposal.clientNotes}`
          : `Client responded to proposal for "${request.eventName}": ${dto.decision.toUpperCase()}`,
        type: `proposal_${dto.decision}`,
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: `Response "${dto.decision}" recorded`, data: request };
  }

  acceptCounteroffer(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can accept client counteroffers');
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const isOwner = organizer
        ? (organizer.organizerId === request.organizerId || organizer.userId === request.organizerId)
        : (request.organizerId === userId);
      if (!isOwner) {
        throw new ForbiddenException('You are not authorized to accept counteroffers for this event request');
      }
    }

    if (request.status !== 'counteroffer_received') {
      if (['planning', 'awaiting_client', 'confirmed'].includes(request.status)) {
        throw new BadRequestException('This counteroffer has already been accepted or processed.');
      }
      if (request.status === 'withdrawn') {
        throw new BadRequestException('Cannot accept counteroffer; request has been withdrawn by the client.');
      }
      if (request.status === 'rejected') {
        throw new BadRequestException('Cannot accept counteroffer; request has been rejected.');
      }
      if (request.status === 'cancelled') {
        throw new BadRequestException('Cannot accept counteroffer; booking has been cancelled.');
      }
      throw new BadRequestException('There is no pending client counteroffer for this request.');
    }

    let counteroffer = [...(request.negotiations || [])].reverse().find(n => n.action === 'counteroffer');
    if (!counteroffer) {
      const prevProposal = (request.proposals || [])[request.proposals.length - 1];
      if (request.budget || prevProposal) {
        const budget = request.budget || prevProposal?.amount || 25000;
        const deposit = prevProposal?.depositRequired || Math.round(budget * 0.3);
        counteroffer = {
          id: this.db.generateId('neg'),
          action: 'counteroffer',
          performedBy: request.clientId || 'client',
          role: 'client',
          version: 1,
          reason: (request as any).clientFeedback || (request as any).clientNotes || 'Client proposed counteroffer on terms and pricing.',
          budget,
          proposedPrice: budget,
          depositRequired: deposit,
          remainingBalance: Math.max(0, budget - deposit),
          eventDate: request.eventDate,
          eventName: request.eventName,
          eventType: request.eventType,
          capacity: request.capacity,
          venue: request.venue,
          requirements: request.requirements,
          services: prevProposal?.includedServices || prevProposal?.services || 'Event coordination and vendor management',
          deliverables: prevProposal?.eventPlan || prevProposal?.deliverables || 'Standard deliverables apply',
          eventPlan: prevProposal?.eventPlan || 'Event plan per client specifications',
          timeline: prevProposal?.timeline || '09:00 Setup; 11:00 Registration; 13:00 Main event; 17:00 Wrap-up',
          paymentTerms: prevProposal?.paymentSchedule || prevProposal?.paymentTerms || '30% Advance Deposit on Agreement, 70% Remaining Balance upon Completion',
          cancellationTerms: prevProposal?.cancellationTerms || prevProposal?.cancellationPolicy || '14+ days notice: 10% fee, 90% net refund. Within 14 days: Non-refundable.',
          validUntil: prevProposal?.validUntil || '',
          timestamp: request.updatedAt || new Date(),
        };
        request.negotiations = request.negotiations || [];
        request.negotiations.push(counteroffer);
      }
    }
    if (!counteroffer) {
      throw new NotFoundException('Counteroffer not found for this event request.');
    }

    if (counteroffer.validUntil) {
      const validUntilDate = new Date(counteroffer.validUntil + 'T23:59:59');
      if (validUntilDate < new Date()) {
        throw new BadRequestException('This counteroffer has expired and can no longer be accepted.');
      }
    }
    if ((counteroffer as any).status === 'accepted' || (counteroffer as any).status === 'mutually_accepted') {
      throw new BadRequestException('This counteroffer has already been accepted.');
    }
    if (request.proposals && request.proposals.length > 0) {
      const latestProposal = request.proposals[request.proposals.length - 1];
      if (latestProposal.sentAt && counteroffer.timestamp && new Date(latestProposal.sentAt).getTime() > new Date(counteroffer.timestamp).getTime()) {
        throw new BadRequestException('Another proposal version has replaced this counteroffer.');
      }
    }

    const policy = request.policySnapshot || getEventPolicy();
    assertEventPolicyAccepted(acknowledgement || {}, policy);
    if (counteroffer.eventDate) {
      const availability = this.checkDateAvailability(request.organizerId, counteroffer.eventDate, request.requestId);
      if (!availability.available) throw new ConflictException(availability.reason);
      request.eventDate = counteroffer.eventDate;
    }
    if (counteroffer.budget) request.budget = counteroffer.budget;
    if (counteroffer.eventName) request.eventName = counteroffer.eventName;
    if (counteroffer.eventType) request.eventType = counteroffer.eventType;
    if (counteroffer.capacity !== undefined) request.capacity = counteroffer.capacity;
    if (counteroffer.venue !== undefined) request.venue = counteroffer.venue;
    if (counteroffer.requirements !== undefined) request.requirements = counteroffer.requirements;

    (counteroffer as any).status = 'mutually_accepted';
    (counteroffer as any).acceptedAt = new Date();
    (counteroffer as any).acceptedBy = userId;

    const agreedVersion = (request.proposals?.length || 0) + 1;
    const agreedProposal: ProposalVersion = {
      version: agreedVersion,
      amount: counteroffer.proposedPrice || counteroffer.budget || request.budget,
      depositRequired: counteroffer.depositRequired !== undefined ? counteroffer.depositRequired : Math.round((counteroffer.budget || request.budget) * 0.3),
      proposedDate: counteroffer.eventDate || request.eventDate,
      validUntil: counteroffer.validUntil || new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
      terms: counteroffer.requirements || request.requirements,
      eventPlan: counteroffer.eventPlan || counteroffer.deliverables || request.requirements,
      timeline: counteroffer.timeline || '09:00 Setup; 11:00 Registration; 13:00 Main event; 17:00 Wrap-up',
      organizerFee: Math.round((counteroffer.budget || request.budget) * 0.2),
      taxes: Math.round((counteroffer.budget || request.budget) * 0.18),
      includedServices: counteroffer.services || counteroffer.requirements,
      paymentSchedule: counteroffer.paymentTerms || '30% Advance Deposit on Agreement, 70% Remaining Balance upon Completion',
      cancellationTerms: counteroffer.cancellationTerms || '14+ days notice: 10% fee, 90% net refund. Within 14 days: Non-refundable.',
      status: 'accepted',
      sentAt: new Date(),
      clientResponseAt: new Date(),
      clientNotes: `Agreed per client counteroffer: ${counteroffer.reason || ''}`.trim(),
    };
    request.proposals = request.proposals || [];
    request.proposals.push(agreedProposal);
    request.currentProposalVersion = agreedVersion;

    request.policySnapshot = policy;
    request.organizerPolicyAcceptedAt = new Date();
    request.organizerPolicyAcceptedBy = userId;
    (request as any).negotiationStatus = 'mutually_accepted';
    request.status = 'planning';
    request.agreementStatus = 'pending_signature';
    request.paymentStatus = 'deposit_pending';
    request.updatedAt = new Date();

    this.addAudit(request, `Counteroffer Accepted (v${counteroffer.version || 1}) - Mutually Agreed`, userId, role, {
      counterofferId: counteroffer.id,
      version: counteroffer.version || 1,
      budget: counteroffer.budget,
      proposedPrice: agreedProposal.amount,
      depositRequired: agreedProposal.depositRequired,
      eventDate: counteroffer.eventDate,
      eventName: counteroffer.eventName,
    });

    this.notifyRequestClient(request, `Counteroffer accepted. Both parties have agreed to the revised proposal for "${request.eventName}". Please review agreement and proceed to advance deposit payment.`, 'counteroffer_accepted');
    this.db.persist();
    return { success: true, message: 'Counteroffer accepted. Both parties have agreed to the revised proposal.', data: request };
  }

  /**
   * Update Agreement Status (agreed, pending_signature, declined)
   */
  updateAgreementStatus(requestId: string, dto: UpdateAgreementStatusDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only the client can acknowledge or decline the agreement');
    }
    if (!['agreed', 'declined'].includes(dto.agreementStatus)) {
      throw new BadRequestException('Agreement status can only be changed through the client acknowledgement action');
    }
    if (!['pending_signature', 'declined'].includes(request.agreementStatus)) {
      throw new BadRequestException('There is no agreement awaiting the client signature');
    }
    if (request.status !== 'awaiting_client' && !(request.status === 'planning' && (request as any).negotiationStatus === 'mutually_accepted')) {
      throw new BadRequestException('The request must be awaiting client agreement');
    }
    const latestProposal = request.proposals?.[request.proposals.length - 1];
    const approvedPlan = this.db.eventPlans.some(plan =>
      plan.requestId === request.requestId && plan.approvalStatus === 'approved',
    );
    if (latestProposal?.status !== 'accepted' && !approvedPlan) {
      throw new BadRequestException('Accept a proposal or approve the final event plan before signing');
    }
    request.agreementStatus = dto.agreementStatus;
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: dto.agreementStatus === 'agreed' ? 'Client Acknowledged Agreement Terms' : 'Client Declined Agreement Terms',
      performedBy: userId || 'user',
      role: role,
      timestamp: new Date(),
    });
    if (dto.agreementStatus === 'agreed') {
      this.notifyRequestOrganizer(request, `The client acknowledged the agreement terms for "${request.eventName}".`, 'agreement_acknowledged');
    } else {
      this.notifyRequestOrganizer(request, `The client declined the agreement for "${request.eventName}".`, 'agreement_declined');
    }

    return { success: true, message: `Agreement status updated to ${dto.agreementStatus}`, data: request };
  }

  /**
   * Update Payment Status (unpaid, deposit_pending, deposit_paid, fully_paid)
   */
  updatePaymentStatus(requestId: string, _dto: UpdatePaymentStatusDto, role: UserRole, userId?: string): any {
    this.findOne(requestId, role, userId);
    throw new ForbiddenException('Payment status is managed only by verified payment processing; manual status changes are not allowed');
  }

  /**
   * Confirm booking: STRICTLY requires agreementStatus === 'agreed' AND paymentStatus satisfied
   */
  confirmBooking(requestId: string, _dto: ConfirmBookingDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can confirm event bookings');
    }

    if (request.status === 'confirmed') {
      return { success: true, message: 'Booking is already confirmed', data: request };
    }

    if (request.status === 'rejected' || request.status === 'withdrawn') {
      throw new BadRequestException(`Cannot confirm a request that has been ${request.status}`);
    }
    if (request.status !== 'awaiting_client') {
      throw new BadRequestException('The client must accept the final plan before booking confirmation');
    }

    const approvedPlan = this.db.eventPlans.find(
      plan => plan.requestId === request.requestId && plan.approvalStatus === 'approved',
    );
    const activeProposal = request.proposals?.[request.proposals.length - 1];
    if (!approvedPlan && activeProposal?.status !== 'accepted') {
      throw new BadRequestException('The client must accept a proposal or approve the final event plan before booking confirmation');
    }

    // Check agreement condition
    const isAgreed = request.agreementStatus === 'agreed';
    if (!isAgreed) {
      throw new BadRequestException(
        'Cannot confirm booking: Signed agreement is required before confirmation. (Agreement status: ' +
          request.agreementStatus +
          ')'
      );
    }

    // Check payment / deposit condition
    const depositRequired = activeProposal?.status === 'accepted' ? Number(activeProposal.depositRequired) : undefined;
    const isDepositSatisfied = depositRequired === 0 ||
      request.paymentStatus === 'deposit_paid' || request.paymentStatus === 'fully_paid';

    if (!isDepositSatisfied) {
      throw new BadRequestException(
        'Cannot confirm booking: Required deposit/payment must be satisfied before confirmation. (Payment status: ' +
          request.paymentStatus +
          ')'
      );
    }

    // Recheck that the agreed event date is still in the future.
    const latestProposal = request.proposals?.[request.proposals.length - 1];
    const eventDate = latestProposal?.status === 'accepted'
      ? latestProposal.proposedDate || request.eventDate
      : request.eventDate;

    const avail = this.checkDateAvailability(request.organizerId, eventDate, request.requestId);
    if (!avail.available) {
      throw new ConflictException(`Cannot confirm booking for date ${eventDate}: ${avail.reason}`);
    }

    // Create Event in db.events
    const eventId = this.db.generateId('evt');
    const newEvent = {
      eventId,
      organizerId: request.organizerId,
      clientId: request.clientId,
      name: request.eventName,
      category: request.eventType || 'Event',
      date: eventDate,
      time: request.eventTime || '10:00',
      location: request.venue || '',
      capacity: request.capacity,
      ticketPrice: request.ticketPrice ?? 0,
      visibility: request.visibility ?? 'public',
      status: 'ongoing' as const,
      description: request.requirements,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.events.push(newEvent);
    if (approvedPlan) {
      approvedPlan.eventId = eventId;
    }
    if (activeProposal && activeProposal.status === 'accepted') {
      activeProposal.eventId = eventId;
    }

    request.status = 'confirmed';
    request.eventId = eventId;
    request.updatedAt = new Date();

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Booking Confirmed & Event Created',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { eventId, eventDate, budget: request.budget },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `Your event booking for "${request.eventName}" has been confirmed!`,
        type: 'booking_confirmed',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    // Notify organizer
    this.notifyRequestOrganizer(
      request,
      `Event booking confirmed for "${request.eventName}". Event ${eventId} created.`,
      'booking_confirmed',
    );

    return {
      success: true,
      message: `Booking confirmed successfully and event ${eventId} created!`,
      data: request,
      eventId,
    };
  }

  /**
   * Client pays deposit via demo payment provider
   */
  payDeposit(requestId: string, dto: PayDepositDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the client can pay the required deposit');
    }
    const latestProposal = request.proposals?.[request.proposals.length - 1];
    const activeProposal = latestProposal?.status === 'accepted' ? latestProposal : undefined;
    const approvedPlan = this.db.eventPlans.find(plan => plan.requestId === request.requestId &&
      (!request.activeEventPlanId || plan.eventPlanId === request.activeEventPlanId) && plan.approvalStatus === 'approved');
    if ((!['awaiting_client', 'confirmed'].includes(request.status) && !(request.status === 'planning' && (request as any).negotiationStatus === 'mutually_accepted')) || (!approvedPlan && !activeProposal)) {
      throw new BadRequestException('Accept the final event plan or proposal before paying the deposit');
    }
    if (approvedPlan && Number(approvedPlan.budget) !== Number(request.budget)) {
      throw new BadRequestException('The approved plan must match the final agreed event budget');
    }
    if (request.agreementStatus !== 'agreed') {
      throw new BadRequestException('The signed agreement is required before paying the deposit');
    }
    if (request.status === 'awaiting_client' || (request.status === 'planning' && (request as any).negotiationStatus === 'mutually_accepted')) {
      const availability = this.checkDateAvailability(request.organizerId, activeProposal?.proposedDate || request.eventDate, request.requestId);
      if (!availability.available) throw new ConflictException(availability.reason);
    }
    if (request.paymentStatus === 'deposit_paid' || request.paymentStatus === 'fully_paid') {
      if (request.status === 'awaiting_client') this.confirmBooking(requestId, {}, UserRole.EVENT_ORGANIZER, request.organizerId);
      this.db.eventWorkflowPayments.filter(payment => payment.requestId === request.requestId && payment.status === 'completed' && !payment.eventId)
        .forEach(payment => { payment.eventId = request.eventId; });
      return { success: true, message: 'Deposit has already been paid for this event request', data: request };
    }
    const depositRequired = activeProposal?.depositRequired !== undefined
      ? Number(activeProposal.depositRequired)
      : Math.round((Number(request.budget) || 25000) * 0.3);

    const totalAmount = Number(activeProposal?.amount || request.budget || depositRequired);
    const now = new Date();

    // Handle simulated payment failure
    if (dto.simulateFailure || dto.status === 'failed') {
      const paymentId = this.db.generateId('pay-deposit');
      this.db.eventWorkflowPayments.push({
        paymentId,
        eventId: request.eventId,
        requestId: request.requestId,
        clientId: request.clientId,
        organizerId: request.organizerId,
        amount: depositRequired,
        status: 'failed' as const,
        paymentDate: now.toISOString().slice(0, 10),
        paymentMethod: 'DEMO_PROVIDER' as const,
        createdAt: now,
        updatedAt: now,
      });
      this.addAudit(request, 'Deposit Payment Failed via Demo Provider', userId, role, {
        paymentId,
        amount: depositRequired,
        method: 'DEMO_PROVIDER',
      });
      throw new BadRequestException('Payment transaction failed. Please check your payment details or try a different method.');
    }

    // Handle pending payment
    if (dto.status === 'pending') {
      const paymentId = this.db.generateId('pay-deposit');
      this.db.eventWorkflowPayments.push({
        paymentId,
        eventId: request.eventId,
        requestId: request.requestId,
        clientId: request.clientId,
        organizerId: request.organizerId,
        amount: depositRequired,
        status: 'pending' as const,
        paymentDate: now.toISOString().slice(0, 10),
        paymentMethod: 'DEMO_PROVIDER' as const,
        createdAt: now,
        updatedAt: now,
      });
      request.paymentStatus = 'deposit_pending';
      request.updatedAt = now;
      this.addAudit(request, 'Deposit Payment Pending via Demo Provider', userId, role, {
        paymentId,
        amount: depositRequired,
        method: 'DEMO_PROVIDER',
      });
      return {
        success: true,
        simulated: true,
        message: 'Deposit payment is pending verification',
        data: {
          bookingId: `BKG-${request.requestId.toUpperCase()}`,
          paymentId,
          amountPaid: 0,
          outstandingBalance: totalAmount,
          totalAmount,
          paymentStatus: request.paymentStatus,
          bookingStatus: request.status,
          receipt: null,
        },
      };
    }

    const paymentId = this.db.generateId('pay-deposit');
    const payment = {
      paymentId,
      eventId: request.eventId,
      requestId: request.requestId,
      clientId: request.clientId,
      organizerId: request.organizerId,
      amount: depositRequired,
      status: 'completed' as const,
      paymentDate: now.toISOString().slice(0, 10),
      paymentMethod: 'DEMO_PROVIDER' as const,
      createdAt: now,
      updatedAt: now,
    };
    const previousPaymentStatus = request.paymentStatus;
    request.paymentStatus = 'deposit_paid';
    try {
      if (request.status !== 'confirmed' && approvedPlan) this.confirmBooking(requestId, {}, UserRole.EVENT_ORGANIZER, request.organizerId);
    } catch (error) {
      request.paymentStatus = previousPaymentStatus;
      throw error;
    }
    payment.eventId = request.eventId;
    this.db.eventWorkflowPayments.push(payment);
    if (depositRequired >= totalAmount) request.paymentStatus = 'fully_paid';
    request.updatedAt = now;

    this.addAudit(request, 'Deposit Payment Verified via Demo Provider', userId, role, {
      paymentId,
      amount: depositRequired,
      method: 'DEMO_PROVIDER',
    });

    const outstandingBalance = Math.max(0, totalAmount - depositRequired);
    const bookingId = request.eventId ? `BKG-${request.eventId.toUpperCase()}` : `BKG-${request.requestId.toUpperCase()}`;

    return {
      success: true,
      simulated: true,
      message: 'Demo deposit payment verified successfully',
      data: {
        bookingId,
        paymentId,
        amountPaid: depositRequired,
        outstandingBalance,
        totalAmount,
        paymentStatus: request.paymentStatus,
        bookingStatus: request.status,
        eventId: request.eventId,
        receipt: {
          receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
          bookingId,
          date: now.toISOString(),
          paymentMethod: 'DEMO PAYMENT PROVIDER · SIMULATED TRANSACTION',
          amountPaid: depositRequired,
          outstandingBalance,
        },
      },
    };
  }

  /**
   * Request modification for a confirmed event
   */
  requestModification(requestId: string, dto: RequestEventModificationDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (request.eventId || ['confirmed', 'ongoing', 'completed'].includes(request.status)) {
      throw new BadRequestException('Booked event details cannot be edited');
    }
    if (!['confirmed', 'planning', 'ongoing'].includes(request.status) && !request.eventId) {
      throw new BadRequestException('Modifications can only be requested for confirmed bookings');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason is mandatory when requesting an event update');
    }

    const requesterRole = role === UserRole.CLIENT ? 'client' : 'organizer';
    const oldCapacity = Number(request.capacity) || 1;
    const newCapacity = dto.capacity !== undefined ? Number(dto.capacity) : oldCapacity;
    const oldBudget = Number(request.budget) || 0;

    let recalculatedCost = dto.budget !== undefined ? Number(dto.budget) : oldBudget;
    if (newCapacity !== oldCapacity && oldCapacity > 0 && oldBudget > 0) {
      recalculatedCost = Math.round((oldBudget / oldCapacity) * newCapacity);
    }

    const modId = this.db.generateId('mod');
    const now = new Date();
    const modification = {
      id: modId,
      requesterRole: requesterRole as 'client' | 'organizer',
      requesterName: requesterRole === 'client' ? 'Client' : 'Organizer',
      requesterId: userId,
      timestamp: now,
      oldValues: {
        date: request.eventDate,
        venue: request.venue,
        capacity: request.capacity,
        budget: request.budget,
        requirements: request.requirements,
      },
      newValues: {
        date: dto.date || request.eventDate,
        venue: dto.venue !== undefined ? dto.venue : request.venue,
        capacity: newCapacity,
        budget: recalculatedCost,
        requirements: dto.requirements !== undefined ? dto.requirements : request.requirements,
      },
      recalculatedCost,
      reason: dto.reason.trim(),
      status: 'pending_approval' as const,
    };

    request.eventModifications = request.eventModifications || [];
    request.eventModifications.push(modification);
    request.updatedAt = now;

    this.addAudit(request, `Event Update Requested by ${requesterRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
      modId,
      changes: modification.newValues,
      reason: dto.reason,
    });

    return {
      success: true,
      message: 'Event modification request submitted and awaiting approval',
      data: modification,
    };
  }

  /**
   * Approve or reject a confirmed event modification
   */
  respondToModification(requestId: string, modId: string, dto: RespondToEventModificationDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (request.eventId || ['confirmed', 'ongoing', 'completed'].includes(request.status)) {
      throw new BadRequestException('Booked event details cannot be edited');
    }
    const mod = (request.eventModifications || []).find((m: any) => m.id === modId);
    if (!mod) {
      throw new NotFoundException(`Modification request ${modId} not found`);
    }
    if (mod.status !== 'pending_approval') {
      throw new BadRequestException(`Modification request is already ${mod.status}`);
    }

    const responderRole = role === UserRole.CLIENT ? 'client' : 'organizer';
    if (mod.requesterRole === responderRole) {
      throw new ForbiddenException('You cannot approve or reject your own modification request');
    }

    const now = new Date();
    if (dto.action === 'approve') {
      mod.status = 'approved';
      mod.approvedAt = now;
      mod.approvedBy = userId;

      if (mod.newValues.date) request.eventDate = mod.newValues.date;
      if (mod.newValues.venue !== undefined) request.venue = mod.newValues.venue;
      if (mod.newValues.capacity !== undefined) request.capacity = mod.newValues.capacity;
      if (mod.newValues.requirements !== undefined) request.requirements = mod.newValues.requirements;
      if (mod.recalculatedCost) request.budget = mod.recalculatedCost;

      if (request.eventId) {
        const event = this.db.events.find(e => e.eventId === request.eventId);
        if (event) {
          if (mod.newValues.date) event.date = mod.newValues.date;
          if (mod.newValues.venue !== undefined) event.location = mod.newValues.venue;
          if (mod.newValues.capacity !== undefined) event.capacity = mod.newValues.capacity;
          if (mod.newValues.requirements !== undefined) event.description = mod.newValues.requirements;
          event.updatedAt = now;
        }
      }

      request.updatedAt = now;
      this.addAudit(request, `Event Modification Approved by ${responderRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
        modId,
        approvedValues: mod.newValues,
      });
    } else {
      mod.status = 'rejected';
      mod.rejectionReason = dto.reason?.trim() || 'Modification declined by other party';
      request.updatedAt = now;

      this.addAudit(request, `Event Modification Rejected by ${responderRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
        modId,
        reason: mod.rejectionReason,
      });
    }

    return {
      success: true,
      message: `Modification ${dto.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: request,
    };
  }

  /**
   * Generic status updater (backward compatibility)
   */
  updateStatus(requestId: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId?: string): any {
    if (dto.status === 'under_review') {
      return this.startReview(requestId, role, userId);
    }
    throw new BadRequestException('Use the dedicated request workflow action for this status transition');
  }

  /**
   * Preview the cancellation terms for an event request.
   *
   * Rules:
   *  - Pre-booking requests (not confirmed): no payment taken, so the
   *    appropriate action is a withdrawal (no fee). canCancel=true as long as
   *    the request is not already in a terminal state.
   *  - Confirmed / deposit-paid requests: the 10% policy fee applies to any
   *    payments actually recorded in the payments table. Minimum-notice window
   *    is checked against the scheduled event date on the linked event (if any).
   */
  requestCancellationPreview(requestId: string, role: UserRole, userId?: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_ORGANIZER) {
      throw new ForbiddenException('Only clients and authorized organizers can view cancellation previews');
    }

    const request = this.findOne(requestId, role, userId);
    const policy = getEventPolicy();
    const { minimumNoticeDays, feePercent } = policy.cancellation;

    // Already in terminal state
    const terminal = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'];
    if (terminal.includes(request.status)) {
      return {
        success: true,
        data: {
          requestId,
          eventName: request.eventName,
          status: request.status,
          canCancel: false,
          unavailableReason: `Request is already ${request.status}.`,
          paidAmount: 0,
          cancellationFeePercent: feePercent,
          cancellationFee: 0,
          refundAmount: 0,
          minimumNoticeDays,
          isConfirmed: false,
          policy,
        },
      };
    }

    // Check for duplicate cancellation record on the request itself
    if ((request as any).cancellation) {
      return {
        success: true,
        data: {
          requestId,
          eventName: request.eventName,
          status: request.status,
          canCancel: false,
          unavailableReason: 'A cancellation has already been recorded for this request.',
          paidAmount: 0,
          cancellationFeePercent: feePercent,
          cancellationFee: 0,
          refundAmount: 0,
          minimumNoticeDays,
          isConfirmed: false,
          policy,
        },
      };
    }

    const isConfirmed = request.status === 'confirmed';

    // Organizers cannot cancel unconfirmed requests using booking cancellation
    if (role === UserRole.EVENT_ORGANIZER && !isConfirmed) {
      return {
        success: true,
        data: {
          requestId,
          eventName: request.eventName,
          status: request.status,
          canCancel: false,
          unavailableReason: 'Booking cancellation is only available for confirmed bookings. For unconfirmed requests, use the rejection workflow.',
          paidAmount: 0,
          cancellationFeePercent: feePercent,
          cancellationFee: 0,
          refundAmount: 0,
          minimumNoticeDays,
          isConfirmed: false,
          policy,
        },
      };
    }

    // Sum up actual payments for this request
    const workflowPayments = completedEventPayments(this.db.eventWorkflowPayments, request);
    const legacyPayments = this.db.payments.filter(
      (p: any) =>
        p.requestId === requestId ||
        p.requestId === request.requestId ||
        (request.eventId && p.eventId === request.eventId),
    );
    const relatedPayments = workflowPayments.length ? workflowPayments : legacyPayments;
    const paidPaise = relatedPayments
      .filter((p: any) => ['completed', 'success', 'paid'].includes(String(p.status).toLowerCase()))
      .reduce((sum: number, p: any) => sum + Math.round((p.amount || 0) * 100), 0);

    const cancellationFeePaise = Math.round(paidPaise * feePercent / 100);
    const refundPaise = paidPaise - cancellationFeePaise;

    // For confirmed events check minimum notice against the event date
    let cancellationDeadline: string | null = null;
    let canCancel = true;
    let unavailableReason = '';

    if (isConfirmed && request.eventDate) {
      const eventStart = new Date(`${request.eventDate}T00:00:00`);
      const deadline = new Date(eventStart.getTime() - minimumNoticeDays * 86400000);
      cancellationDeadline = deadline.toISOString();
      if (new Date() > deadline) {
        canCancel = false;
        unavailableReason = `Cancellation window closed. At least ${minimumNoticeDays} days notice is required before the event date.`;
      }
    }

    const data: any = {
      requestId,
      eventName: request.eventName,
      status: request.status,
      canCancel,
      unavailableReason: canCancel ? '' : unavailableReason,
      cancellationDeadline,
      minimumNoticeDays,
      isConfirmed,
      paidAmount: paidPaise / 100,
      cancellationFeePercent: feePercent,
      cancellationFee: cancellationFeePaise / 100,
      refundAmount: refundPaise / 100,
      refundProcessingTimeline: paidPaise > 0
        ? '5–7 business days (pending review)'
        : 'Not applicable — no payment has been charged yet',
      policy,
    };

    return { success: true, data };
  }

  /**
   * Cancel an event request on behalf of the client or organizer.
   *
   * For pre-booking requests:  records a withdrawal (no fee).
   * For confirmed requests:    enforces notice window + 10% fee.
   * In both cases the reason, timestamp, and policy version are persisted.
   */
  cancelRequest(
    requestId: string,
    dto: { reason: string; explanation?: string; expectedPaidAmount?: number; policyAccepted?: boolean; acceptedPolicyVersion?: string },
    role: UserRole,
    userId?: string,
  ): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_ORGANIZER) {
      throw new ForbiddenException('Only clients and authorized organizers can cancel event requests');
    }

    const request = this.findOne(requestId, role, userId);

    // Duplicate-cancellation guard
    if ((request as any).cancellation) {
      throw new ConflictException('A cancellation has already been recorded for this request.');
    }

    const terminal = ['cancelled', 'withdrawn', 'rejected', 'expired', 'completed'];
    if (terminal.includes(request.status)) {
      throw new BadRequestException(`Cannot cancel a request that is already ${request.status}.`);
    }

    const isConfirmed = request.status === 'confirmed';

    // Organizers cannot cancel unconfirmed requests using booking cancellation
    if (role === UserRole.EVENT_ORGANIZER && !isConfirmed) {
      throw new BadRequestException('Booking cancellation is only available for confirmed bookings. For unconfirmed requests, use the rejection workflow.');
    }

    const reason = String(dto.reason || '').trim();
    if (!reason || reason.length < 3) {
      throw new BadRequestException('A cancellation reason is required (minimum 3 characters).');
    }

    const preview = this.requestCancellationPreview(requestId, role, userId);
    const previewData = preview.data || preview;

    if (!previewData.canCancel) {
      throw new BadRequestException(previewData.unavailableReason || 'Cancellation is not permitted at this time.');
    }

    // Verify expectedPaidAmount hasn't changed (idempotency guard)
    if (dto.expectedPaidAmount !== undefined) {
      const roundedExpected = Math.round(Number(dto.expectedPaidAmount) * 100);
      const roundedActual   = Math.round(previewData.paidAmount * 100);
      if (roundedExpected !== roundedActual) {
        throw new ConflictException(
          'The amount paid has changed since you previewed the cancellation. ' +
          'Please review the updated cancellation fee and refund amount before confirming.',
        );
      }
    }

    const now = new Date();
    const policy = getEventPolicy();

    // Related payments
    const workflowPayments = completedEventPayments(this.db.eventWorkflowPayments, request);
    const legacyPayments = this.db.payments.filter(
      (p: any) =>
        p.requestId === requestId ||
        p.requestId === request.requestId ||
        (request.eventId && p.eventId === request.eventId),
    );
    const relatedPayments = workflowPayments.length ? workflowPayments : legacyPayments;

    // Build cancellation record
    const cancellationRecord: any = {
      reason,
      explanation: dto.explanation || '',
      cancelledBy: userId!,
      cancelledAt: now,
      policyVersion: dto.acceptedPolicyVersion || policy.version,
      paidAmount: previewData.paidAmount,
      cancellationFeePercent: previewData.cancellationFeePercent,
      cancellationFee: previewData.cancellationFee,
      refundAmount: previewData.refundAmount,
      refundStatus: previewData.paidAmount > 0 ? 'pending' : 'not_applicable',
      isConfirmed,
    };

    if (isConfirmed) {
      // Full confirmed-booking cancellation
      request.status = 'cancelled';
      request.cancellation = cancellationRecord;
      const auditAction = role === UserRole.EVENT_ORGANIZER ? 'Event Booking Cancelled by Organizer' : 'Request Cancelled by Client';
      this.addAudit(request, auditAction, userId, role, {
        reason,
        explanation: dto.explanation,
        cancellationFee: cancellationRecord.cancellationFee,
        refundAmount: cancellationRecord.refundAmount,
      });

      // If linked event exists, cancel event and sync cancellation details
      if (request.eventId) {
        const event = this.db.events.find((e: any) => e.eventId === request.eventId || e.id === request.eventId);
        if (event) {
          event.status = 'cancelled';
          event.cancellation = cancellationRecord;
          (event as any).cancellationReason = reason;
          event.updatedAt = now;
        }
      }

      // If refund is applicable, create refund records
      if (previewData.refundAmount > 0) {
        const refundId = this.db.generateId('ref');
        cancellationRecord.refundId = refundId;
        const payment: any = relatedPayments.find((p: any) => ['completed', 'success', 'paid'].includes(String(p.status).toLowerCase()));
        const paymentId = payment ? (payment.paymentId || payment.id) : 'mock-pay';
        if (this.db.eventWorkflowRefunds) {
          this.db.eventWorkflowRefunds.push({
            refundId,
            paymentId,
            requestId: request.requestId,
            eventId: request.eventId || '',
            clientId: request.clientId,
            organizerId: request.organizerId,
            paidAmount: previewData.paidAmount,
            cancellationFee: previewData.cancellationFee,
            amount: previewData.refundAmount,
            reason,
            status: 'pending',
            requestedAt: now,
          });
        }
      }

      // Notify party
      if (role === UserRole.EVENT_ORGANIZER) {
        this.notifyRequestClient(
          request,
          `The organizer cancelled the confirmed event booking "${request.eventName}": ${reason}`,
          'booking_cancelled',
        );
      } else {
        this.notifyRequestOrganizer(
          request,
          `Client cancelled the confirmed event request "${request.eventName}". Reason: ${reason}`,
          'request_cancelled',
        );
      }
    } else {
      // Pre-booking: treat as a withdrawal (no fee)
      request.status = 'withdrawn';
      request.withdrawalReason = reason;
      request.cancellation = cancellationRecord; // preserved for history
      this.addAudit(request, 'Request Withdrawn by Client', userId, role, {
        reason, note: 'No payment had been charged at the time of withdrawal.',
      });

      this.notifyRequestOrganizer(
        request,
        `Client withdrew the event request "${request.eventName}". Reason: ${reason}`,
        'request_withdrawn',
      );
    }

    request.updatedAt = now;

    const message = isConfirmed
      ? `Event booking cancelled. ${previewData.refundAmount > 0 ? `Refund of ₹${previewData.refundAmount.toFixed(2)} is pending review.` : 'No refund is applicable.'}`
      : 'Event request withdrawn successfully.';

    return {
      success: true,
      message,
      data: {
        request,
        cancellation: cancellationRecord,
      },
    };
  }

  async getDocument(
    requestId: string,
    role: UserRole,
    userId?: string,
    version?: number,
  ): Promise<{ stream: ReturnType<typeof createReadStream>; fileName: string; mimeType: string }> {
    const request = this.db.eventRequests.find(r => r.requestId === requestId || (r as any).id === requestId);
    if (!request) {
      throw new NotFoundException(`Event request ${requestId} not found`);
    }

    // Role-based authorization
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      if (!client || client.clientId !== request.clientId) {
        throw new ForbiddenException('You are not authorized to access documents for this request');
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      if (!organizer || organizer.organizerId !== request.organizerId) {
        throw new ForbiddenException('You are not authorized to access documents for this request');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    let fileNameOnDisk: string | undefined;
    let originalName: string | undefined;

    // Check specific version if requested
    if (version !== undefined && request.proposals) {
      const prop = request.proposals.find(p => p.version === Number(version));
      if (prop?.documentFileName) {
        fileNameOnDisk = prop.documentFileName;
        originalName = prop.documentName;
      }
    }

    // Check proposals from newest to oldest
    if (!fileNameOnDisk && request.proposals) {
      const sortedProps = [...request.proposals].reverse();
      const propWithDoc = sortedProps.find(p => p.documentFileName);
      if (propWithDoc) {
        fileNameOnDisk = propWithDoc.documentFileName;
        originalName = propWithDoc.documentName;
      }
    }

    // Check active plan or plans linked to request
    if (!fileNameOnDisk) {
      let plan: any;
      if (request.activeEventPlanId) {
        plan = this.db.eventPlans.find(p => p.eventPlanId === request.activeEventPlanId);
      }
      if (!plan) {
        const reqPlans = this.db.eventPlans.filter(p => p.requestId === request.requestId);
        if (reqPlans.length > 0) {
          reqPlans.sort((a, b) => (b.revision || 0) - (a.revision || 0));
          plan = reqPlans[0];
        }
      }
      if (plan?.documentFileName) {
        fileNameOnDisk = plan.documentFileName;
        originalName = plan.documentName;
      }
    }

    if (!fileNameOnDisk) {
      throw new NotFoundException('No event plan document is attached to this request');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'event-plans');
    const filePath = path.join(uploadDir, path.basename(fileNameOnDisk));

    if (!existsSync(filePath)) {
      throw new NotFoundException('Event plan document file is unavailable');
    }

    await access(filePath, constants.R_OK);
    return {
      stream: createReadStream(filePath),
      fileName: originalName || 'event-plan.pdf',
      mimeType: 'application/pdf',
    };
  }
}

