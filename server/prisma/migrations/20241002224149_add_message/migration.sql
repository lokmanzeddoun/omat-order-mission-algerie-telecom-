-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('FORGET_PASSWORD', 'DECOMPTE_STATUS', 'OTHER');

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" SERIAL NOT NULL,
    "type" "MessageType" NOT NULL,
    "status" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "decompteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soft_delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_decompteId_fkey" FOREIGN KEY ("decompteId") REFERENCES "Decompte"("n_decompte") ON DELETE RESTRICT ON UPDATE CASCADE;
