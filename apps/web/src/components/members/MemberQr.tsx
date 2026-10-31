import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

import { regenerateMemberQr } from '../../services/api';

interface MemberQrProps {
  memberId: string;
  memberName: string;
  memberCode: string;
  qrToken: string;
  onTokenChange: (qrToken: string) => void;
  onClose: () => void;
}

type CopyTarget = 'code' | 'token';

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('No se pudo copiar al portapapeles.');
  }
}

export function MemberQr({
  memberId,
  memberName,
  memberCode,
  qrToken,
  onTokenChange,
  onClose,
}: MemberQrProps) {
  const [token, setToken] = useState(qrToken);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [reason, setReason] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setToken(qrToken);
  }, [qrToken]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(null);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  async function handleCopy(value: string, target: CopyTarget) {
    try {
      await copyToClipboard(value);
      setCopied(target);
      setError('');
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : 'No se pudo copiar al portapapeles.',
      );
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;

    if (!canvas) {
      setError('No se pudo generar la imagen del QR.');
      return;
    }

    const safeCode = memberCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');

    link.href = canvas.toDataURL('image/png');
    link.download = `qr-${safeCode}.png`;
    link.click();
  }

  async function handleRegenerate() {
    try {
      setRegenerating(true);
      setError('');
      setNotice('');

      const member = await regenerateMemberQr(
        memberId,
        reason.trim() || undefined,
      );

      setToken(member.qrToken);
      onTokenChange(member.qrToken);
      setShowRegenerate(false);
      setReason('');
      setNotice(
        'QR regenerado. El código anterior ya no es válido.',
      );
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error
          ? regenerateError.message
          : 'No se pudo regenerar el QR.',
      );
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-qr-title"
    >
      <div className="modal qr-modal">
        <div className="modal-header">
          <div>
            <h2 id="member-qr-title">QR del socio</h2>
            <p>{memberName}</p>
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

        <div className="member-qr-container">
          <div className="member-qr-code">
            <QRCodeSVG
              value={token}
              size={280}
              level="M"
              includeMargin
            />

            <QRCodeCanvas
              ref={canvasRef}
              value={token}
              size={560}
              level="M"
              includeMargin
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          <p className="qr-member-name">{memberName}</p>

          <div className="qr-member-code">
            <span className="qr-member-code-label">
              Código de socio
            </span>

            <span className="qr-member-code-value">
              {memberCode}
            </span>

            <button
              type="button"
              className="qr-copy-button"
              onClick={() => {
                void handleCopy(memberCode, 'code');
              }}
            >
              {copied === 'code' ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <p className="qr-help-text">
            Presenta este código en recepción para registrar
            la asistencia.
          </p>

          <button
            type="button"
            className="qr-link-button"
            onClick={() => {
              void handleCopy(token, 'token');
            }}
          >
            {copied === 'token'
              ? 'Contenido del QR copiado'
              : 'Copiar contenido del QR'}
          </button>

          {notice && (
            <p className="qr-feedback success" role="status">
              {notice}
            </p>
          )}

          {error && (
            <p className="qr-feedback error" role="alert">
              {error}
            </p>
          )}
        </div>

        {showRegenerate && (
          <div className="qr-regenerate-panel">
            <p className="qr-regenerate-title">
              Regenerar el QR
            </p>

            <p className="qr-regenerate-warning">
              El QR actual dejará de funcionar de inmediato.
              Deberás entregar o imprimir el nuevo código.
            </p>

            <label
              className="qr-regenerate-reason"
              htmlFor="qr-regeneration-reason"
            >
              Motivo (opcional)

              <input
                id="qr-regeneration-reason"
                value={reason}
                maxLength={255}
                placeholder="Ej. El socio perdió su tarjeta"
                disabled={regenerating}
                onChange={(event) =>
                  setReason(event.target.value)
                }
              />
            </label>

            <div className="qr-regenerate-actions">
              <button
                type="button"
                className="button secondary"
                disabled={regenerating}
                onClick={() => {
                  setShowRegenerate(false);
                  setReason('');
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button danger"
                disabled={regenerating}
                onClick={() => {
                  void handleRegenerate();
                }}
              >
                {regenerating
                  ? 'Regenerando...'
                  : 'Confirmar regeneración'}
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions qr-actions">
          <button
            type="button"
            className="button secondary"
            onClick={handleDownload}
          >
            Descargar PNG
          </button>

          <button
            type="button"
            className="button secondary"
            onClick={() => window.print()}
          >
            Imprimir
          </button>

          {!showRegenerate && (
            <button
              type="button"
              className="button danger"
              onClick={() => {
                setShowRegenerate(true);
                setNotice('');
                setError('');
              }}
            >
              Regenerar QR
            </button>
          )}

          <button
            type="button"
            className="button primary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
