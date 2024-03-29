/*
  Warnings:

  - A unique constraint covering the columns `[socketId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `image` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "socketId" VARCHAR(32),
ALTER COLUMN "image" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_socketId_key" ON "User"("socketId");
