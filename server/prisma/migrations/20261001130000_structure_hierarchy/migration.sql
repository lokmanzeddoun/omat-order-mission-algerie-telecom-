-- Hierarchical structures (ADR 0004). Existing flat structures stay roots
-- (parentCode NULL); a root's code is its abbreviation, so nothing is re-keyed.

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "parentCode" TEXT,
ADD COLUMN     "responsible_user_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Structure_responsible_user_id_key" ON "Structure"("responsible_user_id");

-- CreateIndex
CREATE INDEX "Structure_parentCode_idx" ON "Structure"("parentCode");

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "Structure"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;

-- A structure without a responsible is visible only to its ancestors' admins and
-- super admins (ADR 0004). So that no existing admin loses access on deploy, the
-- lowest-matricule active ADMIN of each structure becomes its responsible.
UPDATE "Structure" s
SET "responsible_user_id" = pick."matricule"
FROM (
  SELECT DISTINCT ON ("serviceId") "serviceId", "matricule"
  FROM "User"
  WHERE "role" = 'ADMIN'
    AND "serviceId" IS NOT NULL
    AND COALESCE("soft_delete", false) = false
  ORDER BY "serviceId", "matricule"
) pick
WHERE s."code" = pick."serviceId";
