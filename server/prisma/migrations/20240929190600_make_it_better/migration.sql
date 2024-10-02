-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'INPROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "status" "MissionStatus" DEFAULT 'INPROGRESS';
