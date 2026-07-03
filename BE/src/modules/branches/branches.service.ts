import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  async findAll(tenantId: string, activeOnly = true) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (activeOnly) filter.isActive = true;
    return this.branchModel.find(filter).sort({ isDefault: -1, code: 1 }).exec();
  }

  async findById(tenantId: string, id: string) {
    const doc = await this.branchModel
      .findOne({ _id: id, tenantId: new Types.ObjectId(tenantId) })
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy chi nhánh');
    return doc;
  }

  async countActive(tenantId: string) {
    return this.branchModel
      .countDocuments({ tenantId: new Types.ObjectId(tenantId), isActive: true })
      .exec();
  }

  async getDefaultBranch(tenantId: string) {
    return this.branchModel
      .findOne({ tenantId: new Types.ObjectId(tenantId), isDefault: true, isActive: true })
      .exec();
  }

  async create(
    tenantId: string,
    dto: { code: string; name: string; address?: string; isDefault?: boolean },
    maxBranches: number,
  ) {
    const count = await this.countActive(tenantId);
    if (count >= maxBranches) {
      throw new BadRequestException(
        `Đã đạt giới hạn ${maxBranches} chi nhánh của gói hiện tại`,
      );
    }
    const code = dto.code.trim().toUpperCase();
    const exists = await this.branchModel
      .findOne({ tenantId: new Types.ObjectId(tenantId), code })
      .exec();
    if (exists) {
      throw new BadRequestException(`Mã chi nhánh "${code}" đã tồn tại`);
    }
    if (dto.isDefault) {
      await this.branchModel
        .updateMany(
          { tenantId: new Types.ObjectId(tenantId) },
          { $set: { isDefault: false } },
        )
        .exec();
    }
    return this.branchModel.create({
      tenantId: new Types.ObjectId(tenantId),
      code,
      name: dto.name.trim(),
      address: dto.address?.trim(),
      isDefault: dto.isDefault ?? false,
      isActive: true,
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<{ name: string; address: string; isActive: boolean; isDefault: boolean }>,
  ) {
    const doc = await this.findById(tenantId, id);
    if (dto.isDefault) {
      await this.branchModel
        .updateMany(
          { tenantId: new Types.ObjectId(tenantId), _id: { $ne: doc._id } },
          { $set: { isDefault: false } },
        )
        .exec();
    }
    if (dto.name != null) doc.name = dto.name.trim();
    if (dto.address != null) doc.address = dto.address.trim();
    if (dto.isActive != null) doc.isActive = dto.isActive;
    if (dto.isDefault != null) doc.isDefault = dto.isDefault;
    return doc.save();
  }
}
