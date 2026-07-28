-- 降りつぶし マスタDDL案
-- Supabase (PostgreSQL) 前提
-- 前提:
-- - revision は全テーブルで 0 から始める
-- - 履歴保持型のため主キーは (id, revision)
-- - company_revision などの親 revision は持たない設計なので、
--   このDDLでは履歴テーブル間の外部キー制約は張っていない

CREATE TABLE mst_company_type (
    id INT4 NOT NULL,
    name VARCHAR(255) NOT NULL,
    CONSTRAINT pk_mst_company_type PRIMARY KEY (id)
);

CREATE TABLE mst_company (
    id BIGINT NOT NULL,
    revision INT NOT NULL,
    company_type INT4 NOT NULL,
    name VARCHAR(255) NOT NULL,
    note TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_mst_company PRIMARY KEY (id, revision),
    CONSTRAINT chk_mst_company_revision_non_negative CHECK (revision >= 0),
    CONSTRAINT fk_mst_company_company_type
        FOREIGN KEY (company_type) REFERENCES mst_company_type (id)
);

CREATE TABLE mst_line (
    id BIGINT NOT NULL,
    revision INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_id BIGINT NOT NULL,
    display_start_station_id BIGINT NOT NULL,
    note TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_mst_line PRIMARY KEY (id, revision),
    CONSTRAINT chk_mst_line_revision_non_negative CHECK (revision >= 0)
);

CREATE TABLE mst_station (
    id BIGINT NOT NULL,
    revision INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_id BIGINT NOT NULL,
    is_shinkansen BOOLEAN NOT NULL DEFAULT FALSE,
    first_achieved_on CHAR(8) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    note TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_mst_station PRIMARY KEY (id, revision),
    CONSTRAINT chk_mst_station_revision_non_negative CHECK (revision >= 0),
    CONSTRAINT chk_mst_station_first_achieved_on_length
        CHECK (first_achieved_on IS NULL OR CHAR_LENGTH(first_achieved_on) = 8),
    CONSTRAINT chk_mst_station_latitude_range
        CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT chk_mst_station_longitude_range
        CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE mst_section (
    id BIGINT NOT NULL,
    revision INT NOT NULL,
    line_id BIGINT NOT NULL,
    from_station_id BIGINT NOT NULL,
    to_station_id BIGINT NOT NULL,
    distance DECIMAL(6,1) NULL,
    first_achieved_on CHAR(8) NULL,
    note TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_mst_section PRIMARY KEY (id, revision),
    CONSTRAINT chk_mst_section_revision_non_negative CHECK (revision >= 0),
    CONSTRAINT chk_mst_section_station_not_same CHECK (from_station_id <> to_station_id),
    CONSTRAINT chk_mst_section_distance_non_negative CHECK (distance IS NULL OR distance >= 0),
    CONSTRAINT chk_mst_section_first_achieved_on_length
        CHECK (first_achieved_on IS NULL OR CHAR_LENGTH(first_achieved_on) = 8)
);
