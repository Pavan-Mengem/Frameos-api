import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString,
  Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { IdParamDTO } from '../../../utils/paramDTOs';

export class CreateGalleryDTO {
  @IsOptional() @IsInt() @IsPositive()
  eventId?: number;

  @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MinLength(4) @MaxLength(50)
  password?: string;

  @IsOptional() @IsDateString()
  expiresAt?: string;
}

export class UpdateGalleryDTO {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MinLength(4) @MaxLength(50)
  password?: string | null;

  @IsOptional() @IsDateString()
  expiresAt?: string | null;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsInt() @IsPositive()
  coverPhotoId?: number | null;
}

export class CreateAlbumDTO {
  @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateAlbumDTO {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  title?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
}

class PresignItemDTO {
  @IsString() @MinLength(1) @MaxLength(200)
  filename!: string;

  @IsString() @MinLength(3) @MaxLength(80)
  mimeType!: string;

  @IsInt() @IsPositive() @Max(25 * 1024 * 1024)
  byteSize!: number;

  @IsOptional() @IsInt() @IsPositive()
  albumId?: number;
}

// one presign batch = up to 50 photos
export class PresignDTO {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PresignItemDTO)
  items!: PresignItemDTO[];
}

export class ConfirmDTO {
  @IsArray() @IsInt({ each: true }) @IsPositive({ each: true })
  photoIds!: number[];
}

// --- public ---
export class PasswordDTO {
  @IsString() @MinLength(1) @MaxLength(200)
  password!: string;
}

export class FavoriteDTO {
  @IsInt() @IsPositive()
  photoId!: number;

  @IsString() @MinLength(8) @MaxLength(80)
  clientIdentifier!: string;
}

// --- route param DTOs ---
export class GalleryAlbumParamsDTO extends IdParamDTO {
  @Type(() => Number)
  @IsInt() @IsPositive()
  albumId!: number;
}

export class GalleryPhotoParamsDTO extends IdParamDTO {
  @Type(() => Number)
  @IsInt() @IsPositive()
  photoId!: number;
}
