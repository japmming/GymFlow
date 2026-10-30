import { Prisma } from '../generated/prisma/client';

export function buildMemberSearchTerm(term: string): Prisma.MemberWhereInput {
  return {
    OR: [
      {
        firstName: {
          contains: term,
          mode: 'insensitive',
        },
      },
      {
        lastName: {
          contains: term,
          mode: 'insensitive',
        },
      },
      {
        documentNumber: {
          contains: term,
          mode: 'insensitive',
        },
      },
      {
        memberCode: {
          contains: term,
          mode: 'insensitive',
        },
      },
    ],
  };
}

/**
 * Divide la búsqueda en términos y exige que todos coincidan.
 * Permite buscar "nombre apellido" o "apellido nombre" sin
 * depender del orden en que se guardaron los campos.
 */
export function buildMemberSearchTerms(
  search?: string,
): Prisma.MemberWhereInput[] | null {
  const terms = search?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (terms.length === 0) {
    return null;
  }

  return terms.map(buildMemberSearchTerm);
}
