-- Renombrar la columna para mantener la nomenclatura del modelo Member.
ALTER TABLE "Member" RENAME COLUMN "clientCode" TO "memberCode";

-- Renombrar el índice único asociado.
ALTER INDEX "Member_gymId_clientCode_key" RENAME TO "Member_gymId_memberCode_key";
