-- Motivo de reverso del pago
ALTER TABLE "Payment"
ADD COLUMN "reversalReason" VARCHAR(255);

-- Motivo de cancelación de la membresía
ALTER TABLE "Membership"
ADD COLUMN "cancellationReason" VARCHAR(255);

-- Anulación auditada de asistencias.
-- El unique incluye "cancelled" para permitir un registro activo y uno anulado
-- por socio y día, sin perder el historial.
ALTER TABLE "Attendance"
ADD COLUMN "cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancelledAt" TIMESTAMPTZ(3),
ADD COLUMN "cancellationReason" VARCHAR(255);

DROP INDEX IF EXISTS "Attendance_gymId_memberId_attendanceDate_key";

CREATE UNIQUE INDEX "Attendance_gymId_memberId_attendanceDate_cancelled_key"
ON "Attendance"("gymId", "memberId", "attendanceDate", "cancelled");
