import { ApiProperty } from '@nestjs/swagger';

import { AttendanceResponseDto } from './attendance.model';
import { PaginationMetaDto } from './common.model';

export class PaginatedAttendancesResponseDto {
  @ApiProperty({
    description: 'Asistencias de la página solicitada.',
    type: [AttendanceResponseDto],
  })
  data!: AttendanceResponseDto[];

  @ApiProperty({
    description: 'Información de paginación.',
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
