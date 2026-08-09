/*
  Warnings:

  - A unique constraint covering the columns `[hip]` on the table `hyg_stars` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Constellation" (
    "id" SERIAL NOT NULL,
    "constellationName" TEXT NOT NULL,
    "lineIndex" INTEGER NOT NULL,
    "hip" INTEGER,
    "healpixId" INTEGER,

    CONSTRAINT "Constellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hyg_stars_hip_key" ON "hyg_stars"("hip");

-- AddForeignKey
ALTER TABLE "Constellation" ADD CONSTRAINT "Constellation_hip_fkey" FOREIGN KEY ("hip") REFERENCES "hyg_stars"("hip") ON DELETE SET NULL ON UPDATE CASCADE;
