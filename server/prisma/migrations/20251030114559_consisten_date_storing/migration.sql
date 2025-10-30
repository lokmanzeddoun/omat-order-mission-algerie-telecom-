/*
  Warnings:

  - You are about to drop the column `heure_retour` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `heure_sortie` on the `Mission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "heure_retour",
DROP COLUMN "heure_sortie";
