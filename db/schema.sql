-- HYANG 데이터베이스 스키마
-- UTF8MB4 인코딩을 사용합니다.

CREATE DATABASE IF NOT EXISTS `hyang`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hyang`;

-- 사용자 계정 테이블
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nickname` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 향수 정보 테이블
CREATE TABLE IF NOT EXISTS `perfumes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(255) DEFAULT NULL,
  `tags_json` JSON DEFAULT NULL,
  `seasonality_json` JSON DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `description` TEXT,
  PRIMARY KEY (`id`),
  KEY `idx_perfumes_tags_json` ((CAST(`tags_json` AS CHAR(255))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 북마크 테이블 (사용자 ↔ 향수)
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `perfume_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bookmarks_user_perfume` (`user_id`, `perfume_id`),
  KEY `idx_bookmarks_user_id` (`user_id`),
  CONSTRAINT `fk_bookmarks_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookmarks_perfume`
    FOREIGN KEY (`perfume_id`) REFERENCES `perfumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 향수 데이터 시드 (중복 방지)
INSERT IGNORE INTO `perfumes`
  (`name`, `brand`, `tags_json`, `seasonality_json`, `image_url`, `description`)
VALUES
  (
    'Citrus Breeze',
    'HYANG LAB',
    JSON_ARRAY('citrus', 'fresh', 'summer'),
    JSON_ARRAY('spring', 'summer'),
    NULL,
    '맑고 따뜻한 날씨에 상큼하게 어울리는 향수입니다.'
  ),
  (
    'Sweet Cozy',
    'HYANG LAB',
    JSON_ARRAY('sweet', 'gourmand', 'indoor'),
    JSON_ARRAY('autumn', 'winter'),
    NULL,
    '실내나 비 오는 날 포근한 분위기를 완성시켜 줍니다.'
  ),
  (
    'Woody Night',
    'HYANG LAB',
    JSON_ARRAY('woody', 'amber', 'night'),
    JSON_ARRAY('autumn', 'winter'),
    NULL,
    '밤 데이트에 잘 어울리는 깊고 우디한 향.'
  ),
  (
    'Aqua Mist',
    'HYANG LAB',
    JSON_ARRAY('aquatic', 'fresh', 'humid'),
    JSON_ARRAY('summer'),
    NULL,
    '습한 날 상쾌한 기분을 전해주는 아쿠아 향.'
  );
