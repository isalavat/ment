-- AlterTable
ALTER TABLE `mentorprofile` ADD COLUMN `rejectionReason` TEXT NULL,
    ADD COLUMN `verificationStatus` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `MentorProfile_verificationStatus_idx` ON `MentorProfile`(`verificationStatus`);
