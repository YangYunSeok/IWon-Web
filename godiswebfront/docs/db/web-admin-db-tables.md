# Web Admin DB 테이블 명세

이 문서는 관리자 웹을 위한 권장 데이터베이스 테이블 명세입니다.

전제

- DB: PostgreSQL 표기 기준
- 금액/잔액: 정수형(`bigint`)으로 저장 (단위: IWC)
- 시간: `timestamptz`
- JSON 컬럼: `jsonb`
- PK는 명시, FK·인덱스 권장 표기 포함
- SSOT: `docs/design/*` (특히 API 계약: `docs/design/api/web-admin.md`, 모델 의미: `docs/design/model/web-admin.md`)

---

## Admin Users

- 목적: 관리자 계정 (operator / approver / viewer)
- 컬럼:
  - `id`: uuid PRIMARY KEY DEFAULT gen_random_uuid()  # 관리자 고유 ID
  - `username`: varchar(150) NOT NULL UNIQUE  # 로그인 ID(고유)
  - `display_name`: varchar(200) NOT NULL  # 화면 표시 이름
  - `email`: varchar(320) NULL  # 이메일
  - `password_hash`: varchar(255) NOT NULL  # 비밀번호 해시
  - `role_id`: uuid NOT NULL REFERENCES admin_roles(id)  # 역할 ID(FK)
  - `status`: varchar(20) NOT NULL DEFAULT 'active'  # 계정 상태(active/inactive)
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
  - `last_login`: timestamptz NULL  # 마지막 로그인 일시
- 인덱스: `username` (unique), `role_id`

## Admin Roles

- 목적: 역할 정의
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 역할 고유 ID
  - `name`: varchar(50) NOT NULL UNIQUE  # 역할명(예: operator, approver, viewer)
  - `description`: text NULL  # 설명

## Audit Logs

- 목적: 주요 관리자 행위 감사 로그
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 로그 고유 ID
  - `actor_id`: uuid NULL REFERENCES admin_users(id)  # 행위자 ID
  - `action`: varchar(100) NOT NULL  # 행위명
  - `resource_type`: varchar(100) NULL  # 리소스 종류
  - `resource_id`: varchar(255) NULL  # 리소스 ID
  - `details`: jsonb NULL  # 상세 정보
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
- 인덱스: `actor_id`, `created_at`

## Employees

- 목적: 임직원 기본정보 및 지갑 상태
- 컬럼:
  - `employee_id`: varchar(50) PRIMARY KEY  # 사번(고유)
  - `name`: varchar(200) NOT NULL  # 이름
  - `department`: varchar(200) NULL  # 부서
  - `position`: varchar(200) NULL  # 직급/직책 (UI 표기용)
  - `email`: varchar(320) NULL  # 이메일
  - `phone`: varchar(50) NULL  # 전화번호
  - `hire_date`: date NULL  # 입사일
  - `wallet_status`: varchar(20) NOT NULL DEFAULT 'uncreated'  # 지갑상태(uncreated/active/frozen)
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
  - `updated_at`: timestamptz NULL  # 수정일시
- 인덱스: `department`, `name`

## Coin Types

- 목적: 발행 자산(코인) 정의
- 컬럼:
  - `coin_type`: varchar(50) PRIMARY KEY  # 코인 타입(고유)
  - `name`: varchar(100) NOT NULL  # 코인명
  - `decimals`: integer NOT NULL DEFAULT 0  # 소수점 자리수
  - `metadata`: jsonb NULL  # 추가 메타정보

## Wallets

- 목적: 임직원 지갑(온체인 주소 등)
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 지갑 고유 ID
  - `employee_id`: varchar(50) NOT NULL REFERENCES employees(employee_id)  # 소유자 사번
  - `address`: varchar(200) NULL UNIQUE  # 온체인 주소
  - `status`: varchar(20) NOT NULL DEFAULT 'uncreated'  # 지갑상태(uncreated/active/frozen)
  - `balance`: bigint NOT NULL DEFAULT 0  # 잔액(IWC)
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
  - `activated_at`: timestamptz NULL  # 활성화 일시
  - `frozen_at`: timestamptz NULL  # 동결 일시
  - `last_sync_at`: timestamptz NULL  # 마지막 동기화 일시
- 인덱스: `employee_id`, `address`

## Wallet Transactions (Ledger)

- 목적: 지갑별 입출금/조정 내역
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 거래 고유 ID
  - `wallet_id`: uuid NOT NULL REFERENCES wallets(id)  # 지갑 ID
  - `type`: varchar(30) NOT NULL  # 거래유형(mint/burn/transfer). 필요 시 내부 조정용 adjust는 확장값으로만 사용
  - `amount`: bigint NOT NULL  # 금액(양수:입금, 음수:출금)
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `counterparty`: varchar(255) NULL  # 상대방 정보
  - `related_approval_id`: uuid NULL REFERENCES approvals(id)  # 연관 승인 ID
  - `related_tx_id`: varchar(255) NULL  # 연관 Tx ID
  - `operator_id`: uuid NULL REFERENCES admin_users(id)  # 처리자 ID
  - `memo`: text NULL  # 메모
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
- 인덱스: `wallet_id`, `created_at`, `related_approval_id`

## Approvals

- 목적: 승인 워크플로우 메인 레코드
- SSOT Enum:
  - `type`: ApprovalType = settlement / naverpayConversion / mint / burn
  - `status`: ApprovalStatus = pending / approved / rejected
  - `requester_type`: ApprovalRequesterType = merchant / system / admin
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 승인 고유 ID
  - `type`: varchar(30) NOT NULL  # 승인유형(ApprovalType)
  - `requester_type`: varchar(30) NOT NULL  # 요청 주체(ApprovalRequesterType)
  - `requester_id`: uuid NULL REFERENCES admin_users(id)  # 요청자 ID(요청 주체가 admin 인 경우)
  - `requester_name`: varchar(200) NULL  # 요청 주체 표시명(가맹점/시스템/관리자)
  - `subject_name`: varchar(200) NULL  # UI 표시용 대상자/가맹점명
  - `request_payload`: jsonb NOT NULL  # 요청 상세(ApprovalDetail 확장 필드 포함 가능)
  - `amount`: bigint NULL  # 요청 금액(복수 대상이면 합계)
  - `coin_type`: varchar(50) NULL REFERENCES coin_types(coin_type)  # 코인 타입(요청 단위가 코인별이면 NOT NULL 권장)
  - `status`: varchar(30) NOT NULL DEFAULT 'pending'  # 상태(pending/approved/rejected)
  - `approver_id`: uuid NULL REFERENCES admin_users(id)  # 승인자 ID
  - `requested_at`: timestamptz NOT NULL DEFAULT now()  # 요청일시
  - `decided_at`: timestamptz NULL  # 결정일시
  - `executed_at`: timestamptz NULL  # 실행일시
  - `reason`: text NULL  # 사유(반려 사유 등)
- 인덱스: `status`, `requester_type`, `requester_id`, `approver_id`, `requested_at`

## Approval Targets

- 목적: 하나의 Approval에 속한 대상 항목
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 대상 고유 ID
  - `approval_id`: uuid NOT NULL REFERENCES approvals(id) ON DELETE CASCADE  # 승인 ID
  - `employee_id`: varchar(50) NULL REFERENCES employees(employee_id)  # 사번
  - `wallet_id`: uuid NULL REFERENCES wallets(id)  # 지갑 ID
  - `amount`: bigint NOT NULL  # 금액
  - `note`: text NULL  # 비고
- 인덱스: `approval_id`, `employee_id`

## Admin Transactions (Execution Records)

- 목적: 승인 실행(외부 호출) 결과 및 상태 기록
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 실행 고유 ID
  - `approval_id`: uuid NOT NULL REFERENCES approvals(id)  # 승인 ID
  - `tx_type`: varchar(30) NOT NULL  # 트랜잭션 유형(mint/burn/transfer)
  - `amount`: bigint NULL  # 금액
  - `coin_type`: varchar(50) NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `tx_hash`: varchar(255) NULL  # 온체인 TxHash
  - `status`: varchar(20) NOT NULL DEFAULT 'pending'  # 상태(pending,success,failed)
  - `executed_by`: uuid NULL REFERENCES admin_users(id)  # 실행자 ID
  - `executed_at`: timestamptz NULL  # 실행일시
  - `response`: jsonb NULL  # 외부 응답
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
- 인덱스: `approval_id`, `status`, `tx_hash`

## Stats Daily

- 목적: 대시보드용 일별 집계
- 컬럼:
  - `date`: date PRIMARY KEY  # 집계 일자
  - `total_supply`: bigint NOT NULL  # 총 발행량
  - `minted_today`: bigint NOT NULL DEFAULT 0  # 당일 발행량
  - `burned_today`: bigint NOT NULL DEFAULT 0  # 당일 소각/회수량
  - `active_wallets`: integer NOT NULL DEFAULT 0  # 활성 지갑 수
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시

## Supply Summary History (선택)

- 목적: 총 발행량 스냅샷
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 스냅샷 고유 ID
  - `snapshot_at`: timestamptz NOT NULL DEFAULT now()  # 스냅샷 시점
  - `total_supply`: bigint NOT NULL  # 총 발행량
  - `metadata`: jsonb NULL  # 추가 정보

## Supply Snapshots (코인별 상세 스냅샷, 선택)

- 목적: 특정 시점의 코인별 합계(대시보드 `SupplySummary.coinTotals` 대응)
- 컬럼:
  - `id`: uuid PRIMARY KEY  # 상세 스냅샷 고유 ID
  - `snapshot_id`: uuid NOT NULL REFERENCES supply_summary_history(id) ON DELETE CASCADE  # 스냅샷 ID
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `db_total`: bigint NOT NULL  # DB 기준 총액
  - `chain_total`: bigint NOT NULL  # 온체인 기준 총액
  - `matched`: boolean NOT NULL DEFAULT false  # 일치 여부
  - `note`: text NULL  # 비고
- 인덱스: `snapshot_id`, `coin_type`

## Monthly Payees (월별 지급 대상자)

- 목적: UI의 "월별 지급 대상자 관리" 기능을 단일 테이블(`monthly_payees`)로 관리. 연도/월을 기준으로 레코드들을 그룹화합니다.

## Monthly Plans (월별 지급 계획 헤더)

- 목적: 월별 지급 계획의 확정 상태(Draft/Confirmed) 및 확정 시각을 관리합니다.
- Note: 현재 API 경로는 `{year}-{month}`로 coinType이 포함되지 않습니다. 코인별 계획이 필요하면 API/SSOT에 coinType 포함을 반영하세요.

### monthly_plans

- 컬럼:
  - `id`: uuid PRIMARY KEY  # 계획 고유 ID
  - `year`: integer NOT NULL  # 지급 연도
  - `month`: integer NOT NULL  # 지급 월(1..12)
  - `coin_type`: varchar(50) NOT NULL DEFAULT 'welfare' REFERENCES coin_types(coin_type)  # 코인 타입(단일 코인 운영이면 DEFAULT 유지)
  - `status`: varchar(20) NOT NULL DEFAULT 'draft'  # 상태(draft/confirmed)
  - `confirmed_at`: timestamptz NULL  # 확정 시각
  - `confirmed_by`: uuid NULL REFERENCES admin_users(id)  # 확정자
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
  - `updated_at`: timestamptz NULL  # 수정일시
- 제약/인덱스:
  - UNIQUE(year, month, coin_type)
  - 인덱스: `year`, `month`, `status`

### monthly_payees

- 컬럼:
  - `id`: uuid PRIMARY KEY  # 지급대상 고유 ID
  - `year`: integer NOT NULL  # 지급 연도
  - `month`: integer NOT NULL  # 지급 월(1..12)
  - `employee_id`: varchar(50) NOT NULL REFERENCES employees(employee_id)  # 사번
  - `name`: varchar(200) NOT NULL  # 이름(조회 성능/스냅샷 목적. 정합성은 employees 조인으로 보완)
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `amount`: bigint NOT NULL  # 금액
  - `reason`: text NULL  # 지급 사유
  - `status`: varchar(20) NOT NULL DEFAULT 'scheduled'  # 상태(scheduled/paid/cancelled)
  - `scheduled_at`: timestamptz NULL  # 예정 지급일시
  - `paid_at`: timestamptz NULL  # 실제 지급일시
  - `created_by`: uuid NULL REFERENCES admin_users(id)  # 생성자 ID
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
- 제약/인덱스:
  - UNIQUE(year, month, employee_id, coin_type) -- 중복 방지
  - 인덱스: `year`, `month`, `employee_id`, `status`

Note: 전월 데이터 가져오기나 CSV 업로드 이력은 별도 로그 테이블 없이 애플리케이션 레벨에서 처리하거나, 필요 시 `audit_logs`에 업로드 이벤트를 기록하는 방식으로 충분합니다.

## Coin Daily Aggregates (코인별 일별 집계, 선택)

- 목적: `stats_daily`보다 더 상세한 코인 단위의 일별 집계가 필요할 경우 사용. 대시보드 집계 성능을 위해 일별 집계를 별도 테이블에 보관 권장.
- 컬럼:
  - `date`: date NOT NULL  # 집계 일자
  - `coin_type`: varchar(50) NOT NULL REFERENCES coin_types(coin_type)  # 코인 타입
  - `total_supply`: bigint NOT NULL  # 해당 코인 DB 기준 총 유통량
  - `minted`: bigint NOT NULL DEFAULT 0  # 해당 일자 발행
  - `burned`: bigint NOT NULL DEFAULT 0  # 해당 일자 소각/회수
  - `active_wallets`: integer NOT NULL DEFAULT 0  # 활성 지갑 수
  - `created_at`: timestamptz NOT NULL DEFAULT now()  # 생성일시
- 제약/인덱스: PRIMARY KEY(date, coin_type), 인덱스: `coin_type`

권고:

- `supply_summary_history`는 전체 스냅샷(시점)을 보관하고, `supply_snapshots`는 코인별 상세 스냅샷을 보관합니다. 성능상 대시보드에 자주 사용되는 집계(일별)는 `coin_daily_aggregates`와 같은 별도 집계 테이블을 유지하는 것이 좋습니다.
- 원시 원장(`wallet_transactions`)에서 실시간으로 집계하면 비용이 크므로 정기 배치(job)으로 집계하여 `coin_daily_aggregates`와 `supply_summary_history/supply_snapshots`를 업데이트하세요.

---

## 운영/성능/보안 노트

- 트랜잭션: `approvals` 실행은 DB 트랜잭션으로 처리하여 `approvals` 상태 변경 → `admin_transactions` 생성 → `wallet_transactions` 생성 순으로 일관성 보장
- 동시성: 잔액 업데이트는 `SELECT ... FOR UPDATE` 또는 optimistic locking 사용 권장
- 감사: 모든 승인/실행/지갑 생성/수정은 `audit_logs`에 기록
- 보안: `admin_users.password_hash`는 안전한 해시(Bcrypt/Argon2) 사용
- 인덱스: 운영 조회패턴에 따라 추가 인덱스 권장

## API ↔ 테이블 매핑(주요)

- `GET /admin/employees` → `employees` (+ `wallets` 조인)
- `POST /admin/wallets/create` → `wallets` 생성, `employees.wallet_status` 업데이트, `audit_logs` 기록
- `POST /admin/mint/request` → `approvals`(type=mint) + `approval_targets`
- `POST /admin/burn/request` → `approvals`(type=burn) + `approval_targets`
- `GET /admin/approvals?status=pending` → `approvals` WHERE status='pending' (조인: approval_targets)
- `GET /admin/approvals/{approvalId}` → `approvals` + (필요 시) `approval_targets` / 첨부/타임라인
- `POST /admin/approvals/{approvalId}/confirm` → 트랜잭션: approvals.status 변경 → `admin_transactions` 생성 → `wallet_transactions` 생성 → `audit_logs`
- `POST /admin/approvals/{approvalId}/reject` → `approvals` status='rejected' + reason 기록
- `GET /iwon/iwoncoin01s1/supply` → `supply_summary_history` (+ `supply_snapshots`) (온체인 수치는 외부 노드/인덱서 결과를 함께 사용)
- `GET /iwon/iwoncoin01s1/daily` → `stats_daily`
- `GET /admin/monthly-payees` → `monthly_payees` (+ `employees` 조인으로 department/name/keyword 확장)
- `POST /admin/monthly-payees/{id}` → `monthly_payees` 업서트 + `audit_logs`
- `DELETE /admin/monthly-payees/{id}` → `monthly_payees` 삭제 + `audit_logs`
- `PUT /admin/monthly-payees/bulk-delete` → `monthly_payees` 일괄 삭제 + `audit_logs`
- `DELETE /admin/monthly-payees/{year}-{month}/confirm` → `monthly_plans` status='confirmed', confirmed_at/by 기록 (+ 지급 job 트리거는 구현에 따름)
- `GET /admin/monthly-payees/export` → `monthly_payees` (조회 후 CSV/XLSX 생성)
- `GET /admin/transactions` → `wallet_transactions` (+ `wallets`, `employees`, `approvals`, `admin_transactions` 조인)

## 재무회계결산(TBD)

- `docs/design/ui/admin/web-financial-closing.md` 기준으로 화면은 정의되어 있으나, API/DB 계약은 확정 필요합니다.
- 기본 접근:
  - 원천 데이터: `approvals`, `admin_transactions`, `wallet_transactions`
  - 조회 성능이 필요하면 기간/탭 기준의 집계 뷰 또는 리포트 테이블을 별도 도입
