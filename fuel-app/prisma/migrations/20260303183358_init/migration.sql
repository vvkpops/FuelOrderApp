-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SENT', 'UPDATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "acRegistration" TEXT NOT NULL,
    "acType" TEXT NOT NULL,
    "deptIcao" TEXT NOT NULL,
    "deptTime" TIMESTAMP(3) NOT NULL,
    "fuelLoad" DOUBLE PRECISION,
    "dispatcher" TEXT,
    "rawData" JSONB,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelOrder" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "acRegistration" TEXT NOT NULL,
    "acType" TEXT NOT NULL,
    "deptIcao" TEXT NOT NULL,
    "deptTime" TIMESTAMP(3) NOT NULL,
    "fuelLoad" DOUBLE PRECISION,
    "dispatcher" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT[],
    "ccTo" TEXT[],
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "isUpdate" BOOLEAN NOT NULL DEFAULT false,
    "originalOrderId" TEXT,
    "updateReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "icaoCode" TEXT NOT NULL,
    "name" TEXT,
    "emails" TEXT[],
    "ccEmails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Flight_deptIcao_idx" ON "Flight"("deptIcao");

-- CreateIndex
CREATE INDEX "Flight_deptTime_idx" ON "Flight"("deptTime");

-- CreateIndex
CREATE INDEX "Flight_flightNumber_idx" ON "Flight"("flightNumber");

-- CreateIndex
CREATE INDEX "FuelOrder_status_idx" ON "FuelOrder"("status");

-- CreateIndex
CREATE INDEX "FuelOrder_deptIcao_idx" ON "FuelOrder"("deptIcao");

-- CreateIndex
CREATE INDEX "FuelOrder_flightNumber_idx" ON "FuelOrder"("flightNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Station_icaoCode_key" ON "Station"("icaoCode");

-- CreateIndex
CREATE INDEX "Station_icaoCode_idx" ON "Station"("icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "FuelOrder" ADD CONSTRAINT "FuelOrder_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelOrder" ADD CONSTRAINT "FuelOrder_originalOrderId_fkey" FOREIGN KEY ("originalOrderId") REFERENCES "FuelOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
