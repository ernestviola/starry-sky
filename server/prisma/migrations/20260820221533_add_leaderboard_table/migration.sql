-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "totalTimeMiliseconds" INTEGER NOT NULL,
    "geoLat" DOUBLE PRECISION NOT NULL,
    "geoLong" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);
