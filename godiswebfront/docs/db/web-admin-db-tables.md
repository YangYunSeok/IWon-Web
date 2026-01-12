# Web Admin DB 테이블 명세

이 문서는 관리자 웹(지갑관리, 지급/회수, 승인, 대시보드)을 위한 권장 데이터베이스 테이블 명세입니다.

전제
- DB: PostgreSQL 표기 기준
- 금액/잔액: 정수형(`bigint`)으로 저장 (단위: IWC)
- 시간: `timestamptz`
- JSON 컬럼: `jsonb`
- PK는 명시, FK·인덱스 권장 표기 포함

---

## Admin Users
- 목적: 관리자 계정 (operator / approver)
- 컬럼:
  - `id`: uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `username`: varchar(150) NOT NULL UNIQUE
  - `display_name`: varchar(200) NOT NULL
  - `email`: varchar(320) NULL
  - `password_hash`: varchar(255) NOT NULL
  - `role_id`: uuid NOT NULL REFERENCES admin_roles(id)
  - `status`: varchar(20) NOT NULL DEFAULT 'active' -- (active/inactive)
  - `created_at`: timestamptz NOT NULL DEFAULT now()
  - `last_login`: timestamptz NULL
- 인덱스: `username` (unique), `role_id`

## Admin Roles
- 목적: 역할 정의
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `name`: varchar(50) NOT NULL UNIQUE -- e.g., operator, approver
  - `description`: text NULL

  
## Audit Logs
- 목적: 주요 관리자 행위 감사 로그
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `actor_id`: uuid NULL REFERENCES admin_users(id)
  - `action`: varchar(100) NOT NULL
  - `resource_type`: varchar(100) NULL
  - `resource_id`: varchar(255) NULL
  - `details`: jsonb NULL
  - `created_at`: timestamptz NOT NULL DEFAULT now()
- 인덱스: `actor_id`, `created_at`

## Employees
- 목적: 임직원 기본정보 및 지갑 상태
- 컬럼:
  - `employee_id`: varchar(50) PRIMARY KEY -- 사번
  - `name`: varchar(200) NOT NULL
  - `department`: varchar(200) NULL
  - `email`: varchar(320) NULL
  - `phone`: varchar(50) NULL
  - `hire_date`: date NULL
  - `wallet_status`: varchar(20) NOT NULL DEFAULT 'uncreated' -- (uncreated/active/frozen)
  - `created_at`: timestamptz NOT NULL DEFAULT now()
  - `updated_at`: timestamptz NULL
- 인덱스: `department`, `name`

## Coin Types
- 목적: 발행 자산(코인) 정의
- 컬럼:
  - `coin_type`: varchar(50) PRIMARY KEY
  - `name`: varchar(100) NOT NULL
  - `decimals`: integer NOT NULL DEFAULT 0
  - `metadata`: jsonb NULL

## Wallets
- 목적: 임직원 지갑(온체인 주소 등)
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `employee_id`: varchar(50) NOT NULL REFERENCES employees(employee_id)
  - `address`: varchar(200) NULL UNIQUE
  - `status`: varchar(20) NOT NULL DEFAULT 'uncreated' -- (uncreated/active/frozen)
  - `balance`: bigint NOT NULL DEFAULT 0
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)
  - `created_at`: timestamptz NOT NULL DEFAULT now()
  - `activated_at`: timestamptz NULL
  - `frozen_at`: timestamptz NULL
  - `last_sync_at`: timestamptz NULL
- 인덱스: `employee_id`, `address`

## Wallet Transactions (Ledger)
- 목적: 지갑별 입출금/조정 내역
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `wallet_id`: uuid NOT NULL REFERENCES wallets(id)
  - `type`: varchar(30) NOT NULL -- (mint/burn/transfer/adjust)
  - `amount`: bigint NOT NULL -- 양수(입금) 또는 음수(출금)
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)
  - `counterparty`: varchar(255) NULL
  - `related_approval_id`: uuid NULL REFERENCES approvals(id)
  - `related_tx_id`: varchar(255) NULL
  - `operator_id`: uuid NULL REFERENCES admin_users(id)
  - `memo`: text NULL
  - `created_at`: timestamptz NOT NULL DEFAULT now()
- 인덱스: `wallet_id`, `created_at`, `related_approval_id`

## Approvals
- 목적: 지급/회수 등 승인 워크플로우 메인 레코드
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `kind`: varchar(30) NOT NULL -- (mint/burn/transfer/other)
  - `requester_id`: uuid NOT NULL REFERENCES admin_users(id)
  - `request_payload`: jsonb NOT NULL
  - `total_amount`: bigint NULL
  - `coin_type`: varchar(50) NULL REFERENCES coin_types(coin_type)
  - `status`: varchar(30) NOT NULL DEFAULT 'pending' -- (pending,approved,rejected,executed,cancelled)
  - `approver_id`: uuid NULL REFERENCES admin_users(id)
  - `requested_at`: timestamptz NOT NULL DEFAULT now()
  - `decided_at`: timestamptz NULL
  - `executed_at`: timestamptz NULL
  - `reason`: text NULL
- 인덱스: `status`, `requester_id`, `approver_id`, `requested_at`

## Approval Targets
- 목적: 하나의 Approval에 속한 대상 항목
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `approval_id`: uuid NOT NULL REFERENCES approvals(id) ON DELETE CASCADE
  - `employee_id`: varchar(50) NULL REFERENCES employees(employee_id)
  - `wallet_id`: uuid NULL REFERENCES wallets(id)
  - `amount`: bigint NOT NULL
  - `note`: text NULL
- 인덱스: `approval_id`, `employee_id`

## Admin Transactions (Execution Records)
- 목적: 승인 실행(외부 호출) 결과 및 상태 기록
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `approval_id`: uuid NOT NULL REFERENCES approvals(id)
  - `tx_type`: varchar(30) NOT NULL -- (mint/burn/transfer)
  - `amount`: bigint NULL
  - `coin_type`: varchar(50) NULL REFERENCES coin_types(coin_type)
  - `tx_hash`: varchar(255) NULL
  - `status`: varchar(20) NOT NULL DEFAULT 'pending' -- (pending,success,failed)
  - `executed_by`: uuid NULL REFERENCES admin_users(id)
  - `executed_at`: timestamptz NULL
  - `response`: jsonb NULL
  - `created_at`: timestamptz NOT NULL DEFAULT now()
- 인덱스: `approval_id`, `status`, `tx_hash`

## Stats Daily
- 목적: 대시보드용 일별 집계
- 컬럼:
  - `date`: date PRIMARY KEY
  - `total_supply`: bigint NOT NULL
  - `minted_today`: bigint NOT NULL DEFAULT 0
  - `burned_today`: bigint NOT NULL DEFAULT 0
  - `active_wallets`: integer NOT NULL DEFAULT 0
  - `created_at`: timestamptz NOT NULL DEFAULT now()

## Supply Summary History (선택)
- 목적: 총 발행량 스냅샷
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `snapshot_at`: timestamptz NOT NULL DEFAULT now()
  - `total_supply`: bigint NOT NULL
  - `metadata`: jsonb NULL

## Supply Snapshots (코인별 상세 스냅샷, 선택)
- 목적: 특정 시점의 코인별 합계(대시보드 `SupplySummary.coinTotals` 대응)
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `snapshot_id`: uuid NOT NULL REFERENCES supply_summary_history(id) ON DELETE CASCADE
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)
  - `db_total`: bigint NOT NULL
  - `chain_total`: bigint NOT NULL
  - `matched`: boolean NOT NULL DEFAULT false
  - `note`: text NULL
- 인덱스: `snapshot_id`, `coin_type`

## Monthly Payees (월별 지급 대상자)
- 목적: UI의 "월별 지급 대상자 관리" 기능을 단일 테이블(`monthly_payees`)로 관리. 연도/월을 기준으로 레코드들을 그룹화합니다.

### monthly_payees
- 컬럼:
  - `id`: uuid PRIMARY KEY
  - `year`: integer NOT NULL -- 지급 연도
  - `month`: integer NOT NULL -- 지급 월(1..12)
  - `employee_id`: varchar(50) NULL REFERENCES employees(employee_id)
  - `name`: varchar(200) NOT NULL
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)
  - `amount`: bigint NOT NULL
  - `reason`: text NULL
  - `status`: varchar(20) NOT NULL DEFAULT 'scheduled' -- (scheduled/paid/cancelled)
  - `scheduled_at`: timestamptz NULL
  - `paid_at`: timestamptz NULL
  - `created_by`: uuid NULL REFERENCES admin_users(id)
  - `created_at`: timestamptz NOT NULL DEFAULT now()
- 제약/인덱스:
  - UNIQUE(year, month, employee_id, coin_type) -- 중복 방지
  - 인덱스: `year`, `month`, `employee_id`, `status`

Note: 전월 데이터 가져오기나 CSV 업로드 이력은 별도 로그 테이블 없이 애플리케이션 레벨에서 처리하거나, 필요 시 `audit_logs`에 업로드 이벤트를 기록하는 방식으로 충분합니다.

## Coin Daily Aggregates (코인별 일별 집계, 선택)
- 목적: `stats_daily`보다 더 상세한 코인 단위의 일별 집계가 필요할 경우 사용. 대시보드 집계 성능을 위해 일별 집계를 별도 테이블에 보관 권장.
- 컬럼:
  - `date`: date NOT NULL
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)
  - `total_supply`: bigint NOT NULL -- 해당 코인 DB 기준 총 유통량
  - `minted`: bigint NOT NULL DEFAULT 0 -- 해당 일자 발행
  - `burned`: bigint NOT NULL DEFAULT 0 -- 해당 일자 소각/회수
  - `active_wallets`: integer NOT NULL DEFAULT 0
  - `created_at`: timestamptz NOT NULL DEFAULT now()
- 제약/인덱스: PRIMARY KEY(date, coin_type), 인덱스: `coin_type`

권고: 
- `supply_summary_history`는 전체 스냅샷(시점)을 보관하고, `supply_snapshots`는 코인별 상세 스냅샷을 보관합니다. 성능상 대시보드에 자주 사용되는 집계(일별)는 `coin_daily_aggregates`와 같은 별도 집계 테이블을 유지하는 것이 좋습니다.
- 원시 원장(`wallet_transactions`)에서 실시간으로 집계하면 비용이 크므로 정기 배치(job)으로 집계하여 `coin_daily_aggregates`와 `supply_summary_history/supply_snapshots`를 업데이트하세요.

---

운영/성능/보안 노트
- 트랜잭션: `approvals` 실행은 DB 트랜잭션으로 처리하여 `approvals` 상태 변경 → `admin_transactions` 생성 → `wallet_transactions` 생성 순으로 일관성 보장
- 동시성: 잔액 업데이트는 `SELECT ... FOR UPDATE` 또는 optimistic locking 사용 권장
- 감사: 모든 승인/실행/지갑 생성/수정은 `audit_logs`에 기록
- 보안: `admin_users.password_hash`는 안전한 해시(Bcrypt/Argon2) 사용
- 인덱스: 운영 조회패턴에 따라 추가 인덱스 권장

API ↔ 테이블 매핑(주요)
- `GET /admin/employees` → `employees` (+ `wallets` 조인)
- `POST /admin/wallets/create` → `wallets` 생성, `employees.wallet_status` 업데이트, `audit_logs` 기록
- `POST /admin/mint/request` → `approvals`(kind=mint) + `approval_targets`
- `POST /admin/burn/request` → `approvals`(kind=burn) + `approval_targets`
- `GET /admin/approvals/pending` → `approvals` WHERE status='pending' (조인: approval_targets)
- `POST /admin/approvals/{approvalId}/confirm` → 트랜잭션: approvals.status 변경 → `admin_transactions` 생성 → `wallet_transactions` 생성 → `audit_logs`
- `GET /admin/stats/daily` → `stats_daily`
