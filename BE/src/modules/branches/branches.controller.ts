import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { SaasFeature } from '../../common/enums/saas-feature.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get()
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING, Role.WAREHOUSE)
  list(@CurrentUser() user: UserDocument) {
    const tenantId = user.tenantId!.toString();
    return this.branchesService.findAll(tenantId).then((rows) =>
      rows.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        address: b.address,
        isDefault: b.isDefault,
        isActive: b.isActive,
      })),
    );
  }

  @Get('summary')
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING)
  async summary(@CurrentUser() user: UserDocument) {
    const tenantId = user.tenantId!.toString();
    const [branches, sub] = await Promise.all([
      this.branchesService.findAll(tenantId),
      this.subscriptionsService.findByTenantId(tenantId),
    ]);
    return {
      count: branches.length,
      maxBranches: sub?.maxBranches ?? 1,
      branches: branches.map((b) => ({
        id: b._id.toString(),
        code: b.code,
        name: b.name,
        isDefault: b.isDefault,
      })),
    };
  }

  @Get(':id')
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING)
  async getOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    const b = await this.branchesService.findById(user.tenantId!.toString(), id);
    return {
      id: b._id.toString(),
      code: b.code,
      name: b.name,
      address: b.address,
      isDefault: b.isDefault,
      isActive: b.isActive,
    };
  }

  @Post()
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateBranchDto, @CurrentUser() user: UserDocument) {
    const tenantId = user.tenantId!.toString();
    const sub = await this.subscriptionsService.findByTenantId(tenantId);
    const b = await this.branchesService.create(
      tenantId,
      dto,
      sub?.maxBranches ?? 1,
    );
    return {
      id: b._id.toString(),
      code: b.code,
      name: b.name,
      address: b.address,
      isDefault: b.isDefault,
      isActive: b.isActive,
    };
  }

  @Patch(':id')
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: UserDocument,
  ) {
    const b = await this.branchesService.update(user.tenantId!.toString(), id, dto);
    return {
      id: b._id.toString(),
      code: b.code,
      name: b.name,
      address: b.address,
      isDefault: b.isDefault,
      isActive: b.isActive,
    };
  }
}
