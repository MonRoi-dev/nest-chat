/*
  Warnings:

  - The primary key for the `UserRooms` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UserRooms" DROP CONSTRAINT "UserRooms_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "UserRooms_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "UserRooms_userId_roomId_idx" ON "UserRooms"("userId", "roomId");
