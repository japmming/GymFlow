import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={
        compact ? 'empty-state empty-state--compact' : 'empty-state'
      }
    >
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}

      <h3>{title}</h3>

      {description && <p>{description}</p>}

      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
