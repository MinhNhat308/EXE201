import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { QueryParams } from "../common/types";
import { LicensesService } from "./licenses.service";

@Controller("licenses")
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get()
  findAll(@Query() query: QueryParams) {
    return this.licensesService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.licensesService.findOne(id);
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.licensesService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: Record<string, unknown>) {
    return this.licensesService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.licensesService.remove(id);
  }
}
