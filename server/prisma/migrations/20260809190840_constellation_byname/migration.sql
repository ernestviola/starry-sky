/*
  Warnings:

  - Added the required column `byname` to the `Constellation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Constellation" ADD COLUMN     "byname" TEXT NOT NULL;
