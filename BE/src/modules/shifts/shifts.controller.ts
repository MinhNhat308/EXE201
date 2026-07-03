import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { WorkShift } from '../../common/enums/work-shift.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { SaasFeature } from '../../common/enums/saas-feature.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { CheckInShiftDto } from './dto/check-in-shift.dto';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('check-in')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STAFF, Role.KITCHEN)
  checkIn(@Body() dto: CheckInShiftDto, @CurrentUser() user: UserDocument) {
    return this.shiftsService.checkIn(user, dto);
  }

  @Post('check-out')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STAFF, Role.KITCHEN)
  checkOut(@CurrentUser() user: UserDocument) {
    return this.shiftsService.checkOut(user);
  }

  @Get('me')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STAFF, Role.KITCHEN)
  myActive(@CurrentUser() user: UserDocument) {
    return this.shiftsService.getMyActive(user);
  }

  @Get('today')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STORE_MANAGER, Role.ACCOUNTING, Role.ADMIN)
  listToday(
    @Query('workShift') workShift?: WorkShift,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.shiftsService.listToday(workShift, activeOnly === 'true');
  }

  @Patch(':id/close')
  @RequireFeature(SaasFeature.SHIFT_MGMT)
  @Roles(Role.STORE_MANAGER, Role.ACCOUNTING, Role.ADMIN)
  forceClose(@Param('id') id: string) {
    return this.shiftsService.forceClose(id);
  }
}
