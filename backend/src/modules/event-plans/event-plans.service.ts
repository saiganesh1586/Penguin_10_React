import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { constants, createReadStream, existsSync, readFileSync, unlinkSync } from 'fs';
import { access } from 'fs/promises';
import * as path from 'path';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
import { assertEventPolicyAccepted, getEventPolicy } from '../../common/event-policy';
import { acceptedProposalFor } from '../../common/utils/accepted-proposal';
const EVENT_PLAN_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-plans');
@Injectable()
export class EventPlansService {
  private db: DataStore;
  constructor() {
    this.db = DataStore.getInstance();
  }
  uploadDocument(
    requestId: string,
    file: Express.Multer.File,
    role: UserRole,
    userId?: string
  ): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      this.removeUploadedFile(file.path);
      throw new ForbiddenException('Only event organizers can upload event plan PDFs');
    }
    const request = this.db.eventRequests.find(item => item.requestId === requestId);
    if (!request) {
      this.removeUploadedFile(file.path);
      throw new NotFoundException(`Event request ${requestId} not found`);
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(item => item.userId === userId);
      if (!organizer || organizer.organizerId !== request.organizerId) {
        this.removeUploadedFile(file.path);
        throw new ForbiddenException('You can only upload plans for your own event requests');
      }
    }
    if (!['planning', 'plan_revision_requested'].includes(request.status)) {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('The event request must be accepted before uploading a plan');
    }
    const signature = readFileSync(file.path).subarray(0, 5).toString('ascii');
    if (signature !== '%PDF-') {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('The uploaded file is not a valid PDF');
    }
    if (request.pendingPlanDocument?.fileName) {
      this.removeUploadedFile(
        path.join(EVENT_PLAN_UPLOAD_DIR, request.pendingPlanDocument.fileName)
      );
    }
    request.pendingPlanDocument = {
      originalName: path.basename(file.originalname),
      fileName: file.filename,
      size: file.size,
    };
    return {
      success: true,
      message: 'Event plan PDF uploaded',
      data: request.pendingPlanDocument,
    };
  }
  create(dto: CreateEventPlanDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only event organizers can submit event plans');
    }
    if (!dto.requestId) return this.createStandalonePlan(dto, role, userId);
    const request = this.db.eventRequests.find(
      eventRequest => eventRequest.requestId === dto.requestId
    );
    if (!request) throw new NotFoundException(`Event request ${dto.requestId} not found`);
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== request.organizerId) {
        throw new ForbiddenException('You can only submit plans for your own event requests');
      }
    }
    if (!['planning', 'plan_revision_requested'].includes(request.status)) {
      throw new BadRequestException(
        'The request must be accepted and its budget/date agreed before submitting a plan'
      );
    }
    if (!request.pendingPlanDocument) {
      throw new BadRequestException('Upload a PDF event plan before submitting it to the client');
    }
    const pendingFilePath = path.join(
      EVENT_PLAN_UPLOAD_DIR,
      path.basename(request.pendingPlanDocument.fileName)
    );
    if (!existsSync(pendingFilePath)) {
      delete request.pendingPlanDocument;
      throw new BadRequestException(
        'The uploaded event plan PDF is unavailable. Upload it again before submitting.'
      );
    }
    if (Number(dto.budget) !== Number(request.budget)) {
      throw new BadRequestException('The plan budget must match the agreed event budget');
    }
    if (dto.capacity !== request.capacity) {
      throw new BadRequestException('The plan capacity must match the event request');
    }
    const schedule = dto.schedule?.trim();
    const services = dto.services?.trim();
    const arrangements = dto.arrangements?.trim();
    const budgetBreakdown = dto.budgetBreakdown?.trim();
    const previousPlans = this.db.eventPlans.filter(plan => plan.requestId === request.requestId);
    const revision = previousPlans.length + 1;
    previousPlans.forEach(plan => {
      if (plan.approvalStatus === 'revision_requested') plan.status = 'revised';
    });
    const plan = {
      eventPlanId: this.db.generateId('plan'),
      requestId: request.requestId,
      clientId: request.clientId,
      organizerId: request.organizerId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      budget: Number(dto.budget),
      capacity: dto.capacity,
      schedule,
      services,
      arrangements,
      budgetBreakdown,
      documentName: request.pendingPlanDocument.originalName,
      documentFileName: request.pendingPlanDocument.fileName,
      documentSize: request.pendingPlanDocument.size,
      documentType: 'application/pdf',
      uploadedAt: new Date(),
      uploaderId: userId || request.organizerId,
      uploaderName: this.getOrganizerName(request.organizerId, userId),
      revision,
      revisionReason: previousPlans.length ? request.planRevisionReason : undefined,
      status: 'submitted' as const,
      approvalStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventPlans.push(plan);
    delete request.pendingPlanDocument;
    request.activeEventPlanId = plan.eventPlanId;
    request.status = 'plan_submitted';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: `Event Plan Submitted (Revision ${revision})`,
      performedBy: userId || request.organizerId,
      role,
      timestamp: new Date(),
      details: {
        eventPlanId: plan.eventPlanId,
        revision,
      },
    });
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    if (client)
      this.notify(
        client.userId,
        request.eventId,
        `Event plan "${plan.title}" (revision ${revision}) is ready for your review.`,
        'event_plan'
      );
    return {
      success: true,
      message: 'Event plan submitted for client review',
      data: plan,
    };
  }
  private getOrganizerName(organizerId: string, userId?: string): string {
    const organizer = this.db.organizers.find(
      o => o.organizerId === organizerId || o.userId === userId
    );
    if (!organizer) return 'Organizer';
    const user = this.db.findUserById(organizer.userId);
    return user?.name || organizer.businessName || 'Organizer';
  }
  private createStandalonePlan(dto: CreateEventPlanDto, role: UserRole, userId?: string): any {
    const client = this.db.clients.find(
      profile => profile.clientId === dto.clientId || profile.userId === dto.clientId
    );
    if (!client) throw new NotFoundException('Client not found');
    const organizer =
      role === UserRole.EVENT_ORGANIZER
        ? this.db.organizers.find(profile => profile.userId === userId)
        : this.db.organizers.find(
            profile => profile.organizerId === dto.organizerId || profile.userId === dto.organizerId
          );
    if (!organizer) throw new NotFoundException('Organizer not found');
    if (
      role === UserRole.EVENT_ORGANIZER &&
      dto.organizerId &&
      dto.organizerId !== organizer.organizerId &&
      dto.organizerId !== organizer.userId
    ) {
      throw new ForbiddenException('You can only submit plans as your own organizer profile');
    }
    const plan = {
      eventPlanId: this.db.generateId('plan'),
      eventId: dto.eventId,
      clientId: client.clientId,
      organizerId: organizer.organizerId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      budget: Number(dto.budget),
      capacity: dto.capacity,
      schedule: dto.schedule?.trim(),
      services: dto.services?.trim(),
      arrangements: dto.arrangements?.trim(),
      budgetBreakdown: dto.budgetBreakdown?.trim(),
      status: 'submitted' as const,
      approvalStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventPlans.push(plan);
    this.notify(
      client.userId,
      dto.eventId,
      `New event plan "${plan.title}" submitted for your review`,
      'event_plan'
    );
    return {
      success: true,
      message: 'Event plan created',
      data: plan,
    };
  }
  findAll(role: UserRole, userId?: string): any[] {
    let plans: any[] = [];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      if (!client) throw new ForbiddenException('Client profile not found');
      plans = this.db.eventPlans.filter(plan => plan.clientId === client.clientId);
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(
        o => o.userId === userId || o.organizerId === userId
      );
      if (!organizer) throw new ForbiddenException('Organizer profile not found');
      plans = this.db.eventPlans.filter(plan => plan.organizerId === organizer.organizerId);
    } else if (role === UserRole.SUPER_ADMIN) {
      plans = [...this.db.eventPlans];
    } else {
      throw new ForbiddenException('Access denied');
    }
    return plans.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.revision || 0) - (a.revision || 0);
    });
  }
  findOne(planId: string, role: UserRole, userId?: string): any {
    const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
    if (!plan) throw new NotFoundException(`Event plan ${planId} not found`);
    if (role === UserRole.SUPER_ADMIN) return plan;
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      if (!client || client.clientId !== plan.clientId)
        throw new ForbiddenException('Access denied to this event plan');
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(
        o => o.userId === userId || o.organizerId === userId
      );
      if (!organizer || organizer.organizerId !== plan.organizerId)
        throw new ForbiddenException('Access denied to this event plan');
    } else {
      throw new ForbiddenException('Access denied');
    }
    return plan;
  }
  async getDocument(
    planId: string,
    role: UserRole,
    userId?: string
  ): Promise<{
    stream: ReturnType<typeof createReadStream>;
    fileName: string;
  }> {
    let plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
    let request: any;
    if (!plan) {
      // Check if planId is a requestId
      request = this.db.eventRequests.find(
        eventRequest => eventRequest.requestId === planId || (eventRequest as any).id === planId
      );
      if (request) {
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
      }
    } else if (plan?.requestId) {
      request = this.db.eventRequests.find(
        eventRequest => eventRequest.requestId === plan!.requestId
      );
    }

    // Role-based authorization
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      if (!client) throw new ForbiddenException('Client profile not found');
      if (plan && plan.clientId !== client.clientId)
        throw new ForbiddenException('Access denied to this event plan');
      if (request && request.clientId !== client.clientId)
        throw new ForbiddenException('Access denied to this event plan');
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(
        o => o.userId === userId || o.organizerId === userId
      );
      if (!organizer) throw new ForbiddenException('Organizer profile not found');
      if (plan && plan.organizerId !== organizer.organizerId)
        throw new ForbiddenException('Access denied to this event plan');
      if (request && request.organizerId !== organizer.organizerId)
        throw new ForbiddenException('Access denied to this event plan');
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    let fileNameOnDisk = plan?.documentFileName;
    let originalName = plan?.documentName;

    // If still not found and request exists, check proposals
    if (!fileNameOnDisk && request?.proposals) {
      const revProps = [...request.proposals].reverse();
      const propWithDoc = revProps.find((p: any) => p.documentFileName);
      if (propWithDoc) {
        fileNameOnDisk = propWithDoc.documentFileName;
        originalName = propWithDoc.documentName;
      }
    }
    if (!fileNameOnDisk)
      throw new NotFoundException('No PDF document is attached to this event plan');
    const filePath = path.join(EVENT_PLAN_UPLOAD_DIR, path.basename(fileNameOnDisk));
    if (!existsSync(filePath)) throw new NotFoundException('Event plan PDF is unavailable');
    await access(filePath, constants.R_OK);
    return {
      stream: createReadStream(filePath),
      fileName: originalName || 'event-plan.pdf',
    };
  }
  private removeUploadedFile(filePath?: string): void {
    if (filePath && existsSync(filePath)) unlinkSync(filePath);
  }
  updateApproval(
    planId: string,
    dto: UpdateEventPlanApprovalDto,
    role: UserRole,
    userId?: string
  ): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can approve or request changes to event plans');
    }
    const plan = this.findOne(planId, role, userId);
    const request = this.db.eventRequests.find(
      eventRequest => eventRequest.requestId === plan.requestId
    );
    if (!request && !plan.requestId) {
      if (dto.approvalStatus === 'revision_requested') {
        throw new BadRequestException('Plan revisions are only available for request-linked plans');
      }
      plan.approvalStatus = dto.approvalStatus;
      plan.status = dto.approvalStatus === 'approved' ? 'approved' : 'rejected';
      plan.updatedAt = new Date();
      const organizer = this.db.organizers.find(
        profile => profile.organizerId === plan.organizerId
      );
      if (organizer) {
        this.notify(
          organizer.userId,
          plan.eventId,
          `Event plan "${plan.title}" has been ${dto.approvalStatus} by client`,
          `plan_${dto.approvalStatus}`
        );
      }
      return {
        success: true,
        message: `Plan ${dto.approvalStatus}`,
        data: plan,
      };
    }
    if (!request)
      throw new NotFoundException('Event request associated with the plan was not found');
    if (request.activeEventPlanId !== plan.eventPlanId || request.status !== 'plan_submitted') {
      throw new BadRequestException('Only the latest submitted plan can be reviewed');
    }
    if (plan.approvalStatus !== 'pending')
      throw new BadRequestException('This plan has already been reviewed');
    plan.updatedAt = new Date();
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    if (dto.approvalStatus === 'revision_requested') {
      if (!dto.reason?.trim())
        throw new BadRequestException('A reason is required when requesting a new plan');
      plan.approvalStatus = 'revision_requested';
      plan.status = 'revised';
      request.status = 'plan_revision_requested';
      request.planRevisionReason = dto.reason.trim();
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `New Plan Requested (Revision ${plan.revision || 1})`,
        performedBy: userId || request.clientId,
        role,
        timestamp: new Date(),
        details: {
          eventPlanId: plan.eventPlanId,
          reason: dto.reason.trim(),
        },
      });
      const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
      if (organizer)
        this.notify(
          organizer.userId,
          request.eventId,
          `The client requested a new plan for "${request.eventName}": ${dto.reason.trim()}`,
          'plan_revision_requested'
        );
      return {
        success: true,
        message: 'Plan revision requested',
        data: plan,
      };
    }
    if (dto.approvalStatus === 'rejected') {
      if (!dto.reason?.trim()) throw new BadRequestException('A rejection reason is required');
      plan.approvalStatus = 'rejected';
      plan.status = 'rejected';
      request.status = 'rejected';
      request.rejectionReason = dto.reason.trim();
      request.rejectionComments = dto.comments?.trim() || undefined;
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Event Plan Rejected (Revision ${plan.revision || 1})`,
        performedBy: userId || request.clientId,
        role,
        timestamp: new Date(),
        details: {
          eventPlanId: plan.eventPlanId,
          reason: request.rejectionReason,
          comments: request.rejectionComments,
        },
      });
      const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
      if (organizer)
        this.notify(
          organizer.userId,
          request.eventId,
          `The client rejected event plan revision ${plan.revision || 1} for "${
            request.eventName
          }": ${request.rejectionReason}`,
          'plan_rejected'
        );
      const client = this.db.clients.find(c => c.clientId === plan.clientId);
      if (client)
        this.notify(
          client.userId,
          request.eventId,
          `Your rejection of event plan revision ${plan.revision || 1} for "${
            request.eventName
          }" was recorded.`,
          'plan_rejected'
        );
      return {
        success: true,
        message: 'Event plan rejected and request closed',
        data: {
          plan,
          request,
        },
      };
    }
    const acceptedProposal = acceptedProposalFor(request);
    const agreedPolicy =
      acceptedProposal?.cancellationPolicy || request.policySnapshot || getEventPolicy();
    assertEventPolicyAccepted(dto, agreedPolicy);
    request.policySnapshot = structuredClone(agreedPolicy);
    request.clientPolicyAcceptedAt = new Date();
    request.clientPolicyAcceptedBy = userId;
    plan.approvalStatus = 'approved';
    plan.status = 'approved';
    request.status = 'awaiting_client';
    if (['not_sent', 'declined'].includes(request.agreementStatus))
      request.agreementStatus = 'pending_signature';
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: `Final Event Plan Approved (Revision ${
        plan.revision || 1
      }); Awaiting Agreement and Verified Deposit`,
      performedBy: userId || request.clientId,
      role,
      timestamp: new Date(),
      details: {
        eventPlanId: plan.eventPlanId,
        policyVersion: agreedPolicy.version,
      },
    });
    const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
    if (organizer)
      this.notify(
        organizer.userId,
        undefined,
        `The client approved the final plan for "${request.eventName}". Booking awaits the signed agreement and verified deposit.`,
        'plan_approved'
      );
    const client = this.db.clients.find(c => c.clientId === plan.clientId);
    if (client)
      this.notify(
        client.userId,
        undefined,
        `Your final plan for "${request.eventName}" is approved. Review the agreement and complete verified payment before the booking is confirmed.`,
        'plan_approved'
      );
    return {
      success: true,
      message: 'Final plan approved; booking awaits agreement and verified deposit',
      data: {
        plan,
        request,
      },
    };
  }
  private notify(userId: string, eventId: string | undefined, message: string, type: string): void {
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId,
      eventId,
      registrationId: undefined,
      paymentId: undefined,
      message,
      type,
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });
  }
}
