import { useMemo } from 'react';

import type { Membership } from '../../types/membership';
import { todayDateKey } from '../../utils/date';
import { EmptyState } from '../ui/EmptyState';

const RADIUS = 58;
const CENTER = 80;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MembershipDonut({
  memberships,
}: {
  memberships: Membership[];
}) {
  const segments = useMemo(() => {
    const today = todayDateKey();

    const active = memberships.filter(
      (membership) =>
        membership.status === 'ACTIVE' &&
        membership.endDate >= today,
    );

    const counts = new Map<string, number>();

    for (const membership of active) {
      const name = membership.plan.name;

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [memberships]);

  const total = segments.reduce(
    (sum, segment) => sum + segment.count,
    0,
  );

  if (total === 0) {
    return (
      <section className="dashboard-card">
        <div className="card-head">
          <div>
            <h2>Membresías activas</h2>
            <p>Distribución por plan</p>
          </div>
        </div>

        <EmptyState
          compact
          icon="🎫"
          title="Sin membresías activas"
          description="Cuando registres membresías vigentes verás aquí su distribución."
        />
      </section>
    );
  }

  let offset = 0;

  return (
    <section className="dashboard-card">
      <div className="card-head">
        <div>
          <h2>Membresías activas</h2>
          <p>Distribución por plan</p>
        </div>

        <span className="card-count">{total}</span>
      </div>

      <div className="donut-body">
        <div className="donut-wrap">
          <svg
            viewBox="0 0 160 160"
            className="donut-svg"
            role="img"
            aria-label={`Distribución de ${total} membresías activas: ${segments
              .map(
                (segment) =>
                  `${segment.name}, ${segment.count}`,
              )
              .join('; ')}.`}
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--surface-inset)"
              strokeWidth={STROKE}
            />

            {segments.map((segment, index) => {
              const length =
                (segment.count / total) * CIRCUMFERENCE;
              const dash = Math.max(length - 3, 0);
              const dashOffset = -offset;

              offset += length;

              return (
                <circle
                  key={segment.name}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={`var(--chart-${(index % 5) + 1})`}
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${
                    CIRCUMFERENCE - dash
                  }`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
              );
            })}

            <text
              x={CENTER}
              y={74}
              textAnchor="middle"
              className="donut-total"
            >
              {total}
            </text>

            <text
              x={CENTER}
              y={93}
              textAnchor="middle"
              className="donut-caption"
            >
              activas
            </text>
          </svg>
        </div>

        <div className="donut-legend">
          {segments.map((segment, index) => {
            const percentage = Math.round(
              (segment.count / total) * 100,
            );

            return (
              <div
                className="donut-legend-item"
                key={segment.name}
              >
                <span
                  className="donut-dot"
                  style={{
                    background: `var(--chart-${
                      (index % 5) + 1
                    })`,
                  }}
                  aria-hidden="true"
                />

                <span className="donut-legend-name">
                  {segment.name}
                </span>

                <span className="donut-legend-value">
                  {segment.count} · {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
