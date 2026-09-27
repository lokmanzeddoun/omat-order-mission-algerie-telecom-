-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;


-- Accounts created before this release may still carry the initial password
-- derived from the name (`nom_prenom13`): make every one of them choose a
-- password of their own at next sign-in.
UPDATE "User" SET "mustChangePassword" = true WHERE "passwordChangedAt" IS NULL;
