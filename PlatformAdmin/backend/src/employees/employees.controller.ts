import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { type QueryParams } from "../common/types";
import { EmployeesService } from "./employees.service";

@Controller("employees")
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Get()
  findAll(@Query() query: QueryParams) {
    return this.employeesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.employeesService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: Record<string, unknown>) {
    return this.employeesService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.employeesService.remove(id);
  }
}
