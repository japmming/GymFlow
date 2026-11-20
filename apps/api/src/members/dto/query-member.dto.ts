import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMemberDto {
  @ApiPropertyOptional({
    description:
      'Texto libre para buscar por nombre, apellido, documento, teléfono o código de socio.',
    example: 'Valeria',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página (base 1).',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página (máximo 100).',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
