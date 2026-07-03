import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BobaposModule } from "../bobapos/bobapos.module";
import { Employee, EmployeeSchema } from "./employee.schema";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";

@Module({
  imports: [
    BobaposModule,
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }])
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, MongooseModule]
})
export class EmployeesModule {}
