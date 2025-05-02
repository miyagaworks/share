/*
  Warnings:

  - You are about to drop the column `headerText` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `textColor` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "headerText",
DROP COLUMN "textColor";
