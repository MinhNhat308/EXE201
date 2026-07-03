import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { getTenantId } from '../../common/tenant/tenant-context';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    ownerTenantId?: string,
  ): Promise<UserDocument> {
    const tenantId = ownerTenantId ?? getTenantId();
    if (!tenantId) {
      throw new ConflictException('Không xác định được tenant');
    }

    const sub = await this.subscriptionsService.getForTenant(tenantId);
    const count = await this.subscriptionsService.countEmployees(
      tenantId,
      this.userModel,
    );
    this.subscriptionsService.assertCanAddEmployee(sub, count);

    const email = createUserDto.email.toLowerCase();
    const existing = await this.userModel.findOne({ tenantId, email }).exec();
    if (existing) {
      throw new ConflictException('Email đã được sử dụng trong cửa hàng này');
    }

    if (createUserDto.username) {
      const u = createUserDto.username.toLowerCase();
      const dup = await this.userModel
        .findOne({ tenantId, username: u })
        .exec();
      if (dup) {
        throw new ConflictException('Username đã tồn tại');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      tenantId: new Types.ObjectId(tenantId),
      email,
      username: createUserDto.username?.toLowerCase(),
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(tenantId?: string): Promise<UserDocument[]> {
    const tid = tenantId ?? getTenantId();
    const filter = tid ? { tenantId: new Types.ObjectId(tid) } : {};
    return this.userModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /** NV vận hành — QL ca / kế toán xem (không ADMIN owner) */
  async findOperationalStaff(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role: {
          $in: [
            Role.STAFF,
            Role.KITCHEN,
            Role.STORE_MANAGER,
            Role.ACCOUNTING,
            Role.WAREHOUSE,
          ],
        },
      })
      .sort({ role: 1, fullName: 1 })
      .exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }
    return user;
  }

  async findByEmail(email: string, tenantId?: string): Promise<UserDocument | null> {
    const filter: Record<string, unknown> = { email: email.toLowerCase() };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);
    return this.userModel.findOne(filter).exec();
  }

  async findByUsername(
    username: string,
    tenantId: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        username: username.toLowerCase(),
      })
      .exec();
  }

  async findByLogin(
    identifier: string,
    storeSlug?: string,
  ): Promise<UserDocument | null> {
    const id = identifier.trim().toLowerCase();
    if (id.includes('@')) {
      return this.findByEmail(id);
    }

    if (!storeSlug?.trim()) {
      return null;
    }

    const tenant = await this.tenantsService.findBySlug(storeSlug.trim());
    if (!tenant) return null;
    return this.findByUsername(id, tenant._id.toString());
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (updateUserDto.email) {
      const user = await this.findById(id);
      const duplicate = await this.userModel
        .findOne({
          email: updateUserDto.email.toLowerCase(),
          tenantId: user.tenantId,
          _id: { $ne: id },
        })
        .exec();
      if (duplicate) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const updateData: Record<string, unknown> = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.username) {
      updateData.username = updateUserDto.username.toLowerCase();
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    return user;
  }

  async countByRole(role: Role, tenantId?: string): Promise<number> {
    const tid = tenantId ?? getTenantId();
    const filter: Record<string, unknown> = { role };
    if (tid) filter.tenantId = new Types.ObjectId(tid);
    return this.userModel.countDocuments(filter).exec();
  }

  async seedAdmin(
    email: string,
    password: string,
    fullName: string,
    tenantId?: string,
  ): Promise<void> {
    const tid =
      tenantId ?? process.env.DEFAULT_TENANT_ID;
    const filter: Record<string, unknown> = { role: Role.ADMIN };
    if (tid) filter.tenantId = new Types.ObjectId(tid);
    const adminCount = await this.userModel.countDocuments(filter).exec();
    if (adminCount > 0) {
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.userModel.create({
      tenantId: tid ? new Types.ObjectId(tid) : undefined,
      email: email.toLowerCase(),
      password: hashed,
      fullName,
      role: Role.ADMIN,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }
    if (user.role === Role.ADMIN) {
      const adminCount = await this.countByRole(
        Role.ADMIN,
        user.tenantId?.toString(),
      );
      if (adminCount <= 1) {
        throw new ConflictException('Không thể xóa admin cuối cùng');
      }
    }
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async seedStaffIfNotExists(
    email: string,
    password: string,
    fullName: string,
    tenantId?: string,
  ): Promise<void> {
    await this.seedUserIfNotExists(email, password, fullName, Role.STAFF, {
      phone: '0901234567',
      tenantId,
    });
  }

  async seedUserIfNotExists(
    email: string,
    password: string,
    fullName: string,
    role: Role,
    extra?: Partial<CreateUserDto> & { tenantId?: string; resetPassword?: boolean },
  ): Promise<void> {
    const tid = extra?.tenantId ?? process.env.DEFAULT_TENANT_ID;
    const normalizedEmail = email.toLowerCase();
    const existing = await this.findByEmail(normalizedEmail, tid);

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (extra?.username && !existing.username) {
        updates.username = extra.username.toLowerCase();
      }
      if (extra?.resetPassword) {
        updates.password = await bcrypt.hash(password, 10);
      }
      if (Object.keys(updates).length > 0) {
        await this.userModel.updateOne({ _id: existing._id }, updates).exec();
      }
      return;
    }

    if (extra?.username && tid) {
      const usernameTaken = await this.findByUsername(
        extra.username,
        tid,
      );
      if (usernameTaken) {
        return;
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    try {
      await this.userModel.create({
        tenantId: tid ? new Types.ObjectId(tid) : undefined,
        email: normalizedEmail,
        password: hashed,
        fullName,
        role,
        phone: extra?.phone,
        address: extra?.address,
        username: extra?.username?.toLowerCase(),
      });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        return;
      }
      throw err;
    }
  }
}
