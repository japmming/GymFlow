-- Los timestamps anteriores guardaban la hora local del gimnasio sin zona.
-- Se convierten a timestamptz para conservar el instante real y que la API
-- entregue horas correctas independientemente de la zona del servidor.
ALTER TABLE "Gym"
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3)
  USING ("updatedAt" AT TIME ZONE 'America/Lima');

ALTER TABLE "Member"
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3)
  USING ("updatedAt" AT TIME ZONE 'America/Lima');

ALTER TABLE "Plan"
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3)
  USING ("updatedAt" AT TIME ZONE 'America/Lima');

ALTER TABLE "Membership"
ALTER COLUMN "cancelledAt" TYPE TIMESTAMPTZ(3)
  USING ("cancelledAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3)
  USING ("updatedAt" AT TIME ZONE 'America/Lima');

ALTER TABLE "Payment"
ALTER COLUMN "paymentDate" TYPE TIMESTAMPTZ(3)
  USING ("paymentDate" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "reversedAt" TYPE TIMESTAMPTZ(3)
  USING ("reversedAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3)
  USING ("updatedAt" AT TIME ZONE 'America/Lima');

ALTER TABLE "Attendance"
ALTER COLUMN "checkedInAt" TYPE TIMESTAMPTZ(3)
  USING ("checkedInAt" AT TIME ZONE 'America/Lima'),
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING ("createdAt" AT TIME ZONE 'America/Lima');
