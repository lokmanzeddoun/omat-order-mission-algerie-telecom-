-- Interim / Remplaçant periods and the snapshots that make a décompte immune
-- to later category or barème changes.

-- CreateEnum
CREATE TYPE "GradeAssignmentKind" AS ENUM ('INTERIM', 'REMPLACANT');

-- CreateTable
CREATE TABLE "GradeAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "GradeAssignmentKind" NOT NULL,
    "targetCategory" "Category" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "decisionRef" TEXT NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER,

    CONSTRAINT "GradeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradeAssignment_userId_startDate_idx" ON "GradeAssignment"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "GradeAssignment" ADD CONSTRAINT "GradeAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAssignment" ADD CONSTRAINT "GradeAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN "effectiveCategory" "Category",
ADD COLUMN "gradeAssignmentId" INTEGER;

-- AlterTable
ALTER TABLE "Decompte" ADD COLUMN "barem_repas_nord" DOUBLE PRECISION,
ADD COLUMN "barem_hebergement_nord" DOUBLE PRECISION,
ADD COLUMN "barem_repas_sud" DOUBLE PRECISION,
ADD COLUMN "barem_hebergement_sud" DOUBLE PRECISION,
ADD COLUMN "barem_montant_km" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_gradeAssignmentId_fkey" FOREIGN KEY ("gradeAssignmentId") REFERENCES "GradeAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing ordre keeps its agent's current category (no period),
-- and every existing décompte freezes the barème rates that category has today.
-- Stored montants are untouched, so no existing amount changes.
UPDATE "Mission" m
SET "effectiveCategory" = u."category"
FROM "User" u
WHERE u."matricule" = m."userId";

UPDATE "Decompte" d
SET "barem_repas_nord" = b."repas_nord",
    "barem_hebergement_nord" = b."hebergement_nord",
    "barem_repas_sud" = b."repas_sud",
    "barem_hebergement_sud" = b."hebergement_sud",
    "barem_montant_km" = b."montant_km"
FROM "Mission" m,
     LATERAL (
       SELECT * FROM "Barem"
       WHERE "libell" = m."effectiveCategory"
       ORDER BY "id"
       LIMIT 1
     ) b
WHERE m."n_mission" = d."missionId";
