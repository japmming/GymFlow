import {
  ArrowDownRight,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: 'brand' | 'success' | 'info' | 'warning';
  delta?: number | null;
  deltaLabel?: string;
  footer?: ReactNode;
  children?: ReactNode;
}

function Delta({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className="delta delta--neutral">
        Sin comparativa
      </span>
    );
  }

  if (Math.abs(value) < 0.05) {
    return (
      <span className="delta delta--neutral">0.0%</span>
    );
  }

  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={
        positive ? 'delta delta--up' : 'delta delta--down'
      }
    >
      <Icon size={12} aria-hidden="true" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  deltaLabel,
  footer,
  children,
}: KpiCardProps) {
  return (
    <article className="kpi-card">
      <div className="kpi-card-head">
        <span className="kpi-label">{label}</span>

        <span
          className={`kpi-icon kpi-icon--${tone}`}
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
      </div>

      <strong className="kpi-value">{value}</strong>

      {(delta !== undefined || deltaLabel) && (
        <div className="kpi-meta">
          {delta !== undefined && <Delta value={delta} />}
          {deltaLabel && <span>{deltaLabel}</span>}
        </div>
      )}

      {children}

      {footer && <div className="kpi-footer">{footer}</div>}
    </article>
  );
}
