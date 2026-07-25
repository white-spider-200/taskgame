-- DropIndex
DROP INDEX "Rating_taskId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Rating_taskId_raterId_key" ON "Rating"("taskId", "raterId");

-- CreateIndex
CREATE INDEX "Rating_taskId_idx" ON "Rating"("taskId");
