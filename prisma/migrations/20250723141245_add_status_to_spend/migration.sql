/*
  Warnings:

  - You are about to drop the column `status` on the `Spend` table. All the data in the column will be lost.
  - Added the required column `statusSpend` to the `Spend` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Spend" DROP COLUMN "status",
ADD COLUMN     "statusSpend" TEXT NOT NULL;
