import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Nombre comercial del plan.',
    minLength: 2,
    maxLength: 100,
    example: 'Plan Mensual',
  })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción del plan.',
    maxLength: 255,
    example: 'Acceso completo por 30 días',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({
    description: 'Duración del plan en días.',
    minimum: 1,
    maximum: 3650,
    example: 30,
  })
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays!: number;

  @ApiProperty({
    description: 'Precio del plan.',
    minimum: 0,
    example: 49.9,
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    description:
      'Indica si el plan queda disponible al crearlo. Por defecto es true.',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
