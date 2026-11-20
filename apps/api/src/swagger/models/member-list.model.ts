import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from './common.model';
import { MemberResponseDto } from './member.model';
import { MembershipEntityDto } from './membership.model';

export class MemberListItemResponseDto extends MemberResponseDto {
  @ApiProperty({
    description:
      'Membresía más reciente del socio, o null si todavía no tiene ninguna.',
    type: () => MembershipEntityDto,
    nullable: true,
  })
  latestMembership!: MembershipEntityDto | null;
}

export class PaginatedMembersResponseDto {
  @ApiProperty({
    description: 'Socios de la página solicitada.',
    type: [MemberListItemResponseDto],
  })
  data!: MemberListItemResponseDto[];

  @ApiProperty({
    description: 'Información de paginación.',
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
