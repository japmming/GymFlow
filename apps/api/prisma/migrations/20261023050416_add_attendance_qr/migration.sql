/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - The required column `qrToken` was added to the `Member` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/

-- 1. Añadir la columna "qrToken" como opcional (eliminamos el NOT NULL inicialmente)
ALTER TABLE "Member" ADD COLUMN "qrToken" UUID;

-- 2. Rellenar las filas existentes con un UUID aleatorio generado por PostgreSQL
UPDATE "Member" SET "qrToken" = gen_random_uuid() WHERE "qrToken" IS NULL;

-- 3. Una vez poblados los datos, convertimos la columna en obligatoria (NOT NULL)
ALTER TABLE "Member" ALTER COLUMN "qrToken" SET NOT NULL;

-- 4. Crear el índice único para "qrToken" en la tabla "Member"
CREATE UNIQUE INDEX "Member_qrToken_key" ON "Member"("qrToken");


-- -- CreateTable (Mantenemos la creación de la tabla Attendance intacta)
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "gymId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "membershipId" UUID,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_gymId_checkedInAt_idx" ON "Attendance"("gymId", "checkedInAt");

-- CreateIndex
CREATE INDEX "Attendance_gymId_memberId_checkedInAt_idx" ON "Attendance"("gymId", "memberId", "checkedInAt");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
