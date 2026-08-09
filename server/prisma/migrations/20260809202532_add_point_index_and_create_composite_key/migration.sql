/*
  Warnings:

  - A unique constraint covering the columns `[constellationName,lineIndex,pointIndex]` on the table `Constellation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pointIndex` to the `Constellation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Constellation" ADD COLUMN     "pointIndex" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Constellation_constellationName_lineIndex_pointIndex_key" ON "Constellation"("constellationName", "lineIndex", "pointIndex");
