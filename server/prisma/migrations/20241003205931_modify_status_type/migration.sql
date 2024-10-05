/*
  Warnings:

  - The values [PENDING] on the enum `MissionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MissionStatus_new" AS ENUM ('INPROGRESS', 'COMPLETED');
ALTER TABLE "Mission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Mission" ALTER COLUMN "status" TYPE "MissionStatus_new" USING ("status"::text::"MissionStatus_new");
ALTER TYPE "MissionStatus" RENAME TO "MissionStatus_old";
ALTER TYPE "MissionStatus_new" RENAME TO "MissionStatus";
DROP TYPE "MissionStatus_old";
ALTER TABLE "Mission" ALTER COLUMN "status" SET DEFAULT 'INPROGRESS';
COMMIT;
