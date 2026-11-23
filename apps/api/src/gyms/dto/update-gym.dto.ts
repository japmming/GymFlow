import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsString,
  IsTimeZone,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const OPENING_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type OpeningDayKey = (typeof OPENING_DAYS)[number];

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export interface OpeningInterval {
  start: string;
  end: string;
}

export interface OpeningDay {
  closed: boolean;
  interval: OpeningInterval;
}

export type OpeningHours = Record<OpeningDayKey, OpeningDay>;

@ValidatorConstraint({ name: 'openingIntervalOrder', async: false })
export class OpeningIntervalOrderConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const { start, end } = value as Partial<OpeningInterval>;

    if (typeof start !== 'string' || typeof end !== 'string') {
      return false;
    }

    return TIME_PATTERN.test(start) && TIME_PATTERN.test(end) && start < end;
  }

  defaultMessage(): string {
    return 'La hora de apertura debe ser anterior a la hora de cierre.';
  }
}

export class OpeningIntervalDto {
  @ApiProperty({
    description: 'Hora de apertura en formato HH:mm.',
    example: '09:00',
  })
  @Matches(TIME_PATTERN, {
    message: 'La hora debe tener el formato HH:mm.',
  })
  start!: string;

  @ApiProperty({
    description: 'Hora de cierre en formato HH:mm.',
    example: '18:00',
  })
  @Matches(TIME_PATTERN, {
    message: 'La hora debe tener el formato HH:mm.',
  })
  end!: string;
}

export class OpeningDayDto {
  @ApiProperty({
    description: 'Indica que el gimnasio no atiende ese día.',
    example: false,
  })
  @IsBoolean()
  closed!: boolean;

  @ApiProperty({
    description:
      'Franja de atención. Se ignora cuando el día está marcado como cerrado.',
    type: OpeningIntervalDto,
  })
  @IsDefined()
  @ValidateNested()
  @Validate(OpeningIntervalOrderConstraint)
  @Type(() => OpeningIntervalDto)
  interval!: OpeningIntervalDto;
}

export class OpeningHoursDto {
  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  monday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  tuesday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  wednesday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  thursday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  friday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  saturday!: OpeningDayDto;

  @ApiProperty({ type: OpeningDayDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => OpeningDayDto)
  sunday!: OpeningDayDto;
}

export class UpdateGymDto {
  @ApiPropertyOptional({
    description: 'Nombre comercial del gimnasio.',
    minLength: 2,
    maxLength: 150,
    example: 'GymFlow Demo',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiPropertyOptional({
    description:
      'Identificador único legible usado en URLs. Se normaliza a minúsculas.',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    maxLength: 80,
    example: 'gymflow-demo',
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(SLUG_PATTERN, {
    message:
      'El slug solo puede contener letras minúsculas, números y guiones.',
  })
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Zona horaria IANA usada para reportes y vencimientos.',
    example: 'America/Lima',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsTimeZone({ message: 'La zona horaria no es válida.' })
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Código de moneda ISO 4217. Se normaliza a mayúsculas.',
    pattern: '^[A-Z]{3}$',
    example: 'PEN',
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(CURRENCY_PATTERN, {
    message: 'La moneda debe ser un código ISO de 3 letras.',
  })
  currency?: string;

  @ApiPropertyOptional({
    description:
      'URL pública del logo. Envía null o una cadena vacía para quitarlo.',
    format: 'uri',
    nullable: true,
    example: 'https://cdn.gymflow.local/logo.png',
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsUrl(
    {
      require_tld: false,
      require_protocol: true,
      protocols: ['http', 'https'],
    },
    {
      message: 'Ingresa una URL http(s) válida para el logo.',
    },
  )
  logoUrl?: string | null;

  @ApiPropertyOptional({
    description:
      'Horarios de atención por día. Se reemplaza el horario completo.',
    type: OpeningHoursDto,
  })
  @ValidateIf((_, value) => value !== undefined)
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;
}
