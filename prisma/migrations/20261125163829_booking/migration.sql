-- AlterTable
ALTER TABLE `lead` ADD COLUMN `bookingRef` VARCHAR(191) NULL,
    ADD COLUMN `optionName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `scheduledEnd` DATETIME(3) NULL,
    ADD COLUMN `serviceId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `WorkingHours` (
    `weekday` INTEGER NOT NULL,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `startTime` VARCHAR(5) NOT NULL DEFAULT '08:00',
    `endTime` VARCHAR(5) NOT NULL DEFAULT '17:00',

    PRIMARY KEY (`weekday`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlockedTime` (
    `id` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BlockedTime_startsAt_endsAt_idx`(`startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingSlot` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `slotStart` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BookingSlot_slotStart_key`(`slotStart`),
    INDEX `BookingSlot_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Lead_bookingRef_key` ON `Lead`(`bookingRef`);

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSlot` ADD CONSTRAINT `BookingSlot_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

