import { Type } from 'class-transformer';
import {
  IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength,
  ValidateNested,
} from 'class-validator';
import { THEME_KEYS } from '../helpers/themeRegistry';

class SocialsDTO {
  @IsOptional() @IsUrl() @MaxLength(300) instagram?: string;
  @IsOptional() @IsUrl() @MaxLength(300) facebook?: string;
  @IsOptional() @IsUrl() @MaxLength(300) youtube?: string;
  @IsOptional() @IsUrl() @MaxLength(300) website?: string;
}

class PackageDTO {
  @IsString() @MinLength(1) @MaxLength(120)
  title!: string;

  @IsInt() @Min(0)
  priceInr!: number;

  @IsArray() @IsString({ each: true })
  features!: string[];
}

class TestimonialDTO {
  @IsString() @MinLength(1) @MaxLength(120)
  author!: string;

  @IsString() @MinLength(1) @MaxLength(1000)
  quote!: string;

  @IsOptional() @IsInt() @Min(1) @Max(5)
  rating?: number;
}

class SettingsDTO {
  @IsOptional() @IsString() @MaxLength(200) tagline?: string | null;
  @IsOptional() @IsString() @MaxLength(4000) about?: string | null;
  @IsOptional() @IsString() @MaxLength(500) address?: string | null;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(20) whatsapp?: string | null;
  @IsOptional() @IsUrl() @MaxLength(300) waLink?: string | null;
  @IsOptional() @IsInt() @Min(0) priceInr?: number | null;

  @IsOptional() @ValidateNested() @Type(() => SocialsDTO)
  socials?: SocialsDTO;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PackageDTO)
  packages?: PackageDTO[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TestimonialDTO)
  testimonials?: TestimonialDTO[];
}

export class UpdateStudioDTO {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  name?: string;

  @IsOptional() @IsEmail()
  email?: string | null;

  @IsOptional() @IsString() @MinLength(8) @MaxLength(20)
  phone?: string | null;

  @IsOptional() @IsString() @MinLength(15) @MaxLength(15)
  gstin?: string | null;

  @IsOptional() @IsIn(THEME_KEYS)
  theme?: string;

  @IsOptional() @ValidateNested() @Type(() => SettingsDTO)
  settings?: SettingsDTO;
}
