-- AlterTable
ALTER TABLE "Decompte" ADD COLUMN     "exerciceId" INTEGER;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "exerciceId" INTEGER;

-- CreateTable
CREATE TABLE "Exercice" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "start" TIMESTAMP(3),
    "end" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercice_year_key" ON "Exercice"("year");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decompte" ADD CONSTRAINT "Decompte_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
