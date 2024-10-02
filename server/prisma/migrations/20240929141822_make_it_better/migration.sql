-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('NORD', 'SUD');

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "direction" "Direction" NOT NULL DEFAULT 'NORD';
