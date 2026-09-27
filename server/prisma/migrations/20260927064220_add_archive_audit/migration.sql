-- AlterTable
ALTER TABLE "Decompte" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" INTEGER;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" INTEGER;

-- AlterTable
ALTER TABLE "Structure" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Structure" ADD CONSTRAINT "Structure_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decompte" ADD CONSTRAINT "Decompte_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("matricule") ON DELETE SET NULL ON UPDATE CASCADE;
