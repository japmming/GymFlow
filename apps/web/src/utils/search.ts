export function normalizeSearchText(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Comprueba que todos los términos de la búsqueda aparezcan en
 * alguno de los campos. Permite buscar "nombre apellido" sin
 * depender del orden ni de las tildes.
 */
export function matchesSearch(
  values: Array<string | null | undefined>,
  query: string,
): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = normalizeSearchText(
    values.filter(Boolean).join(' '),
  );

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}
