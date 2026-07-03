import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { WorkRole } from '../../common/enums/work-role.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { CheckInShiftDto } from './dto/check-in-shift.dto';
import {
  ShiftSession,
  ShiftSessionDocument,
} from './schemas/shift-session.schema';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectModel(ShiftSession.name)
    private readonly shiftModel: Model<ShiftSessionDocument>,
  ) {}

  private getTodayRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { start, end };
  }

  private formatSession(doc: ShiftSessionDocument) {
    return {
      id: doc._id.toString(),
      tenantId: doc.tenantId.toString(),
      userId: doc.userId.toString(),
      userName: doc.userName,
      role: doc.role,
      workRole: doc.workRole,
      workShift: doc.workShift,
      startedAt: doc.startedAt.toISOString(),
      endedAt: doc.endedAt?.toISOString(),
      branchId: doc.branchId?.toString(),
    };
  }

  async checkIn(user: UserDocument, dto: CheckInShiftDto) {
    if (user.role !== Role.STAFF && user.role !== Role.KITCHEN) {
      throw new ForbiddenException('Chỉ nhân viên bán hàng hoặc bếp mới check-in ca');
    }

    if (user.role === Role.STAFF && !dto.workRole) {
      throw new BadRequestException('STAFF cần chọn vai trò Thu ngân hoặc Phục vụ');
    }

    if (user.role === Role.KITCHEN && dto.workRole) {
      throw new BadRequestException('Bếp không cần chọn vai trò phụ');
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tài khoản chưa gắn cửa hàng');
    }

    const now = new Date();
    await this.shiftModel
      .updateMany(
        { tenantId, userId: user._id, endedAt: null },
        { $set: { endedAt: now } },
      )
      .exec();

    const session = await this.shiftModel.create({
      tenantId,
      userId: user._id,
      userName: user.fullName,
      role: user.role,
      workRole: user.role === Role.STAFF ? dto.workRole : undefined,
      workShift: dto.workShift,
      branchId: dto.branchId
        ? new Types.ObjectId(dto.branchId)
        : user.branchId,
      startedAt: now,
    });

    return this.formatSession(session);
  }

  async checkOut(user: UserDocument) {
    const session = await this.findActiveForUser(user);
    if (!session) {
      throw new NotFoundException('Không có ca đang mở');
    }
    session.endedAt = new Date();
    await session.save();
    return this.formatSession(session);
  }

  async findActiveForUser(user: UserDocument): Promise<ShiftSessionDocument | null> {
    if (!user.tenantId) return null;
    const { start, end } = this.getTodayRange();
    return this.shiftModel
      .findOne({
        tenantId: user.tenantId,
        userId: user._id,
        endedAt: null,
        startedAt: { $gte: start, $lt: end },
      })
      .sort({ startedAt: -1 })
      .exec();
  }

  async getMyActive(user: UserDocument) {
    const session = await this.findActiveForUser(user);
    return session ? this.formatSession(session) : null;
  }

  async listToday(workShift?: WorkShift, activeOnly = false) {
    const { start, end } = this.getTodayRange();
    const filter: Record<string, unknown> = {
      startedAt: { $gte: start, $lt: end },
    };
    if (workShift) filter.workShift = workShift;
    if (activeOnly) filter.endedAt = null;

    const sessions = await this.shiftModel
      .find(filter)
      .sort({ startedAt: -1 })
      .exec();

    return sessions.map((s) => this.formatSession(s));
  }

  async forceClose(sessionId: string) {
    const session = await this.shiftModel.findById(sessionId).exec();
    if (!session) {
      throw new NotFoundException('Không tìm thấy ca làm');
    }
    if (session.endedAt) {
      return this.formatSession(session);
    }
    session.endedAt = new Date();
    await session.save();
    return this.formatSession(session);
  }
}
