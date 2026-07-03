import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkRole } from '../../../common/enums/work-role.enum';
import { WorkShift } from '../../../common/enums/work-shift.enum';

export class CheckInShiftDto {
  @IsEnum(WorkShift)
  workShift: WorkShift;

  @IsOptional()
  @IsEnum(WorkRole)
  workRole?: WorkRole;

  @IsOptional()
  @IsString()
  branchId?: string;
}
