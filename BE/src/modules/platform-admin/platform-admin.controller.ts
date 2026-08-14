import { Body, Controller, Delete, Headers, Param, Patch, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { PlatformAdminService } from './platform-admin.service';

@Public()
@Controller('platform-admin')
export class PlatformAdminController {
  constructor(
    private readonly service: PlatformAdminService,
    private readonly config: ConfigService,
  ) {}

  @Patch('tenants/:id')
  updateTenant(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Headers('x-platform-admin-secret') secret?: string,
  ) {
    this.assertAuthorized(secret);
    return this.service.updateTenant(id, payload);
  }

  @Delete('tenants/:id')
  suspendTenant(@Param('id') id: string, @Headers('x-platform-admin-secret') secret?: string) {
    this.assertAuthorized(secret);
    return this.service.suspendTenant(id);
  }

  private assertAuthorized(secret?: string) {
    const expected = this.config.get<string>('PLATFORM_ADMIN_INTERNAL_SECRET')?.trim();
    if (!expected) throw new ServiceUnavailableException('Platform admin internal API is not configured');
    if (!secret || secret !== expected) throw new UnauthorizedException('Invalid platform admin credentials');
  }
}
