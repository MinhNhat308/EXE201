import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { AuthGuard } from "./auth/auth.guard";
import { ContractsModule } from "./contracts/contracts.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmployeesModule } from "./employees/employees.module";
import { HealthController } from "./health.controller";
import { LicensesModule } from "./licenses/licenses.module";
import { SearchModule } from "./search/search.module";
import { SeederModule } from "./seeder/seeder.module";
import { SettingsModule } from "./settings/settings.module";
import { SubscriptionPlansModule } from "./subscription-plans/subscription-plans.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("MONGODB_URI") ?? "mongodb://127.0.0.1:27017/exe201"
      })
    }),
    TenantsModule,
    ContractsModule,
    EmployeesModule,
    AuthModule,
    SettingsModule,
    SubscriptionPlansModule,
    DashboardModule,
    LicensesModule,
    SearchModule,
    SeederModule
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ]
})
export class AppModule {}
