export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Cargando panel general...</span>

      <div className="skeleton-heading">
        <span className="skeleton-line skeleton-line--eyebrow" />
        <span className="skeleton-line skeleton-line--title" />
        <span className="skeleton-line skeleton-line--subtitle" />
      </div>

      <div className="kpi-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-row">
              <span className="skeleton-line skeleton-line--label" />
              <span className="skeleton-dot" />
            </div>
            <span className="skeleton-line skeleton-line--value" />
            <span className="skeleton-line skeleton-line--meta" />
          </div>
        ))}
      </div>

      <div className="dashboard-analytics">
        <div className="skeleton-card skeleton-card--chart">
          <span className="skeleton-line skeleton-line--label" />
          <div className="skeleton-bars" aria-hidden="true">
            {[42, 64, 38, 78, 56, 92].map((height, index) => (
              <span
                key={index}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="skeleton-card skeleton-card--chart">
          <span className="skeleton-line skeleton-line--label" />
          <div className="skeleton-donut" aria-hidden="true" />
        </div>
      </div>

      <div className="dashboard-operations">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <span className="skeleton-line skeleton-line--label" />

            {Array.from({ length: 4 }, (_, row) => (
              <div className="skeleton-row" key={row}>
                <span className="skeleton-dot" />
                <span className="skeleton-line skeleton-line--meta" />
                <span className="skeleton-line skeleton-line--pill" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
