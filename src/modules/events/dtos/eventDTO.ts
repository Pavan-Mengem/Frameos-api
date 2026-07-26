import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength, MinLength } from 'class-validator';
import { EVENT_STATUSES } from '../models/eventModel';
import { TEAM_ROLES } from '../models/teamAssignmentModel';

export class CreateEventDTO {
  @IsUUID()
  clientId!: string;

  @IsOptional() @IsUUID()
  leadId?: string;

  @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(50)
  eventType?: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional() @IsString() @MaxLength(200)
  venue?: string;

  @IsOptional() @IsInt() @Min(0)
  totalInr?: number;

  @IsOptional() @IsInt() @Min(0)
  advanceInr?: number;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsIn(EVENT_STATUSES)
  status?: string;
}

export class UpdateEventDTO {
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(50) eventType?: string;
  @IsOptional() @IsDateString() eventDate?: string;
  @IsOptional() @IsString() @MaxLength(200) venue?: string;
  @IsOptional() @IsInt() @Min(0) totalInr?: number;
  @IsOptional() @IsInt() @Min(0) advanceInr?: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsIn(EVENT_STATUSES) status?: string;
}

export class AddTeamMemberDTO {
  @IsUUID()
  userId!: string;

  @IsIn(TEAM_ROLES)
  roleOnShoot!: string;
}
