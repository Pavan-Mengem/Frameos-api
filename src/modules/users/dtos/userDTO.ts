import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ROLES } from '../models/userModel';

const ADDABLE_ROLES = ROLES.filter((r) => r !== 'owner');

export class AddUserDTO {
  @IsString() @MinLength(2)
  name!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MinLength(8)
  phone?: string;

  @IsIn(ADDABLE_ROLES)
  role!: string;
}

export class UpdateStatusDTO {
  @IsBoolean()
  isActive!: boolean;
}

export class ListUsersDTO {
  @IsOptional() @IsIn(ROLES)
  role?: string;
}
