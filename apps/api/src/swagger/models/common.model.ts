import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP del error.',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensaje o lista de mensajes que describen el error.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'La fecha de inicio no puede ser anterior a hoy.',
  })
  message!: string | string[];

  @ApiProperty({
    description: 'Nombre del tipo de error HTTP.',
    example: 'Bad Request',
  })
  error!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Página actual (base 1).', example: 1 })
  page!: number;

  @ApiProperty({
    description: 'Cantidad de registros por página.',
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total de registros que coinciden con el filtro.',
    example: 42,
  })
  total!: number;

  @ApiProperty({ description: 'Total de páginas disponibles.', example: 5 })
  totalPages!: number;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'gymflow-api' })
  service!: string;

  @ApiProperty({
    description: 'Momento en que se generó la respuesta.',
    format: 'date-time',
    example: '2026-11-17T10:30:00.000Z',
  })
  timestamp!: string;
}

export class SuccessResponseDto {
  @ApiProperty({
    description: 'Indica si la operación se completó correctamente.',
    example: true,
  })
  success!: boolean;
}
