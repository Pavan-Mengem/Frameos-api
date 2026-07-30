import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, Min, MaxLength, MinLength } from 'class-validator';
import { EVENT_STATUSES } from '../models/eventModel';
import { TEAM_ROLES } from '../models/teamAssignmentModel';
import { IdParamDTO } from '../../../utils/paramDTOs';

export class CreateEventDTO {
  @IsInt() @IsPositive()
  clientId!: number;

  @IsOptional() @IsInt() @IsPositive()
  leadId?: number;

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
  @IsOptional() @IsInt() @IsPositive() clientId?: number;
  @IsOptional() @IsInt() @IsPositive() leadId?: number;
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

export class EventTeamAssignmentParamsDTO extends IdParamDTO {
  @Type(() => Number)
  @IsInt() @IsPositive()
  assignmentId!: number;
}
