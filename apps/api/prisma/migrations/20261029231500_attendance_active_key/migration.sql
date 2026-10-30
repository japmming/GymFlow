-- Permitir varias asistencias anuladas por día conservando una sola activa.
-- PostgreSQL trata los NULL como distintos en un unique, por lo que los
-- registros anulados (activeKey = NULL) no bloquean nuevas anulaciones.
ALTER TABLE "Attendance"
ADD COLUMN "activeKey" VARCHAR(10);

UPDATE "Attendance"
SET "activeKey" = CASE WHEN "cancelled" THEN NULL ELSE 'ACTIVE' END;

DROP INDEX IF EXISTS "Attendance_gymId_memberId_attendanceDate_cancelled_key";

CREATE UNIQUE INDEX "Attendance_gymId_memberId_attendanceDate_activeKey_key"
ON "Attendance"("gymId", "memberId", "attendanceDate", "activeKey");
