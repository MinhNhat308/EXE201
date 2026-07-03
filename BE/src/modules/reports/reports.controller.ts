import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { SaasFeature } from '../../common/enums/saas-feature.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Báo cáo cửa hàng đầy đủ — tất cả loại trong một bundle */
  @Get('store')
  @RequireFeature(SaasFeature.BASIC_REPORTS)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING)
  getStoreReport(
    @Query('date') date?: string,
    @Query('workShift') workShift?: WorkShift,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.reportsService.getStoreReportBundle(
      date,
      workShift,
      user?.tenantId?.toString(),
      branchId,
    );
  }

  /** Tổng hợp chuỗi — doanh thu từng chi nhánh */
  @Get('chain')
  @RequireFeature(SaasFeature.MULTI_BRANCH)
  @Roles(Role.ADMIN, Role.STORE_MANAGER, Role.ACCOUNTING)
  getChainReport(
    @Query('date') date?: string,
    @Query('workShift') workShift?: WorkShift,
    @CurrentUser() user?: UserDocument,
  ) {
    return this.reportsService.getChainReportBundle(
      date,
      workShift,
      user?.tenantId?.toString(),
    );
  }
}
