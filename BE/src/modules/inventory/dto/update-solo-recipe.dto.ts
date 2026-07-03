import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSoloRecipeDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  intensityPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  sugarPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  icePercent?: number;
}
