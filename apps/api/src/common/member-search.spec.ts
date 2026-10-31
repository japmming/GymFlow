import { buildMemberSearchTerm, buildMemberSearchTerms } from './member-search';

describe('member-search', () => {
  it('devuelve null cuando la búsqueda está vacía', () => {
    expect(buildMemberSearchTerms()).toBeNull();
    expect(buildMemberSearchTerms('')).toBeNull();
    expect(buildMemberSearchTerms('   ')).toBeNull();
  });

  it('divide la búsqueda en términos ignorando espacios repetidos', () => {
    const terms = buildMemberSearchTerms('  Ana   Perez  ');

    expect(terms).toHaveLength(2);
  });

  it('busca cada término en nombre, apellido, DNI y código', () => {
    const term = buildMemberSearchTerm('ana');

    expect(term).toEqual({
      OR: [
        { firstName: { contains: 'ana', mode: 'insensitive' } },
        { lastName: { contains: 'ana', mode: 'insensitive' } },
        { documentNumber: { contains: 'ana', mode: 'insensitive' } },
        { memberCode: { contains: 'ana', mode: 'insensitive' } },
      ],
    });
  });

  it('permite buscar nombre completo en cualquier orden', () => {
    const terms = buildMemberSearchTerms('Perez Ana');

    expect(terms?.map((term) => term.OR)).toEqual([
      [
        { firstName: { contains: 'Perez', mode: 'insensitive' } },
        { lastName: { contains: 'Perez', mode: 'insensitive' } },
        {
          documentNumber: {
            contains: 'Perez',
            mode: 'insensitive',
          },
        },
        { memberCode: { contains: 'Perez', mode: 'insensitive' } },
      ],
      [
        { firstName: { contains: 'Ana', mode: 'insensitive' } },
        { lastName: { contains: 'Ana', mode: 'insensitive' } },
        { documentNumber: { contains: 'Ana', mode: 'insensitive' } },
        { memberCode: { contains: 'Ana', mode: 'insensitive' } },
      ],
    ]);
  });
});
