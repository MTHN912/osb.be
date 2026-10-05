/*
  Warnings:

  - You are about to drop the `technician_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "technician_profiles" DROP CONSTRAINT "technician_profiles_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isBookable" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "technician_profiles";
