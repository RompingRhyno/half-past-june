/*
  Warnings:

  - You are about to drop the column `original` on the `Image` table. All the data in the column will be lost.
  - Added the required column `basename` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extension` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Image" DROP COLUMN "original",
ADD COLUMN     "basename" TEXT NOT NULL,
ADD COLUMN     "extension" TEXT NOT NULL;
