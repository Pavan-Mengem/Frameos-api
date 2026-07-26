import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
import { OTP_TYPES } from '../models/otpModel';

export class RegisterDTO {
  @IsString() @MinLength(2)
  studioName!: string;

  @IsString() @MinLength(2) @Matches(/^[a-z0-9-]+$/, { message: 'lowercase, numbers, hyphens only' })
  slug!: string;

  @IsString() @MinLength(2)
  ownerName!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MinLength(8)
  phone?: string;

  @IsOptional() @IsString() @Length(15, 15)
  gstin?: string;
}

export class SendOtpDTO {
  @IsString() @MinLength(3)
  identifier!: string;

  @IsIn(OTP_TYPES)
  type!: string;

  @IsOptional() @IsString()
  purpose?: string = 'login';
}

export class VerifyOtpDTO {
  @IsString() @MinLength(3)
  identifier!: string;

  @IsString() @Length(6, 6)
  otp!: string;

  @IsOptional() @IsString()
  purpose?: string = 'login';
}

export class OtplessDTO {
  @IsString() @MinLength(1)
  token!: string;
}

export class RefreshDTO {
  @IsString() @MinLength(1)
  refreshToken!: string;
}
