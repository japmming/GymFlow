-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'PEN';

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "logoUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "Gym" ADD COLUMN "openingHours" JSONB;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "deactivatedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "instructorName" VARCHAR(100);
