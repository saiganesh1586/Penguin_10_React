import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min, Max,
} from 'class-validator';
import { EVENTFLOW_NUMERIC_LIMITS } from '../../../common/validation-rules';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventPlanDto {
  @ApiPropertyOptional({ description: 'Event request this plan fulfils', example: 'req-001' })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Event ID (if event already created)', example: 'evt-001' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Client ID (derived from the event request)', example: 'cli-001' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Organizer ID (derived from the event request)', example: 'org-001' })
  @IsString()
  @IsOptional()
  organizerId?: string;

  @ApiProperty({ description: 'Plan title', example: 'Tech Conference Full Plan' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Plan description', example: 'Complete event plan including speakers and schedule' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Budget in INR', example: 75000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MIN, { message: 'Plan budget must be at least ₹1,000' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, { message: 'Plan budget cannot exceed ₹1,00,00,000' })
  budget!: number;

  @ApiProperty({ description: 'Capacity', example: 500 })
  @IsInt({ message: 'Plan capacity must be a whole number' })
  @Min(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MIN, { message: 'Plan capacity must be at least 1 guest' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.CAPACITY.MAX, { message: 'Maximum event capacity is 50,000' })
  capacity!: number;

  @ApiPropertyOptional({ description: 'Detailed event schedule' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Services included in the plan' })
  @IsString()
  @IsOptional()
  services?: string;

  @ApiPropertyOptional({ description: 'Venue and event arrangements' })
  @IsString()
  @IsOptional()
  arrangements?: string;

  @ApiPropertyOptional({ description: 'Itemized budget breakdown' })
  @IsString()
  @IsOptional()
  budgetBreakdown?: string;
}

export class UpdateEventPlanApprovalDto {
  @ApiProperty({
    description: 'Approval status',
    enum: ['approved', 'rejected', 'revision_requested'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected', 'revision_requested'])
  @IsNotEmpty()
  approvalStatus!: 'approved' | 'rejected' | 'revision_requested';

  @ApiPropertyOptional({ description: 'Reason for requesting a revised plan' })
  @IsString()
  @IsOptional()
  reason?: string;
}
