-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "studentId" TEXT,
    "gameType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameAttempt_workspaceId_idx" ON "GameAttempt"("workspaceId");

-- CreateIndex
CREATE INDEX "GameAttempt_studentId_idx" ON "GameAttempt"("studentId");

-- CreateIndex
CREATE INDEX "GameAttempt_createdAt_idx" ON "GameAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
