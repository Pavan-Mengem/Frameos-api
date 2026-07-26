import { IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderDTO {
  @IsUUID()
  eventId!: string;

  @IsIn(['advance', 'balance'])
  kind!: string;

  @IsInt() @IsPositive()
  amountInr!: number;
}

export class ManualPaymentDTO {
  @IsUUID()
  eventId!: string;

  @IsInt() @IsPositive()
  amountInr!: number;

  @IsIn(['cash', 'upi', 'other'])
  method!: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
