import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query("q") q = "", @Query("limit") limit = "8") {
    return this.searchService.search(q, Number(limit));
  }
}
