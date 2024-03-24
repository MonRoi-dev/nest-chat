/*
  Warnings:

  - The primary key for the `UserRooms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserRooms` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserRooms_userId_roomId_idx";

-- AlterTable
ALTER TABLE "UserRooms" DROP CONSTRAINT "UserRooms_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "UserRooms_pkey" PRIMARY KEY ("userId", "roomId");
