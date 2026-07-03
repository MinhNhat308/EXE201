import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { QueryParams } from "../common/types";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll(@Query() query: QueryParams) {
    return this.tenantsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.tenantsService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: Record<string, unknown>) {
    return this.tenantsService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tenantsService.remove(id);
  }
}
