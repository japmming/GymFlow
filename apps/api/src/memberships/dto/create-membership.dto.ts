import { IsUUID, Matches } from 'class-validator';

export class CreateMembershipDto {
  @IsUUID()
  memberId!: string;

  @IsUUID()
  planId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de inicio debe tener el formato YYYY-MM-DD.',
  })
  startDate!: string;
}
