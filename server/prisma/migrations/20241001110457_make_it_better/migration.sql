/*
  Warnings:

  - You are about to drop the column `Destination` on the `Mission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "Destination",
ADD COLUMN     "destination" TEXT;
