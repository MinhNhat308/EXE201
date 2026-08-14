import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipSubscription()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @Roles(Role.ADMIN, Role.STAFF)
  config() {
    return this.paymentsService.getConfig();
  }

  @Get('transactions')
  @Roles(Role.ADMIN, Role.ACCOUNTING)
  listTransactions(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? Math.min(Number(limit) || 50, 200) : 50;
    return this.paymentsService.listTransactions(
      n,
      user.tenantId?.toString(),
    );
  }

  @Post('orders/:orderId/confirm-paid')
  @Roles(Role.ADMIN, Role.STAFF, Role.STORE_MANAGER)
  confirmOrderPaid(@Param('orderId') orderId: string) {
    return this.paymentsService.markOrderPaidManually(orderId);
  }

  @Post('orders/:orderId/refresh-qr')
  @Roles(Role.ADMIN, Role.STAFF)
  refreshOrderQr(@Param('orderId') orderId: string) {
    return this.paymentsService.refreshOrderQr(orderId);
  }
}

/** Webhook SePay — public, không JWT */
@Controller('payments/sepay')
@Public()
@SkipSubscription()
export class SepayWebhookController {
  private readonly log = new Logger(SepayWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /** SePay / ping — kiểm tra URL webhook đã đúng chưa */
  @Get('webhook')
  webhookPing() {
    return { success: true, message: 'BOBAPOS SePay webhook ready' };
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    try {
      const rawBody =
        req.rawBody?.toString('utf8') ?? JSON.stringify(body ?? {});
      await this.paymentsService.handleSepayWebhook(rawBody, headers, body);
      return { success: true };
    } catch (err) {
      this.log.warn(
        `SePay webhook error: ${err instanceof Error ? err.message : err}`,
      );
      throw err;
    }
  }
}
