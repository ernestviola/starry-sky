-- AlterTable
ALTER TABLE "constellation_lines" ALTER COLUMN "healpixId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FakeTable" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "FakeTable_pkey" PRIMARY KEY ("id")
);
