/*
  Warnings:

  - Added the required column `montant` to the `Decompte` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Decompte" ADD COLUMN     "montant" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "parcours" DOUBLE PRECISION;
