import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateClientDTO {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @IsOptional() @Transform(trim) @IsString() @MinLength(8) @MaxLength(20)
  phone?: string;

  @IsOptional() @Transform(trim) @IsEmail()
  email?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  city?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(50)
  source?: string;
}

export class UpdateClientDTO {
  @IsOptional() @Transform(trim) @IsString() @MinLength(1) @MaxLength(200)
  name?: string;

  @IsOptional() @Transform(trim) @IsString() @MinLength(8) @MaxLength(20)
  phone?: string;

  @IsOptional() @Transform(trim) @IsEmail()
  email?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  city?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(50)
  source?: string;
}
