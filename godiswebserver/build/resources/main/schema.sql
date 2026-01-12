-- Schema for the subscriptions table used by the example MyData backend.
-- Run this script manually against your MariaDB database to create the table
-- before starting the Spring Boot application.

CREATE TABLE IF NOT EXISTS subscriptions (
  token_code VARCHAR(50) PRIMARY KEY,
  token_name VARCHAR(255) NOT NULL,
  base_asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  quantity BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  request_count BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  issue_date DATE NOT NULL
);