-- CreateTable
CREATE TABLE "Mission" (
    "n_mission" SERIAL NOT NULL,
    "date_sortie" TIMESTAMP(3) NOT NULL,
    "heure_sortie" TIMESTAMPTZ NOT NULL,
    "date_retour" TIMESTAMP(3) NOT NULL,
    "heure_retour" TIMESTAMPTZ NOT NULL,
    "motif" TEXT NOT NULL,
    "transport" TEXT NOT NULL,
    "Destination" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("n_mission")
);

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;
