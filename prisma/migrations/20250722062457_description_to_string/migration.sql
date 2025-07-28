/*
  Warnings:

  - You are about to drop the column `url` on the `Image` table. All the data in the column will be lost.
  - Added the required column `original` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" DROP COLUMN "url",
ADD COLUMN     "original" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "description" SET DATA TYPE TEXT;
