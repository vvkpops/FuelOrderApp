/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Flight` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "alternateIcao" TEXT,
ADD COLUMN     "arrivalIcao" TEXT,
ADD COLUMN     "arrivalTime" TIMESTAMP(3),
ADD COLUMN     "eta" TIMESTAMP(3),
ADD COLUMN     "externalId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Flight_externalId_key" ON "Flight"("externalId");

-- CreateIndex
CREATE INDEX "Flight_arrivalIcao_idx" ON "Flight"("arrivalIcao");
