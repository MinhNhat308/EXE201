import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toDto } from "../common/mongo";
import { hashPassword, verifyPassword } from "./password.util";
import { TokenService } from "./token.service";
import { User, UserDocument } from "./user.schema";

const allowedSsoProviders = new Set(["google", "microsoft"]);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly tokenService: TokenService
  ) {}

  async login(payload: { email: string; password: string }) {
    const user = await this.userModel.findOne({ email: payload.email.toLowerCase(), isActive: true }).exec();
    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    return this.createTokenResponse(user);
  }

  async register(payload: { fullName: string; email: string; password: string; role?: string }) {
    const email = payload.email.toLowerCase();
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const user = await this.userModel.create({
      fullName: payload.fullName,
      email,
      role: payload.role ?? "admin",
      passwordHash: hashPassword(payload.password),
      isActive: true
    });

    return this.createTokenResponse(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.tokenService.verify(refreshToken, "refresh");
    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found");
    }
    return this.createTokenResponse(user);
  }

  async ssoLogin(payload: { provider: string; email: string }) {
    const provider = payload.provider.toLowerCase();
    if (!allowedSsoProviders.has(provider)) {
      throw new UnauthorizedException("Unsupported SSO provider");
    }

    const email = payload.email.toLowerCase();
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) {
      throw new UnauthorizedException("No account linked to this SSO identity");
    }

    if (!user.ssoProviders.includes(provider)) {
      user.ssoProviders = [...(user.ssoProviders ?? []), provider];
      await user.save();
    }

    return this.createTokenResponse(user);
  }

  async forgotPassword(payload: { email: string }) {
    const email = payload.email.toLowerCase();
    const user = await this.userModel.findOne({ email, isActive: true }).exec();

    if (user) {
      const resetCode = String(Math.floor(100000 + Math.random() * 900000));
      user.resetCode = resetCode;
      user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    }

    return { ok: true, message: "If the email exists, a verification code has been sent." };
  }

  async verifyAccess(payload: { email: string; code: string }) {
    const email = payload.email.toLowerCase();
    const user = await this.userModel.findOne({ email, isActive: true }).exec();

    if (!user || !user.resetCode || !user.resetCodeExpiresAt) {
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    if (user.resetCode !== payload.code.trim()) {
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    if (user.resetCodeExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Invalid or expired verification code");
    }

    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();

    return this.createTokenResponse(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.toAuthUser(user);
  }

  logout() {
    return { ok: true };
  }

  createTokenResponseForUser(user: UserDocument) {
    return this.createTokenResponse(user);
  }

  private createTokenResponse(user: UserDocument) {
    const authUser = this.toAuthUser(user);
    return {
      accessToken: this.tokenService.sign(authUser, 60 * 60 * 8, "access"),
      refreshToken: this.tokenService.sign(authUser, 60 * 60 * 24 * 7, "refresh"),
      user: authUser
    };
  }

  private toAuthUser(user: UserDocument) {
    const dto = toDto<Record<string, any>>(user)!;
    return {
      sub: dto.id,
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      tenantId: dto.tenantId
    };
  }
}
