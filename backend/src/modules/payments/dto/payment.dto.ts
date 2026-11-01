import { IsString, IsNotEmpty, IsNumber, Min, Max, IsIn } from 'class-validator';
import { EVENTFLOW_NUMERIC_LIMITS } from '../../../common/validation-rules';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Registration ID', example: 'reg-001' })
  @IsString()
  @IsNotEmpty()
  registrationId!: string;

  @ApiProperty({ description: 'Payment amount', example: 99 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Payment amount can have at most 2 decimal places' }
  )
  @Min(0.01, { message: 'Payment amount must be greater than zero' })
  @Max(EVENTFLOW_NUMERIC_LIMITS.BUDGET.MAX, {
    message: 'Payment amount cannot exceed ₹1,00,00,000',
  })
  amount!: number;

  @ApiProperty({
    description: 'Simulated payment provider. No card or bank details are accepted.',
    enum: ['DEMO_PROVIDER'],
    example: 'DEMO_PROVIDER',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['DEMO_PROVIDER'])
  paymentMethod!: string;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)', example: '2024-06-01' })
  @IsString()
  @IsNotEmpty()
  paymentDate!: string;
}

export class CreateEventWorkflowPaymentDto {
  @ApiProperty({
    description: 'Simulated payment provider. No card or bank details are accepted.',
    enum: ['DEMO_PROVIDER'],
    example: 'DEMO_PROVIDER',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['DEMO_PROVIDER'])
  paymentMethod!: 'DEMO_PROVIDER';
}
