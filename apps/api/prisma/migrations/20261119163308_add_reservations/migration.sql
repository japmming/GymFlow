-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PARTIALLY_PAID', 'PAID');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "gymId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "paymentStatus" "ReservationPaymentStatus" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reservedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPayment" (
    "id" UUID NOT NULL,
    "gymId" UUID NOT NULL,
    "reservationId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "reference" VARCHAR(100),
    "notes" VARCHAR(500),
    "paymentDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_gymId_eventId_status_idx" ON "Reservation"("gymId", "eventId", "status");

-- CreateIndex
CREATE INDEX "Reservation_gymId_memberId_idx" ON "Reservation"("gymId", "memberId");

-- CreateIndex
CREATE INDEX "Reservation_gymId_paymentStatus_idx" ON "Reservation"("gymId", "paymentStatus");

-- CreateIndex
CREATE INDEX "EventPayment_gymId_reservationId_idx" ON "EventPayment"("gymId", "reservationId");

-- CreateIndex
CREATE INDEX "EventPayment_gymId_paymentDate_idx" ON "EventPayment"("gymId", "paymentDate");

-- CreateIndex
CREATE INDEX "EventPayment_gymId_status_idx" ON "EventPayment"("gymId", "status");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPayment" ADD CONSTRAINT "EventPayment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPayment" ADD CONSTRAINT "EventPayment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Reservation_one_active_per_member_event"
ON "Reservation" ("gymId", "eventId", "memberId")
WHERE "status" <> 'CANCELLED';
