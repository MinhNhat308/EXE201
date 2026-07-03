import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipSubscription } from '../../common/decorators/skip-subscription.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BillingService } from './billing.service';
import type { MomoIpnPayload } from './momo-payment.service';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('billing')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.ADMIN)
@SkipSubscription()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('momo/config')
  momoConfig() {
    return this.billingService.momoConfig();
  }

  @Get('transfer-info')
  transferInfo() {
    return this.billingService.getBankTransferInfo();
  }

  @Get('invoices')
  list(@CurrentUser() user: UserDocument) {
    return this.billingService.listByTenant(user.tenantId!.toString());
  }

  @Get('invoices/:id')
  getOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.billingService.getInvoiceForTenant(user.tenantId!.toString(), id);
  }

  @Post('checkout')
  checkout(
    @CurrentUser() user: UserDocument,
    @Body('plan') plan: SubscriptionPlan,
    @Body('months') months?: number,
  ) {
    return this.billingService.createCheckout(
      user.tenantId!.toString(),
      plan,
      months ?? 1,
    );
  }

  @Post('checkout-momo')
  checkoutMomo(
    @CurrentUser() user: UserDocument,
    @Body('plan') plan: SubscriptionPlan,
    @Body('months') months?: number,
  ) {
    return this.billingService.createMomoCheckout(
      user.tenantId!.toString(),
      plan,
      months ?? 1,
    );
  }

  @Post('invoices/:id/confirm-paid')
  confirmPaid(@Param('id') id: string) {
    return this.billingService.markPaidAndActivate(id);
  }
}

/** Webhook MoMo — public, không JWT */
@Controller('billing/momo')
@Public()
@SkipSubscription()
export class MomoWebhookController {
  private readonly log = new Logger(MomoWebhookController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('ipn')
  async ipn(@Body() body: MomoIpnPayload) {
    try {
      const result = await this.billingService.handleMomoIpn(body);
      this.log.log(`MoMo IPN OK orderId=${body.orderId} activated=${result.activated}`);
      return result;
    } catch (err) {
      this.log.warn(`MoMo IPN error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}
