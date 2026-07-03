import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { SubscriptionPlan } from '../../../common/enums/subscription-plan.enum';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  /** Gói mục tiêu sau trial: Solo · Store · Chain */
  @IsEnum(SubscriptionPlan)
  intendedPlan: SubscriptionPlan;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
