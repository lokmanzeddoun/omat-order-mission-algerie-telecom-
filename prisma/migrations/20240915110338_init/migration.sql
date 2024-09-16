-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CADRE', 'CADRE_SUPERIEUR', 'EXECUTION_MAITRISE');

-- CreateEnum
CREATE TYPE "UniteType" AS ENUM ('SERVICE', 'DIRECTION', 'SOUS_DIRECTION', 'DEPARTEMENT');

-- CreateTable
CREATE TABLE "User" (
    "matricule" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'INACTIVE',
    "userSince" TIMESTAMP(3) NOT NULL,
    "grade" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("matricule")
);

-- CreateTable
CREATE TABLE "Structure" (
    "code" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Structure_pkey" PRIMARY KEY ("code")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Structure"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
