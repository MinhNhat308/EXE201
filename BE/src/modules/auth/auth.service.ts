import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { Role } from '../../common/enums/role.enum';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

import { TenantsService } from '../tenants/tenants.service';

import { UsersService } from '../users/users.service';

import { LoginDto } from './dto/login.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

import { UserDocument } from '../users/schemas/user.schema';



export interface AuthResponse {

  accessToken: string;

  user: {

    id: string;

    fullName: string;

    email: string;

    username?: string;

    role: string;

    tenantId?: string;

    phone?: string;

    address?: string;

  };

  tenant: Record<string, unknown>;

  subscription: Record<string, unknown>;

  trialDaysLeft: number;

  plan: string;

  status: string;

}



@Injectable()

export class AuthService {

  constructor(

    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly tenantsService: TenantsService,

    private readonly subscriptionsService: SubscriptionsService,

  ) {}



  async login(loginDto: LoginDto): Promise<AuthResponse> {

    const id = loginDto.identifier.trim().toLowerCase();
    if (!id.includes('@') && !loginDto.storeSlug?.trim()) {
      throw new UnauthorizedException(
        'Nhân viên cần nhập thêm mã cửa hàng',
      );
    }

    const user = await this.usersService.findByLogin(

      loginDto.identifier,

      loginDto.storeSlug,

    );



    if (!user || !user.isActive) {

      throw new UnauthorizedException('Thông tin đăng nhập không đúng');

    }



    const isPasswordValid = await bcrypt.compare(

      loginDto.password,

      user.password,

    );



    if (!isPasswordValid) {

      throw new UnauthorizedException('Thông tin đăng nhập không đúng');

    }



    return this.buildAuthResponse(user);

  }

  /** Đồng bộ trial/subscription cho FE (mọi role) */
  async getSessionContext(user: UserDocument) {
    if (!user.tenantId) {
      throw new UnauthorizedException('Tài khoản chưa gắn cửa hàng');
    }

    const tenantId = user.tenantId.toString();
    const [tenant, sub] = await Promise.all([
      this.tenantsService.findById(tenantId),
      this.subscriptionsService.getForTenant(tenantId),
    ]);

    await this.tenantsService.refreshStatusFromDates(tenant);
    await this.subscriptionsService.syncExpiredStatus(tenant, sub);

    return {
      tenant: tenant.toJSON() as Record<string, unknown>,
      subscription: sub.toJSON() as Record<string, unknown>,
      trialDaysLeft: this.tenantsService.trialDaysLeft(tenant),
      daysLeft: this.subscriptionsService.daysLeft(sub),
      plan: sub.plan,
      status: sub.status,
    };
  }

  async buildAuthResponse(user: UserDocument): Promise<AuthResponse> {

    if (!user.tenantId) {

      throw new UnauthorizedException('Tài khoản chưa gắn cửa hàng');

    }



    const tenantId = user.tenantId.toString();

    const [tenant, sub] = await Promise.all([

      this.tenantsService.findById(tenantId),

      this.subscriptionsService.getForTenant(tenantId),

    ]);



    await this.tenantsService.refreshStatusFromDates(tenant);

    await this.subscriptionsService.syncExpiredStatus(tenant, sub);



    const payload = {

      sub: user._id.toString(),

      email: user.email,

      role: user.role,

      tenantId,

      plan: sub.plan,

      subscriptionStatus: sub.status,

    };



    const trialDaysLeft = this.tenantsService.trialDaysLeft(tenant);



    return {

      accessToken: this.jwtService.sign(payload),

      user: {

        id: user._id.toString(),

        fullName: user.fullName,

        email: user.email,

        username: user.username,

        role: user.role,

        tenantId,

        phone: user.phone,

        address: user.address,

      },

      tenant: tenant.toJSON() as Record<string, unknown>,

      subscription: sub.toJSON() as Record<string, unknown>,

      trialDaysLeft,

      plan: sub.plan,

      status: sub.status,

    };

  }

  async completeOnboarding(user: UserDocument) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ chủ cửa hàng mới hoàn tất thiết lập');
    }
    if (!user.tenantId) {
      throw new UnauthorizedException('Không xác định cửa hàng');
    }
    const tenant = await this.tenantsService.markOnboardingComplete(
      user.tenantId.toString(),
    );
    return { tenant: tenant.toJSON() as Record<string, unknown> };
  }

  async updateTenant(user: UserDocument, dto: UpdateTenantDto) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ chủ cửa hàng mới cập nhật cửa hàng');
    }
    if (!user.tenantId) {
      throw new UnauthorizedException('Không xác định cửa hàng');
    }
    const tenant = await this.tenantsService.updateProfile(
      user.tenantId.toString(),
      dto,
    );
    return { tenant: tenant.toJSON() as Record<string, unknown> };
  }
}
