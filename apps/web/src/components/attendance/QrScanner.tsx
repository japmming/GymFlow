import { useEffect, useId, useRef } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';

interface QrScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
}

const UNLOCK_DELAY_MS = 600;

async function stopAndClear(
  scanner: Html5Qrcode,
): Promise<void> {
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // El escáner ya se detuvo (o React ya removió el DOM).
  }

  try {
    scanner.clear();
  } catch {
    // clear() lanza si aún está escaneando; se ignora al desmontar.
  }
}

export function QrScanner({
  onScan,
  onError,
}: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  const rawId = useId();
  const elementId = `gymflow-qr-reader-${rawId.replace(
    /[^a-zA-Z0-9_-]/g,
    '',
  )}`;

  // Mantiene las callbacks al día sin reiniciar la cámara.
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let disposed = false;
    let unlockTimer:
      | ReturnType<typeof setTimeout>
      | undefined;

    // Se difiere la creación para sobrevivir al doble montaje de
    // StrictMode: el primer efecto se limpia antes de que este
    // temporizador se dispare, así solo se crea un escáner.
    const startTimer = setTimeout(() => {
      if (disposed) {
        return;
      }

      const scanner = new Html5Qrcode(elementId, {
        verbose: false,
        useBarCodeDetectorIfSupported: true,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      });

      scannerRef.current = scanner;

      const handleSuccess = (
        decodedText: string,
      ) => {
        if (disposed) {
          return;
        }

        if (unlockTimer) {
          clearTimeout(unlockTimer);
          unlockTimer = undefined;
        }

        if (scannedRef.current) {
          return;
        }

        scannedRef.current = true;
        onScanRef.current(decodedText);
      };

      const handleFailure = () => {
        // Cuando el QR sale del encuadre se vuelve a
        // habilitar la lectura tras un pequeño margen.
        if (
          disposed ||
          !scannedRef.current ||
          unlockTimer
        ) {
          return;
        }

        unlockTimer = setTimeout(() => {
          scannedRef.current = false;
          unlockTimer = undefined;
        }, UNLOCK_DELAY_MS);
      };

      void (async () => {
        try {
          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            handleSuccess,
            handleFailure,
          );

          // Se desmontó mientras la cámara arrancaba.
          if (disposed) {
            await stopAndClear(scanner);
          }
        } catch (error) {
          if (disposed) {
            return;
          }

          console.error(
            'Error iniciando lector QR:',
            error,
          );

          onErrorRef.current?.(
            'No se pudo acceder a la cámara. Verifica los permisos del navegador.',
          );
        }
      })();
    }, 0);

    return () => {
      disposed = true;

      clearTimeout(startTimer);

      if (unlockTimer) {
        clearTimeout(unlockTimer);
      }

      const scanner = scannerRef.current;

      scannerRef.current = null;

      if (scanner) {
        void stopAndClear(scanner);
      }
    };
  }, [elementId]);

  return (
    <div className="qr-scanner-wrapper">
      <div id={elementId} className="qr-reader" />

      <p className="qr-scanner-help">
        Coloca el código QR dentro del recuadro.
      </p>
    </div>
  );
}
