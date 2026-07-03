import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeLineDto } from './recipe-line.dto';

export class UpsertRecipeDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  lines: RecipeLineDto[];

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  intensityPercent?: number;
}
