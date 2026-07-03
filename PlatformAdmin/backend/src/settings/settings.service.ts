import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toDto } from "../common/mongo";
import { hashPassword, verifyPassword } from "../auth/password.util";
import { User, UserDocument } from "../auth/user.schema";

@Injectable()
export class SettingsService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const dto = toDto(user)!;
    return {
      id: dto.id,
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role
    };
  }

  async updateProfile(userId: string, payload: { fullName?: string; email?: string }) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (payload.email && payload.email.toLowerCase() !== user.email) {
      const existing = await this.userModel.findOne({ email: payload.email.toLowerCase() }).exec();
      if (existing) {
        throw new BadRequestException("Email is already in use");
      }
      user.email = payload.email.toLowerCase();
    }

    if (payload.fullName) {
      user.fullName = payload.fullName;
    }

    await user.save();
    return this.getProfile(userId);
  }

  async updateSecurity(userId: string, payload: { currentPassword: string; newPassword: string }) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!verifyPassword(payload.currentPassword, user.passwordHash)) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    if (payload.newPassword.length < 8) {
      throw new BadRequestException("New password must be at least 8 characters");
    }

    user.passwordHash = hashPassword(payload.newPassword);
    await user.save();
    return { ok: true };
  }
}
