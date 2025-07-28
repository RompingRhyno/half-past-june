/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `price` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "createdAt",
ADD COLUMN     "colourCode" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
