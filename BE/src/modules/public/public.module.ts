import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SeedModule } from '../../seed/seed.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TenantsModule,
    SubscriptionsModule,
    AuthModule,
    SeedModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
