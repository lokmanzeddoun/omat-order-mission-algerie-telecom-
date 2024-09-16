-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "soft_delete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "soft_delete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "soft_delete" BOOLEAN NOT NULL DEFAULT false;
