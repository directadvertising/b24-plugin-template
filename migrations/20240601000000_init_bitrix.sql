-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE bitrix_user (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bitrix_id integer NOT NULL,
  is_admin boolean NOT NULL,
  member_id varchar NOT NULL,
  domain varchar NOT NULL,
  status varchar NOT NULL,
  app_version integer NOT NULL,
  access_token varchar,
  refresh_token varchar,
  expires_in integer,
  created_at timestamp(3) NOT NULL,
  updated_at timestamp(3) NOT NULL,
  CONSTRAINT unique_bitrix_user_domain UNIQUE (bitrix_id, domain)
);

CREATE TABLE bitrix_tenant (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bitrix_user_id uuid NOT NULL UNIQUE REFERENCES bitrix_user (id) ON DELETE CASCADE,
  status varchar NOT NULL,
  license_family varchar NOT NULL,
  created_at timestamp(3) NOT NULL,
  updated_at timestamp(3) NOT NULL
);

CREATE INDEX idx_bitrix_user_member_id ON bitrix_user (member_id);
CREATE INDEX idx_bitrix_user_domain ON bitrix_user (domain);
CREATE INDEX idx_bitrix_tenant_status ON bitrix_tenant (status);
CREATE INDEX idx_bitrix_tenant_license_family ON bitrix_tenant (license_family);

-- migrate:down
DROP TABLE bitrix_tenant;
DROP TABLE bitrix_user;
DROP EXTENSION IF EXISTS "uuid-ossp";
