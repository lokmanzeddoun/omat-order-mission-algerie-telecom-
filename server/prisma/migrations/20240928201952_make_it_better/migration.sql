/*
  Warnings:

  - You are about to drop the column `montant` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `responsableId` on the `Mission` table. All the data in the column will be lost.
  - Changed the type of `transport` on the `Mission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('SERVICE_CAR', 'PERSONAL_CAR', 'TRANSPORT_ENTREPRISE', 'TRANSPORT_EMPLOYEE');

-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_responsableId_fkey";

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "montant",
DROP COLUMN "quality",
DROP COLUMN "responsableId",
DROP COLUMN "transport",
ADD COLUMN     "transport" "TransportType" NOT NULL;

-- DropEnum
DROP TYPE "UniteType";
