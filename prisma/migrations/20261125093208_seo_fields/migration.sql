-- AlterTable
ALTER TABLE `servicearea` ADD COLUMN `noIndex` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `PageSeo` (
    `path` VARCHAR(200) NOT NULL,
    `title` VARCHAR(120) NOT NULL DEFAULT '',
    `description` VARCHAR(200) NOT NULL DEFAULT '',
    `noIndex` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`path`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
