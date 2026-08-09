import { IsString, Length, MinLength, MaxLength } from 'class-validator';

export class PortalOtpRequestDTO {
  @IsString() @MinLength(3) @MaxLength(120)
  identifier!: string; // phone or email, matched against the studio's Client records
}

export class PortalOtpVerifyDTO {
  @IsString() @MinLength(3) @MaxLength(120)
  identifier!: string;

  @IsString() @Length(6, 6)
  otp!: string;

  @IsString()
  requestId!: string;
}
