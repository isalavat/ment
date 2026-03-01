/*
  Warnings:

  - The values [CANCELLED_BY_MENTEE] on the enum `Booking_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [MENTEE] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `menteeprofile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_menteeId_fkey`;

-- DropForeignKey
ALTER TABLE `favoritementor` DROP FOREIGN KEY `FavoriteMentor_menteeId_fkey`;

-- DropForeignKey
ALTER TABLE `menteeprofile` DROP FOREIGN KEY `MenteeProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_menteeId_fkey`;

-- DropIndex
DROP INDEX `Review_menteeId_fkey` ON `review`;

-- AlterTable
ALTER TABLE `booking` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_BY_MENTOR') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `user` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `goals` TEXT NULL,
    MODIFY `role` ENUM('USER', 'MENTOR', 'ADMIN') NOT NULL;

-- DropTable
DROP TABLE `menteeprofile`;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_menteeId_fkey` FOREIGN KEY (`menteeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_menteeId_fkey` FOREIGN KEY (`menteeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteMentor` ADD CONSTRAINT `FavoriteMentor_menteeId_fkey` FOREIGN KEY (`menteeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
