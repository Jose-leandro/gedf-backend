/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Subcategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subcategoryId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Subcategory" DROP CONSTRAINT "Subcategory_categoryId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "subcategoryId" INTEGER;

-- AlterTable
ALTER TABLE "Subcategory" DROP COLUMN "categoryId";

-- CreateIndex
CREATE UNIQUE INDEX "Category_subcategoryId_key" ON "Category"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
