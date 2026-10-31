-- Auditoría de la regeneración del código QR del socio.
-- El token anterior deja de ser válido al reemplazarse "qrToken".
ALTER TABLE "Member"
ADD COLUMN "qrTokenRegeneratedAt" TIMESTAMPTZ(3),
ADD COLUMN "qrTokenRegenerationReason" VARCHAR(255);
