import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { IngredientCategory } from '../../../common/enums/ingredient-category.enum';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(IngredientCategory)
  category?: IngredientCategory;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shelfLifeDays?: number;
}
