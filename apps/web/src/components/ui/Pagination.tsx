interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="button secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </button>

      <span className="pagination-status" aria-live="polite">
        <strong>
          {firstItem}–{lastItem}
        </strong>{' '}
        de {totalItems}
        <span className="pagination-page">
          Página {page} de {totalPages}
        </span>
      </span>

      <button
        type="button"
        className="button secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
