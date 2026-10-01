-- Links the ordres de mission created together for several users.
ALTER TABLE "Mission" ADD COLUMN "batch_id" TEXT;

CREATE INDEX "Mission_batch_id_idx" ON "Mission"("batch_id");
