import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';

interface ModalProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function Modal({
  title,
  description,
  children,
  onClose,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Mantiene el callback al día sin reiniciar los efectos del modal.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const preferred =
      dialog?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialog?.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ) ??
      dialog;

    preferred?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) {
        return;
      }

      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ),
      ).filter((node) => node.offsetParent !== null);

      if (nodes.length === 0) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const { overflow } = document.body.style;

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={
          className ? `modal ${className}` : 'modal'
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description ? descriptionId : undefined
        }
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>

            {description && (
              <p id={descriptionId}>{description}</p>
            )}
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
