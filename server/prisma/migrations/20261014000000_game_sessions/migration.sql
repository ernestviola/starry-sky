CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "targetStarIds" INTEGER[] NOT NULL,
    "foundStarIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalTimeMs" INTEGER,
    "savedAt" TIMESTAMP(3),
    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);
