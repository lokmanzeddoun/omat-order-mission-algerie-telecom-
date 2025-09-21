-- DropForeignKey
ALTER TABLE "Commentaire" DROP CONSTRAINT "Commentaire_decompteId_fkey";

-- AlterTable
ALTER TABLE "Commentaire" ALTER COLUMN "decompteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_decompteId_fkey" FOREIGN KEY ("decompteId") REFERENCES "Decompte"("n_decompte") ON DELETE SET NULL ON UPDATE CASCADE;
