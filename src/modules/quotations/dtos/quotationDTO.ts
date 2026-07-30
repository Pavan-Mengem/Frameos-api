import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString, Matches, MaxLength, Min,
  MinLength, ValidateNested,
} from 'class-validator';

const GST_RATES = [0, 5, 12, 18, 28];

export class QuotationLineInputDTO {
  @IsOptional() @IsString() @MinLength(4) @MaxLength(20)
  hsnSac?: string;

  @IsString() @MinLength(1) @MaxLength(500)
  description!: string;

  @IsInt() @Min(1)
  quantity!: number;

  @IsInt() @Min(0)
  unitPriceInr!: number;

  @IsOptional() @IsInt() @Min(0)
  discountInr?: number;

  @IsInt() @IsIn(GST_RATES)
  gstRate!: number;
}

export class CreateQuotationDTO {
  @IsInt() @IsPositive()
  clientId!: number;

  @IsOptional() @IsInt() @IsPositive()
  eventId?: number;

  @IsOptional() @IsString() @Matches(/^\d{2}$/, { message: 'state code = 2 digits' })
  placeOfSupply?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => QuotationLineInputDTO)
  lines!: QuotationLineInputDTO[];

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;

  @IsOptional() @IsString() @MaxLength(4000)
  terms?: string;

  @IsOptional() @IsDateString()
  validUntil?: string;
}

export class UpdateQuotationDTO {
  @IsOptional() @IsInt() @IsPositive() clientId?: number;
  @IsOptional() @IsInt() @IsPositive() eventId?: number;
  @IsOptional() @IsString() @Matches(/^\d{2}$/, { message: 'state code = 2 digits' }) placeOfSupply?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuotationLineInputDTO) lines?: QuotationLineInputDTO[];
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() @MaxLength(4000) terms?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}

// draft transition only via /send
export class SetQuotationStatusDTO {
  @IsIn(['sent', 'accepted', 'rejected', 'expired'])
  status!: string;
}
