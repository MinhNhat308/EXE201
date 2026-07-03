import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { WorkShift } from '../../../common/enums/work-shift.enum';

export class StoreReportQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(WorkShift)
  workShift?: WorkShift;
}
