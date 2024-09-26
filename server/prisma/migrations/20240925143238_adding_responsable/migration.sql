/*
  Warnings:

  - Added the required column `responsableId` to the `Mission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "quality" TEXT,
ADD COLUMN     "responsableId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("matricule") ON DELETE RESTRICT ON UPDATE CASCADE;
