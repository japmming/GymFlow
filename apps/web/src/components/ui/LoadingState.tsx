interface LoadingStateProps {
  label: string;
  compact?: boolean;
}

export function LoadingState({
  label,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={
        compact
          ? 'loading-state loading-state--compact'
          : 'loading-state'
      }
      role="status"
    >
      <span className="app-spinner" aria-hidden="true" />

      <span>{label}</span>
    </div>
  );
}
