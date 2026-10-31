-- Usuarios del sistema y sesiones renovables.
-- Los refresh tokens se guardan hasheados y se rotan en cada renovación.
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RECEPTION');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "gymId" UUID NOT NULL,
  "email" VARCHAR(150) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'RECEPTION',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "revokedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_gymId_email_key"
ON "User"("gymId", "email");

CREATE INDEX "User_gymId_role_idx"
ON "User"("gymId", "role");

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key"
ON "RefreshToken"("tokenHash");

CREATE INDEX "RefreshToken_userId_expiresAt_idx"
ON "RefreshToken"("userId", "expiresAt");

ALTER TABLE "User"
ADD CONSTRAINT "User_gymId_fkey"
FOREIGN KEY ("gymId") REFERENCES "Gym"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
ADD CONSTRAINT "RefreshToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
