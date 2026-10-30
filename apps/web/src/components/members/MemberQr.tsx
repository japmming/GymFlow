import { QRCodeSVG } from 'qrcode.react';

interface MemberQrProps {
  memberName: string;
  qrToken: string;
  onClose: () => void;
}

export function MemberQr({
  memberName,
  qrToken,
  onClose,
}: MemberQrProps) {
  return (
    <div className="modal-overlay">
      <div className="modal qr-modal">
        <div className="modal-header">
          <div>
            <h2>QR del miembro</h2>
            <p>{memberName}</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="member-qr-container">
          <QRCodeSVG
            value={qrToken}
            size={280}
            level="M"
            includeMargin
          />

          <p className="qr-member-name">
            {memberName}
          </p>

          <p className="qr-help-text">
            Este código se utiliza para registrar
            la asistencia del miembro.
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => window.print()}
          >
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}