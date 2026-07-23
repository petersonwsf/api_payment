/*
  Warnings:

  - A unique constraint covering the columns `[codeBar]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "boletoUrl" TEXT,
ADD COLUMN     "codeBar" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_codeBar_key" ON "Payment"("codeBar");
