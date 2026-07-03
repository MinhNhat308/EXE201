import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  ShiftSession,
  ShiftSessionSchema,
} from '../shifts/schemas/shift-session.schema';
import { InventoryModule } from '../inventory/inventory.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: ShiftSession.name, schema: ShiftSessionSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
    InventoryModule,
    TenantsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
