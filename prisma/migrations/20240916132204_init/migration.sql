/*
  Warnings:

  - The primary key for the `Structure` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_serviceId_fkey";

-- AlterTable
ALTER TABLE "Structure" DROP CONSTRAINT "Structure_pkey",
ALTER COLUMN "code" DROP DEFAULT,
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "soft_delete" DROP NOT NULL,
ADD CONSTRAINT "Structure_pkey" PRIMARY KEY ("code");
DROP SEQUENCE "Structure_code_seq";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "userSince" DROP NOT NULL,
ALTER COLUMN "serviceId" DROP NOT NULL,
ALTER COLUMN "serviceId" SET DATA TYPE TEXT,
ALTER COLUMN "soft_delete" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Structure"("code") ON DELETE SET NULL ON UPDATE CASCADE;
