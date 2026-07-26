import { IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from 'class-validator';
import { LEAD_SOURCES, LEAD_STATUSES } from '../models/leadModel';

export class CreateLeadDTO {
  @IsOptional() @IsUUID()
  clientId?: string;

  @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @IsOptional() @IsString() @MinLength(8) @MaxLength(20)
  phone?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(50)
  eventType?: string;

  @IsOptional() @IsDateString()
  eventDate?: string;

  @IsOptional() @IsString() @MaxLength(200)
  venue?: string;

  @IsOptional() @IsInt() @Min(0)
  budgetInr?: number;

  @IsOptional() @IsIn(LEAD_SOURCES)
  source?: string;

  @IsOptional() @IsIn(LEAD_STATUSES)
  status?: string;

  @IsOptional() @IsUUID()
  assignedTo?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsDateString()
  followUpAt?: string;
}

export class UpdateLeadDTO {
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(20) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(50) eventType?: string;
  @IsOptional() @IsDateString() eventDate?: string;
  @IsOptional() @IsString() @MaxLength(200) venue?: string;
  @IsOptional() @IsInt() @Min(0) budgetInr?: number;
  @IsOptional() @IsIn(LEAD_SOURCES) source?: string;
  @IsOptional() @IsIn(LEAD_STATUSES) status?: string;
  @IsOptional() @IsUUID() assignedTo?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsDateString() followUpAt?: string;
}

export class SetLeadStatusDTO {
  @IsIn(LEAD_STATUSES)
  status!: string;
}

// Public form — kept intentionally minimal; every field is optional except name+phone.
export class PortfolioEnquiryDTO {
  @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @IsString() @MinLength(8) @MaxLength(20)
  phone!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  message?: string;

  @IsOptional() @IsString() @MaxLength(50)
  eventType?: string;

  @IsOptional() @IsDateString()
  eventDate?: string;
}
