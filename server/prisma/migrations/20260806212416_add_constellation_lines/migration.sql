-- CreateTable
CREATE TABLE "constellation_lines" (
    "id" SERIAL NOT NULL,
    "constellation" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "pointIndex" INTEGER NOT NULL,
    "rarad" DOUBLE PRECISION NOT NULL,
    "decrad" DOUBLE PRECISION NOT NULL,
    "starId" INTEGER,

    CONSTRAINT "constellation_lines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "constellation_lines" ADD CONSTRAINT "constellation_lines_starId_fkey" FOREIGN KEY ("starId") REFERENCES "hyg_stars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
