import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BobaposBridgeService } from "../bobapos/bobapos-bridge.service";
import { paginate, toDto } from "../common/mongo";
import type { QueryParams } from "../common/types";
import { Employee, EmployeeDocument } from "./employee.schema";

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    private readonly bridge: BobaposBridgeService,
    private readonly config: ConfigService
  ) {}

  private useBridge() {
    return this.config.get<string>("BOBAPOS_BRIDGE", "true") !== "false";
  }

  findAll(params: QueryParams) {
    if (this.useBridge()) {
      return this.bridge.findAllEmployees(params);
    }
    return paginate(this.employeeModel, params, ["fullName", "email", "role", "department", "status"]);
  }

  async findOne(id: string) {
    if (this.useBridge()) {
      return this.bridge.findOneEmployee(id);
    }
    const employee = await this.employeeModel.findById(id).exec();
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    return toDto(employee);
  }

  async create(payload: any) {
    if (this.useBridge()) {
      throw new BadRequestException(
        "Chế độ BOBAPOS: nhân viên tạo từ BOBAPOS (/dashboard/admin/employees)."
      );
    }
    const employee = await this.employeeModel.create(payload);
    return toDto(employee);
  }

  async update(id: string, payload: any) {
    if (this.useBridge()) {
      throw new BadRequestException("Chế độ BOBAPOS: chỉ xem nhân viên, sửa tại BOBAPOS.");
    }
    const employee = await this.employeeModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .exec();
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    return toDto(employee);
  }

  async remove(id: string) {
    if (this.useBridge()) {
      throw new BadRequestException("Chế độ BOBAPOS: không xóa NV từ admin portal.");
    }
    const employee = await this.employeeModel.findByIdAndDelete(id).exec();
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
  }
}
