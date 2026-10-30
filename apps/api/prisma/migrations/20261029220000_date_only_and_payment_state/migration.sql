-- Zona horaria del gimnasio
ALTER TABLE "Gym"
ADD COLUMN "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Lima';

-- Precio histórico de la membresía
ALTER TABLE "Membership"
ADD COLUMN "price" DECIMAL(10, 2);

UPDATE "Membership" AS membership
SET "price" = plan."price"
FROM "Plan" AS plan
WHERE membership."planId" = plan."id"
  AND membership."price" IS NULL;

UPDATE "Membership"
SET "price" = 0
WHERE "price" IS NULL;

ALTER TABLE "Membership"
ALTER COLUMN "price" SET NOT NULL;

-- Fecha de cancelación
ALTER TABLE "Membership"
ADD COLUMN "cancelledAt" TIMESTAMP(3);

UPDATE "Membership"
SET "cancelledAt" = "updatedAt"
WHERE "status" = 'CANCELLED'
  AND "cancelledAt" IS NULL;

-- Las fechas de membresía pasan a ser días completos, no timestamps.
-- En la base anterior el día ya estaba guardado como fecha de calendario,
-- así que se conserva directamente y no se vuelve a convertir de zona.
ALTER TABLE "Membership"
ALTER COLUMN "startDate" TYPE DATE
USING ("startDate"::date),
ALTER COLUMN "endDate" TYPE DATE
USING ("endDate"::date);

-- Estado de reverso de pagos
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'REFUNDED');

ALTER TABLE "Payment"
ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "reversedAt" TIMESTAMP(3);

CREATE INDEX "Payment_gymId_status_idx"
ON "Payment"("gymId", "status");

-- Fecha local de asistencia para el control diario y los reportes.
-- El timestamp anterior guardaba la hora local del gimnasio, así que su
-- componente de fecha ya corresponde al día de ingreso.
ALTER TABLE "Attendance"
ADD COLUMN "attendanceDate" DATE;

UPDATE "Attendance"
SET "attendanceDate" = "checkedInAt"::date
WHERE "attendanceDate" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Attendance"
    GROUP BY "gymId", "memberId", "attendanceDate"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay asistencias duplicadas para el mismo socio y día. Corrige los datos antes de aplicar la migración.';
  END IF;
END $$;

ALTER TABLE "Attendance"
ALTER COLUMN "attendanceDate" SET NOT NULL;

CREATE UNIQUE INDEX "Attendance_gymId_memberId_attendanceDate_key"
ON "Attendance"("gymId", "memberId", "attendanceDate");

CREATE INDEX "Attendance_gymId_attendanceDate_idx"
ON "Attendance"("gymId", "attendanceDate");
