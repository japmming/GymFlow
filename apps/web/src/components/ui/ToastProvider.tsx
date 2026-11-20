import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastTone = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const TOAST_DURATION_MS = 4000;
const MAX_VISIBLE_TOASTS = 3;

const ToastContext = createContext<ToastContextValue | null>(
  null,
);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const nextId = useRef(0);
  const timers = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );

  const dismiss = useCallback((id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    );

    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = (nextId.current += 1);

      setToasts((current) => [
        ...current.slice(-(MAX_VISIBLE_TOASTS - 1)),
        { id, message, tone },
      ]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;

    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="toast-region"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.tone}`}
          >
            <span aria-hidden="true" className="toast-icon">
              {toast.tone === 'success' ? '✓' : '!'}
            </span>

            <span className="toast-message">
              {toast.message}
            </span>

            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast debe usarse dentro de ToastProvider.',
    );
  }

  return context;
}
