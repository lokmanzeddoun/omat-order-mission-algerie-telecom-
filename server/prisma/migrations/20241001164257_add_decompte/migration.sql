-- CreateEnum
CREATE TYPE "DecompteStatus" AS ENUM ('REGECTED', 'ACCEPTED', 'PENDING');

-- CreateTable
CREATE TABLE "Decompte" (
    "n_decompte" SERIAL NOT NULL,
    "repas_pec" INTEGER NOT NULL DEFAULT 0,
    "repas_sans_pec" INTEGER NOT NULL DEFAULT 0,
    "hebergement_pec" INTEGER NOT NULL DEFAULT 0,
    "hebergement_sans_pec" INTEGER NOT NULL DEFAULT 0,
    "status" "DecompteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soft_delete" BOOLEAN NOT NULL DEFAULT false,
    "missionId" INTEGER NOT NULL,

    CONSTRAINT "Decompte_pkey" PRIMARY KEY ("n_decompte")
);

-- AddForeignKey
ALTER TABLE "Decompte" ADD CONSTRAINT "Decompte_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("n_mission") ON DELETE RESTRICT ON UPDATE CASCADE;
