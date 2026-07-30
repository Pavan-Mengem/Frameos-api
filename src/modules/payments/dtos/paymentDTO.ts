import { IsIn, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateOrderDTO {
  @IsInt() @IsPositive()
  eventId!: number;

  @IsIn(['advance', 'balance'])
  kind!: string;

  @IsInt() @IsPositive()
  amountInr!: number;
}

export class ManualPaymentDTO {
  @IsInt() @IsPositive()
  eventId!: number;

  @IsInt() @IsPositive()
  amountInr!: number;

  @IsIn(['cash', 'upi', 'other'])
  method!: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
