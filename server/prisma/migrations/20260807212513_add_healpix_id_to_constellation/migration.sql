/*
  Warnings:

  - Made the column `healpixId` on table `constellation_lines` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "constellation_lines" ALTER COLUMN "healpixId" SET NOT NULL;
