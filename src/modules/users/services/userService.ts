import { sequelize } from '../../../config/database';
import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse, PageParams } from '../../../utils/pagination';
import { logger } from '../../../config/logger';
import { StudioRepository } from '../../studios';
import { UserRepository, CreateUserInput } from '../repositories/userRepository';
import { User, Role } from '../models/userModel';
import { signAccessToken, signRefreshToken, verifyRefreshToken, AuthClaims } from '../helpers/token.helper';
import { hash, compare } from '../helpers/password.helper';
import { verifyOtplessToken } from '../helpers/otpless.helper';
import { RegisterDTO } from '../dtos/authDTO';
import { AddUserDTO } from '../dtos/userDTO';

const sanitize = (u: User) => ({
  id: u.id,
  studioId: u.studioId,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isActive: u.isActive,
});

const issueTokens = async (user: User) => {
  const claims: AuthClaims = { userId: user.id, studioId: user.studioId, role: user.role };
  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);
  await UserRepository.setRefreshHash(user.id, await hash(refreshToken));
  return { accessToken, refreshToken };
};

export class UserService {
  /** Create a studio + its owner atomically. */
  static async register(dto: RegisterDTO): Promise<ApiResponse> {
    try {
      const existing = await StudioRepository.findBySlug(dto.slug);
      if (existing) return buildError('Studio slug already taken', 409);

      const result = await sequelize.transaction(async (tx) => {
        const studio = await StudioRepository.create(
          { name: dto.studioName, slug: dto.slug, email: dto.email, phone: dto.phone, gstin: dto.gstin },
          tx
        );
        const owner = await UserRepository.create(
          { studioId: studio.id, name: dto.ownerName, email: dto.email, phone: dto.phone, role: 'owner' },
          tx
        );
        return { studio, owner };
      });

      const tokens = await issueTokens(result.owner);
      logger.info({ studioId: result.studio.id, userId: result.owner.id }, 'Studio registered');
      return buildSuccess({ user: sanitize(result.owner), studioId: result.studio.id, ...tokens }, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to register studio');
    }
  }

  /** Primary login: exchange an OTPless token for FrameOS tokens. */
  static async loginWithOtpless(token: string): Promise<ApiResponse> {
    try {
      const identity = await verifyOtplessToken(token);
      const user =
        (identity.phone && (await UserRepository.findByPhone(identity.phone))) ||
        (identity.email && (await UserRepository.findByEmail(identity.email))) ||
        null;
      if (!user) return buildError('No FrameOS account for this identity', 401);
      if (!user.isActive) return buildError('Account is deactivated', 403);
      const tokens = await issueTokens(user);
      logger.info({ studioId: user.studioId, userId: user.id }, 'User signed in');
      return buildSuccess({ user: sanitize(user), ...tokens });
    } catch (error) {
      return toErrorResponse(error, 'Failed to sign in');
    }
  }

  /** Rotate access + refresh tokens; invalidates the old refresh token. */
  static async refresh(refreshToken: string): Promise<ApiResponse> {
    try {
      let claims: AuthClaims;
      try {
        claims = verifyRefreshToken(refreshToken);
      } catch {
        return buildError('Invalid refresh token', 401);
      }
      const user = await UserRepository.findByIdGlobal(claims.userId);
      if (!user || !user.refreshTokenHash) return buildError('Session not found', 401);

      const valid = await compare(refreshToken, user.refreshTokenHash);
      if (!valid) return buildError('Refresh token revoked', 401);

      const tokens = await issueTokens(user);
      return buildSuccess({ user: sanitize(user), ...tokens });
    } catch (error) {
      return toErrorResponse(error, 'Failed to refresh session');
    }
  }

  static async logout(userId: string): Promise<ApiResponse> {
    try {
      await UserRepository.setRefreshHash(userId, null);
      logger.info({ userId }, 'User logged out');
      return buildSuccess({ loggedOut: true });
    } catch (error) {
      return toErrorResponse(error, 'Failed to log out');
    }
  }

  static async me(userId: string): Promise<ApiResponse> {
    try {
      const user = await UserRepository.findByIdGlobal(userId);
      if (!user) return buildError('User not found', 404);
      return buildSuccess(sanitize(user));
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve user');
    }
  }

  // ---------------- team management (studio-scoped) ----------------

  static async addTeamMember(studioId: string, dto: AddUserDTO): Promise<ApiResponse> {
    try {
      const user = await UserRepository.create({
        studioId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role as Role,
      });
      logger.info({ studioId, userId: user.id, role: user.role }, 'Team member added');
      return buildSuccess(sanitize(user), undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to add team member');
    }
  }

  static async listTeam(studioId: string, filter: { role?: Role }, page: PageParams): Promise<ApiResponse> {
    try {
      const { rows, count } = await UserRepository.listAndCount(studioId, filter, page.limit, page.offset);
      return buildListResponse(rows.map(sanitize), count, page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve team');
    }
  }

  static async setMemberStatus(studioId: string, memberId: string, isActive: boolean): Promise<ApiResponse> {
    try {
      const member = await UserRepository.findByIdScoped(studioId, memberId);
      if (!member) return buildError('Team member not found', 404);
      if (member.role === 'owner') return buildError('Cannot deactivate the owner', 403);
      await UserRepository.setStatus(studioId, memberId, isActive);
      logger.info({ studioId, memberId, isActive }, 'Team member status changed');
      return buildSuccess({ id: memberId, isActive });
    } catch (error) {
      return toErrorResponse(error, 'Failed to update team member status');
    }
  }
}
