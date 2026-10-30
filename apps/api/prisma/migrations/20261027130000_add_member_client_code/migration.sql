-- 1. Añadir la columna "clientCode" como opcional.
ALTER TABLE "Member" ADD COLUMN "clientCode" VARCHAR(30);

-- 2. Rellenar las filas existentes con un código secuencial por gimnasio.
UPDATE "Member" AS m
SET "clientCode" = 'C' || LPAD(seq::text, 4, '0')
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "gymId" ORDER BY "createdAt", id) AS seq
    FROM "Member"
) AS s
WHERE m.id = s.id;

-- 3. Una vez poblados los datos, convertir la columna en obligatoria.
ALTER TABLE "Member" ALTER COLUMN "clientCode" SET NOT NULL;

-- 4. Crear el índice único por gimnasio.
CREATE UNIQUE INDEX "Member_gymId_clientCode_key" ON "Member"("gymId", "clientCode");
