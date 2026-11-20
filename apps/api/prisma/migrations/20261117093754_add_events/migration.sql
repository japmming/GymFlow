-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CLASS', 'WORKSHOP', 'COMPETITION');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "gymId" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(1000),
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "requiresActiveMembership" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_gymId_status_idx" ON "Event"("gymId", "status");

-- CreateIndex
CREATE INDEX "Event_gymId_type_idx" ON "Event"("gymId", "type");

-- CreateIndex
CREATE INDEX "Event_gymId_startDate_idx" ON "Event"("gymId", "startDate");

-- CreateIndex
CREATE INDEX "Event_gymId_status_startDate_idx" ON "Event"("gymId", "status", "startDate");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
