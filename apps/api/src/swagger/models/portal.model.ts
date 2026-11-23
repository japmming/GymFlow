import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';

export class MyProfileUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEMBER })
  role!: UserRole;
}

export class MyProfileMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Valeria' })
  firstName!: string;

  @ApiProperty({ example: 'Ramos' })
  lastName!: string;

  @ApiProperty({ nullable: true, example: 'DEMO-001' })
  memberCode!: string;

  @ApiProperty({ nullable: true, example: null })
  documentNumber!: string | null;

  @ApiProperty({ nullable: true, example: null })
  phone!: string | null;

  @ApiProperty({ nullable: true, example: null })
  email!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ format: 'uuid' })
  qrToken!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class MyProfileGymDto {
  @ApiProperty({ example: 'GymFlow Demo' })
  name!: string;

  @ApiProperty({ nullable: true, example: null })
  logoUrl!: string | null;

  @ApiProperty({ example: 'America/Lima' })
  timezone!: string;

  @ApiProperty({ example: 'PEN' })
  currency!: string;
}

export class MyProfileDto {
  @ApiProperty({ type: MyProfileUserDto })
  user!: MyProfileUserDto;

  @ApiProperty({ type: MyProfileMemberDto })
  member!: MyProfileMemberDto;

  @ApiProperty({ type: MyProfileGymDto })
  gym!: MyProfileGymDto;
}
