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
  `weather_json` JSON DEFAULT NULL,
  `notes_json` JSON DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `description` TEXT,
  `source_type` ENUM('STATIC_DB','OPENAI_GENERATED') DEFAULT 'STATIC_DB',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_perfumes_tags_json` ((CAST(`tags_json` AS CHAR(255))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 노트 테이블 (선호/비선호 대상)
CREATE TABLE IF NOT EXISTS `notes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notes_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 선호/비선호 노트 매핑
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `note_id` INT UNSIGNED NOT NULL,
  `type` ENUM('LIKE','DISLIKE') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_note_type` (`user_id`,`note_id`,`type`),
  CONSTRAINT `fk_pref_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pref_note`
    FOREIGN KEY (`note_id`) REFERENCES `notes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
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
  (`name`, `brand`, `tags_json`, `seasonality_json`, `notes_json`, `image_url`, `description`)
VALUES
  (
    'Chanel No. 5',
    'Chanel',
    JSON_ARRAY('floral', 'aldehydic', 'classic', 'elegant'),
    JSON_ARRAY('autumn', 'winter', 'spring'),
    JSON_OBJECT(
      'top', JSON_ARRAY('베르가못', '레몬', '네롤리', '알데하이드'),
      'middle', JSON_ARRAY('자스민', '장미', '일랑일랑', '아이리스'),
      'base', JSON_ARRAY('샌달우드', '베티버', '바닐라', '머스크')
    ),
    NULL,
    '파우더리한 플로럴과 알데하이드가 어우러진 클래식한 아이코닉 향수입니다.'
  ),
  (
    'Bleu de Chanel',
    'Chanel',
    JSON_ARRAY('fresh', 'woody', 'citrus', 'masculine'),
    JSON_ARRAY('spring', 'summer', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('자몽', '레몬', '민트', '핑크 페퍼'),
      'middle', JSON_ARRAY('생강', '넛멕', '자스민'),
      'base', JSON_ARRAY('인센스', '베티버', '시더', '샌달우드')
    ),
    NULL,
    '상큼한 시트러스와 우디 노트가 조화된 깔끔하고 세련된 남성 향입니다.'
  ),
  (
    'Sauvage Eau de Toilette',
    'Dior',
    JSON_ARRAY('fresh', 'spicy', 'aromatic', 'masculine'),
    JSON_ARRAY('spring', 'summer', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('베르가못', '페퍼'),
      'middle', JSON_ARRAY('시추안 페퍼', '라벤더', '제라늄'),
      'base', JSON_ARRAY('앰브록산', '시더', '라브다넘')
    ),
    NULL,
    '상쾌한 베르가못과 스파이시 노트가 어우러진 시원한 남성 향수입니다.'
  ),
  (
    'J''adore',
    'Dior',
    JSON_ARRAY('floral', 'fruity', 'feminine', 'elegant'),
    JSON_ARRAY('spring', 'summer', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('베르가못', '배', '멜론'),
      'middle', JSON_ARRAY('자스민', '일랑일랑', '튜베로즈', '장미'),
      'base', JSON_ARRAY('머스크', '시더', '바닐라', '자두')
    ),
    NULL,
    '풍부한 화이트 플로럴과 과실 향이 어우러진 화사한 여성 향수입니다.'
  ),
  (
    'La Vie Est Belle',
    'Lancome',
    JSON_ARRAY('sweet', 'gourmand', 'floral', 'warm'),
    JSON_ARRAY('autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('블랙커런트', '배'),
      'middle', JSON_ARRAY('아이리스', '자스민', '오렌지 블로섬'),
      'base', JSON_ARRAY('프랄린', '바닐라', '통카빈', '파출리')
    ),
    NULL,
    '달콤한 프루티·구르망 노트가 포근하게 감싸는 따뜻한 분위기의 향수입니다.'
  ),
  (
    'Si Eau de Parfum',
    'Giorgio Armani',
    JSON_ARRAY('fruity', 'sweet', 'chypre', 'elegant'),
    JSON_ARRAY('autumn', 'winter', 'spring'),
    JSON_OBJECT(
      'top', JSON_ARRAY('블랙커런트'),
      'middle', JSON_ARRAY('장미', '프리지아', '오스만투스'),
      'base', JSON_ARRAY('바닐라', '파출리', '우디 노트', '앰버')
    ),
    NULL,
    '블랙커런트와 따뜻한 바닐라가 어우러진 우아한 여성스러운 향수입니다.'
  ),
  (
    'Acqua di Gio',
    'Giorgio Armani',
    JSON_ARRAY('aquatic', 'fresh', 'citrus', 'masculine'),
    JSON_ARRAY('spring', 'summer'),
    JSON_OBJECT(
      'top', JSON_ARRAY('라임', '레몬', '베르가못'),
      'middle', JSON_ARRAY('자스민', '마린 노트', '넛멕'),
      'base', JSON_ARRAY('시더', '오크모스', '머스크', '앰버')
    ),
    NULL,
    '바닷바람 같은 아쿠아틱 노트와 시트러스가 어우러진 시원한 남성 향입니다.'
  ),
  (
    'English Pear & Freesia',
    'Jo Malone London',
    JSON_ARRAY('fruity', 'fresh', 'green', 'light'),
    JSON_ARRAY('spring', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('배', '멜론'),
      'middle', JSON_ARRAY('프리지아', '장미'),
      'base', JSON_ARRAY('파출리', '앰버', '머스크')
    ),
    NULL,
    '잘 익은 배 향과 프리지아가 어우러진 산뜻하고 부드러운 일상용 향수입니다.'
  ),
  (
    'Wood Sage & Sea Salt',
    'Jo Malone London',
    JSON_ARRAY('woody', 'marine', 'fresh', 'unisex'),
    JSON_ARRAY('spring', 'summer', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('자몽', '씨 솔트'),
      'middle', JSON_ARRAY('세이지', '씨위드'),
      'base', JSON_ARRAY('시더', '앰브레트', '머스크')
    ),
    NULL,
    '바닷바람과 허브, 우디 노트가 섞인 자연스러운 언isex 향입니다.'
  ),
  (
    'Black Opium',
    'Yves Saint Laurent',
    JSON_ARRAY('sweet', 'coffee', 'gourmand', 'night'),
    JSON_ARRAY('autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('핑크 페퍼', '오렌지 블로섬'),
      'middle', JSON_ARRAY('커피', '자스민'),
      'base', JSON_ARRAY('바닐라', '파출리', '시더')
    ),
    NULL,
    '커피와 바닐라, 화이트 플라워가 어우러진 달콤하고 중독적인 나이트 향수입니다.'
  ),
  (
    'Libre Eau de Parfum',
    'Yves Saint Laurent',
    JSON_ARRAY('lavender', 'citrus', 'vanilla', 'elegant'),
    JSON_ARRAY('autumn', 'spring'),
    JSON_OBJECT(
      'top', JSON_ARRAY('라벤더', '만다린', '블랙커런트'),
      'middle', JSON_ARRAY('오렌지 블로섬', '자스민 티'),
      'base', JSON_ARRAY('바닐라', '통카빈', '앰버그리스', '시더')
    ),
    NULL,
    '라벤더와 오렌지 블로섬, 바닐라가 조화된 시크한 플로럴 향수입니다.'
  ),
  (
    'Santal 33',
    'Le Labo',
    JSON_ARRAY('woody', 'spicy', 'smoky', 'unisex'),
    JSON_ARRAY('autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('바이올렛', '카다멈'),
      'middle', JSON_ARRAY('아이리스', '앰브록스', '샌달우드'),
      'base', JSON_ARRAY('시더', '가죽', '머스크')
    ),
    NULL,
    '샌들우드와 스파이스가 중심이 되는 드라이하고 시그니처 느낌의 우디 향입니다.'
  ),
  (
    'Gypsy Water',
    'Byredo',
    JSON_ARRAY('woody', 'citrus', 'aromatic', 'soft'),
    JSON_ARRAY('spring', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('베르가못', '레몬', '페퍼', '주니퍼'),
      'middle', JSON_ARRAY('인센스', '파인 니들', '오리스'),
      'base', JSON_ARRAY('앰버', '샌달우드', '바닐라')
    ),
    NULL,
    '잔잔한 시트러스와 우디, 아로마틱 노트가 섞인 부드러운 보헤미안 무드의 향수입니다.'
  ),
  (
    'Daisy',
    'Marc Jacobs',
    JSON_ARRAY('floral', 'fresh', 'youthful', 'light'),
    JSON_ARRAY('spring', 'summer'),
    JSON_OBJECT(
      'top', JSON_ARRAY('스트로베리', '바이올렛 리프', '블러드 그레이프프루트'),
      'middle', JSON_ARRAY('가드니아', '바이올렛', '자스민'),
      'base', JSON_ARRAY('머스크', '화이트 우드', '바닐라')
    ),
    NULL,
    '가볍고 상큼한 플로럴·그린 노트가 사랑스러운 데일리용 향수입니다.'
  ),
  (
    'Bright Crystal',
    'Versace',
    JSON_ARRAY('floral', 'fruity', 'fresh', 'bright'),
    JSON_ARRAY('spring', 'summer'),
    JSON_OBJECT(
      'top', JSON_ARRAY('석류', '유자', '아이스 노트'),
      'middle', JSON_ARRAY('피오니', '마그놀리아', '연꽃'),
      'base', JSON_ARRAY('머스크', '앰버우드', '마호가니')
    ),
    NULL,
    '석류와 피오니, 머스크가 어우러진 깨끗하고 반짝이는 인상의 향수입니다.'
  ),
  (
    'Light Blue',
    'Dolce & Gabbana',
    JSON_ARRAY('citrus', 'fresh', 'marine', 'casual'),
    JSON_ARRAY('summer', 'spring'),
    JSON_OBJECT(
      'top', JSON_ARRAY('레몬', '그린 애플', '벨플라워'),
      'middle', JSON_ARRAY('밤부', '자스민', '장미'),
      'base', JSON_ARRAY('시더', '머스크', '앰버')
    ),
    NULL,
    '지중해를 떠올리게 하는 레몬과 그린 애플, 머스크의 청량한 조합입니다.'
  ),
  (
    'Black Orchid',
    'Tom Ford',
    JSON_ARRAY('oriental', 'dark', 'floral', 'night'),
    JSON_ARRAY('autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('블랙 트러플', '일랑일랑', '베르가못', '블랙커런트'),
      'middle', JSON_ARRAY('블랙 오키드', '스파이시 플로럴'),
      'base', JSON_ARRAY('파출리', '인센스', '바닐라', '다크 초콜릿')
    ),
    NULL,
    '짙은 플로럴과 다크 초콜릿, 향신료가 어우러진 관능적인 시그니처 향입니다.'
  ),
  (
    'Oud Wood',
    'Tom Ford',
    JSON_ARRAY('oud', 'woody', 'warm', 'luxury'),
    JSON_ARRAY('autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('로즈우드', '카다멈', '페퍼'),
      'middle', JSON_ARRAY('우드', '샌달우드', '베티버'),
      'base', JSON_ARRAY('통카빈', '바닐라', '앰버')
    ),
    NULL,
    '우드와 스파이스, 바닐라가 섞인 고급스러운 따뜻한 우디 향수입니다.'
  ),
  (
    'Terre d''Hermes',
    'Hermes',
    JSON_ARRAY('woody', 'citrus', 'earthy', 'masculine'),
    JSON_ARRAY('spring', 'autumn'),
    JSON_OBJECT(
      'top', JSON_ARRAY('오렌지', '그레이프프루트'),
      'middle', JSON_ARRAY('페퍼', '제라늄', '플린트'),
      'base', JSON_ARRAY('베티버', '시더', '벤조인', '파출리')
    ),
    NULL,
    '오렌지와 베티버, 시더우드가 어우러진 흙내음 있는 성숙한 남성 향입니다.'
  ),
  (
    'Chloe Eau de Parfum',
    'Chloe',
    JSON_ARRAY('rose', 'floral', 'powdery', 'feminine'),
    JSON_ARRAY('spring', 'autumn', 'winter'),
    JSON_OBJECT(
      'top', JSON_ARRAY('피오니', '리치', '프리지아'),
      'middle', JSON_ARRAY('로즈', '은방울꽃', '마그놀리아'),
      'base', JSON_ARRAY('시더', '앰버', '허니', '머스크')
    ),
    NULL,
    '로즈와 파우더리 노트가 중심이 되는 부드럽고 여성스러운 시그니처 향수입니다.'
  );
