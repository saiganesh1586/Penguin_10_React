import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min, Max, IsBoolean, IsIn, IsDateString,
} from 'class-validator';
import { EVENTFLOW_NUMERIC_LIMITS } from '../../../common/validation-rules';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventPolicyAcknowledgementDto } from '../../../common/event-policy';

export class CreateEventRequestDto extends EventPolicyAcknowledgementDto {
  @ApiProperty({ description: 'Client ID', example: 'cli-001' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ description: 'Organizer ID to send request to', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiProperty({ description: 'Event name', example: 'Annual Company Gala' })
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @ApiProperty({ description: 'Event type/category', example: 'Corporate Events' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ description: 'Desired event date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ description: 'Preferred event start time', example: '18:00' })
  @IsString()
  @IsOptional()
  eventTime?: string;

  @ApiProperty({ description: 'Budget in INR', example: 50000 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Event budget can have at most 2 decimal places' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Event budget must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Event budget cannot exceed ₹1,00,00,000' })
  budget!: number;

  @ApiPropertyOptional({ description: 'Ticket price per attendee in INR; 0 means free admission', example: 499.5, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Ticket price can have at most 2 decimal places' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.MIN, { message: 'Ticket price cannot be negative' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.TICKET_PRICE.MAX, { message: 'Ticket price cannot exceed ₹1,00,000' })
  @IsOptional()
  ticketPrice?: number;

  @ApiPropertyOptional({ description: 'Public events allow direct registration; private events require organizer approval before payment', enum: ['public', 'private'], default: 'public' })
  @IsIn(['public', 'private'])
  @IsOptional()
  visibility?: 'public' | 'private';

  @ApiProperty({ description: 'Expected capacity', example: 200 })
  @IsInt({ message: 'Event capacity must be a whole number' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN, { message: 'Event capacity must be at least 1 guest' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX, { message: 'Maximum event capacity is 50,000' })
  capacity!: number;

  @ApiPropertyOptional({ description: 'Preferred event city', example: 'Bangalore' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Whether the requested date is flexible', enum: ['exact', 'flexible'] })
  @IsString()
  @IsIn(['exact', 'flexible'])
  @IsOptional()
  dateFlexibility?: 'exact' | 'flexible';

  @ApiPropertyOptional({ description: 'Special requirements', example: 'Need catering and live band' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Additional client notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Preferred venue' })
  @IsString()
  @IsOptional()
  venue?: string;
}

export class UpdateEventRequestStatusDto {
  @ApiProperty({
    description: 'The only generic status transition supported; use dedicated workflow actions for all others',
    enum: ['under_review'],
    example: 'under_review',
  })
  @IsIn(['under_review'])
  @IsNotEmpty()
  status!: 'under_review';
}

export class RequestMissingInfoDto {
  @ApiProperty({ description: 'Query / question requesting missing information from the client', example: 'Could you specify the preferred AV equipment and catering dietary preferences?' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class ProvideMissingInfoDto {
  @ApiProperty({ description: 'Client response to the missing info request', example: 'We require 3 wireless microphones, 4K projector, and 20% vegetarian meals.' })
  @IsString()
  @IsNotEmpty()
  response!: string;
}

export class SendProposalDto {
  @ApiProperty({ description: 'Total proposed amount in INR', example: 60000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Proposed amount must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Proposed amount cannot exceed ₹1,00,00,000' })
  amount!: number;

  @ApiProperty({ description: 'Required deposit amount in INR', example: 15000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Deposit required cannot be negative' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Deposit required cannot exceed ₹1,00,00,000' })
  depositRequired!: number;

  @ApiPropertyOptional({ description: 'Proposed event date if different (YYYY-MM-DD)', example: '2026-09-05' })
  @IsString()
  @IsOptional()
  proposedDate?: string;

  @ApiProperty({ description: 'Proposal validity expiration date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsString()
  @IsNotEmpty()
  validUntil!: string;

  @ApiPropertyOptional({ description: 'Terms and conditions / deliverables', example: 'Includes full day hall rental, standard audio setup, and buffet catering.' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the client', example: 'Deposit required within 7 days of agreement to lock the venue.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Event plan and execution details' })
  @IsString()
  @IsOptional()
  eventPlan?: string;

  @ApiPropertyOptional({ description: 'Execution timeline' })
  @IsString()
  @IsOptional()
  timeline?: string;

  @ApiPropertyOptional({ description: 'Organizer management fee in INR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Organizer fee cannot be negative' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Organizer fee cannot exceed ₹1,00,00,000' })
  @IsOptional()
  organizerFee?: number;

  @ApiPropertyOptional({ description: 'Itemized costs description or breakdown' })
  @IsString()
  @IsOptional()
  itemizedCosts?: string;

  @ApiPropertyOptional({ description: 'Taxes in INR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Taxes cannot be negative' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Taxes cannot exceed ₹1,00,00,000' })
  @IsOptional()
  taxes?: number;

  @ApiPropertyOptional({ description: 'Included services' })
  @IsString()
  @IsOptional()
  includedServices?: string;

  @ApiPropertyOptional({ description: 'Excluded services' })
  @IsString()
  @IsOptional()
  excludedServices?: string;

  @ApiPropertyOptional({ description: 'Attendee capacity limit' })
  @IsInt({ message: 'Attendee capacity must be a whole number' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN, { message: 'Attendee capacity must be at least 1 guest' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX, { message: 'Maximum event capacity is 50,000' })
  @IsOptional()
  attendeeCapacity?: number;

  @ApiPropertyOptional({ description: 'Venue, resource, and budget constraints' })
  @IsString()
  @IsOptional()
  constraints?: string;

  @ApiPropertyOptional({ description: 'Payment schedule and terms' })
  @IsString()
  @IsOptional()
  paymentSchedule?: string;

  @ApiPropertyOptional({ description: 'Cancellation deadline and refund terms' })
  @IsString()
  @IsOptional()
  cancellationTerms?: string;

  @ApiPropertyOptional({ description: 'Additional conditions' })
  @IsString()
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Attached plan/proposal original filename' })
  @IsString()
  @IsOptional()
  documentName?: string;

  @ApiPropertyOptional({ description: 'Attached plan/proposal stored filename' })
  @IsString()
  @IsOptional()
  documentFileName?: string;

  @ApiPropertyOptional({ description: 'Attached plan/proposal document size in bytes' })
  @IsNumber()
  @IsOptional()
  documentSize?: number;

  @ApiPropertyOptional({ description: 'Attached plan/proposal document MIME type' })
  @IsString()
  @IsOptional()
  documentType?: string;
}

export class ReviseProposalDto extends SendProposalDto {
  @ApiPropertyOptional({ description: 'Reason for proposal revision', example: 'Adjusted catering options and reduced deposit per client request.' })
  @IsString()
  @IsOptional()
  revisionReason?: string;
}

export class RejectRequestDto {
  @IsBoolean()
  @IsOptional()
  policyAccepted?: boolean;

  @IsString()
  @IsOptional()
  acceptedPolicyVersion?: string;

  @ApiProperty({ description: 'Reason for a permanent rejection or requested change', example: 'The requested date is unavailable.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ enum: ['budget', 'date', 'both', 'other', 'permanent'] })
  @IsEnum(['budget', 'date', 'both', 'other', 'permanent'])
  @IsOptional()
  reasonType?: 'budget' | 'date' | 'both' | 'other' | 'permanent';

  @ApiPropertyOptional({ description: 'Proposed budget when requesting a budget change' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Proposed budget must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Proposed budget cannot exceed ₹1,00,00,000' })
  @IsOptional()
  proposedBudget?: number;

  @ApiPropertyOptional({ description: 'Proposed date when requesting a date change' })
  @IsString()
  @IsOptional()
  @IsDateString()
  proposedDate?: string;

  @ApiPropertyOptional({ description: 'Optional additional comments or context for rejection' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class ClientResponseDto {
  @ApiProperty({
    description: 'Client decision on the proposal or request',
    enum: ['accept', 'request_revision', 'reject', 'withdraw', 'accept_changes', 'reject_changes', 'counteroffer'],
    example: 'accept',
  })
  @IsEnum(['accept', 'request_revision', 'reject', 'withdraw', 'accept_changes', 'reject_changes', 'counteroffer'])
  @IsNotEmpty()
  decision!: 'accept' | 'request_revision' | 'reject' | 'withdraw' | 'accept_changes' | 'reject_changes' | 'counteroffer';

  @ApiPropertyOptional({ description: 'Feedback or notes from the client', example: 'We accept the proposal terms and are ready to sign agreement.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Client counteroffer budget' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Counteroffer budget must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Counteroffer budget cannot exceed ₹1,00,00,000' })
  @IsOptional()
  counterofferBudget?: number;

  @ApiPropertyOptional({ description: 'Client counteroffer date' })
  @IsString()
  @IsOptional()
  @IsDateString()
  counterofferDate?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event title' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  counterofferEventName?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event type' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  counterofferEventType?: string;

  @ApiPropertyOptional({ description: 'Counteroffer guest capacity' })
  @IsInt({ message: 'Event capacity must be a whole number' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN, { message: 'Event capacity must be at least 1 guest' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX, { message: 'Maximum event capacity is 50,000' })
  @IsOptional()
  counterofferCapacity?: number;

  @ApiPropertyOptional({ description: 'Counteroffer preferred venue' })
  @IsString()
  @IsOptional()
  counterofferVenue?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event requirements' })
  @IsString()
  @IsOptional()
  counterofferRequirements?: string;

  @ApiPropertyOptional({ description: 'Counteroffer advance deposit required' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  counterofferDeposit?: number;

  @ApiPropertyOptional({ description: 'Counteroffer services' })
  @IsString()
  @IsOptional()
  counterofferServices?: string;

  @ApiPropertyOptional({ description: 'Counteroffer deliverables' })
  @IsString()
  @IsOptional()
  counterofferDeliverables?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event plan' })
  @IsString()
  @IsOptional()
  counterofferEventPlan?: string;

  @ApiPropertyOptional({ description: 'Counteroffer timeline' })
  @IsString()
  @IsOptional()
  counterofferTimeline?: string;

  @ApiPropertyOptional({ description: 'Counteroffer payment terms' })
  @IsString()
  @IsOptional()
  counterofferPaymentTerms?: string;

  @ApiPropertyOptional({ description: 'Counteroffer cancellation terms' })
  @IsString()
  @IsOptional()
  counterofferCancellationTerms?: string;

  @ApiPropertyOptional({ description: 'Counteroffer valid until date' })
  @IsString()
  @IsOptional()
  counterofferValidUntil?: string;
}

export class UpdateAgreementStatusDto {
  @ApiProperty({
    description: 'Agreement status',
    enum: ['not_sent', 'pending_signature', 'agreed', 'declined'],
    example: 'agreed',
  })
  @IsEnum(['not_sent', 'pending_signature', 'agreed', 'declined'])
  @IsNotEmpty()
  agreementStatus!: 'not_sent' | 'pending_signature' | 'agreed' | 'declined';
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Deposit / Payment status',
    enum: ['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded'],
    example: 'deposit_paid',
  })
  @IsEnum(['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded'])
  @IsNotEmpty()
  paymentStatus!: 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
}

export class ConfirmBookingDto {
}

export class PayDepositDto {
  @ApiPropertyOptional({ description: 'Payment method', example: 'DEMO_PROVIDER' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Simulated payment outcome or status', example: 'completed' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Payment method details', example: 'UPI' })
  @IsString()
  @IsOptional()
  methodDetails?: string;

  @ApiPropertyOptional({ description: 'Simulate payment failure', example: false })
  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean;
}

export class RequestEventModificationDto {
  @ApiPropertyOptional({ description: 'New proposed event date' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'New proposed venue' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ description: 'New expected attendee count' })
  @IsInt({ message: 'Event capacity must be a whole number' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN, { message: 'Event capacity must be at least 1 guest' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX, { message: 'Maximum event capacity is 50,000' })
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'New budget' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Event budget must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Event budget cannot exceed ₹1,00,00,000' })
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ description: 'New or updated requirements/services' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Updated services' })
  @IsString()
  @IsOptional()
  services?: string;

  @ApiProperty({ description: 'Reason for the requested changes' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RespondToEventModificationDto {
  @ApiProperty({ description: 'Approval decision', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'])
  @IsNotEmpty()
  action!: 'approve' | 'reject';

  @ApiPropertyOptional({ description: 'Reason for rejection or approval note' })
  @IsString()
  @IsOptional()
  reason?: string;
}
