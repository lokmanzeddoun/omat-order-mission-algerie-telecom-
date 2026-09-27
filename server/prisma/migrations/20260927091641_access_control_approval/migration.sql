-- AlterTable
ALTER TABLE "Decompte" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedById" INTEGER;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedById" INTEGER;
