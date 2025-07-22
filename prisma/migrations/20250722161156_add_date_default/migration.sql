/*
  Warnings:

  - You are about to drop the column `totalSprends` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Income" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Spend" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "totalSprends";
