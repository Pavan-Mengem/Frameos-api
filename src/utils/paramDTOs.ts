import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

/**
 * Validates a route's `:id` path param as a positive integer via
 * validateDto(IdParamDTO, 'params') — used on every entity whose PK is an
 * auto-increment INTEGER (i.e. everything except studios/users, which keep
 * UUID ids and don't use this).
 *
 * Express path params always arrive as strings. class-transformer's
 * enableImplicitConversion relies on TS decorator metadata, which tsx/esbuild
 * doesn't emit (unlike tsc) — so implicit conversion silently no-ops under
 * `npm run dev`/`tsx`. @Type(() => Number) sidesteps that: it's class-transformer's
 * own decorator metadata, not reflected TS type info, so it converts reliably
 * under both esbuild and tsc.
 */
export class IdParamDTO {
  @Type(() => Number)
  @IsInt() @IsPositive()
  id!: number;
}
