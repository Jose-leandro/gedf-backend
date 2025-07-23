/*
  Warnings:

  - The primary key for the `Spend` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Spend" DROP CONSTRAINT "Spend_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Spend_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Spend_id_seq";
