# Web Admin 공통 타입 / Enum (SSOT)

> 본 문서는 `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 와 `docs/기본설계문서/api_및_데이터모델_명세서(관리자용).md` 에 흩어져 있던 **관리자 웹 전용 타입 정의**를 MCP/Codegen 구조에 맞춰 단일화한 문서입니다.
> 공통 규약은 `docs/design/_index.md` 가이드라인을 따릅니다.

## 1. 스칼라/단위 정의

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| IWC | number | 관리자 웹에서 사용하는 코인 금액. 단위는 원화 정수이며 `KRW` 와 동일 단위로 취급한다. |
| ISODateString | string | ISO-8601 시간 문자열. 모든 서버 시간 필드는 이 포맷을 사용한다. |

## 2. Enum / 리터럴 값

| 이름 | 값 | 설명 |
| --- | --- | --- |
| UserRole | 'operator' \| 'approver' \| 'viewer' | 관리자 권한 등급. Operator 는 요청 생성/관리, Approver 는 승인/확정/감사, Viewer 는 조회 전용이다. |
| WalletStatus | 'uncreated' \| 'active' \| 'frozen' | 임직원 지갑 상태. 미생성/활성/동결을 의미한다. |
| TxType | 'mint' \| 'burn' \| 'transfer' | 관리자 트랜잭션 유형. 지급, 회수, 내부 이체(관리자 실행)를 식별한다. |
| AdminTxStatus | 'pending' \| 'success' \| 'failed' | 관리자 트랜잭션 처리 상태. 온체인 확정 여부를 표시한다. |
| ApprovalStatus | 'pending' \| 'approved' \| 'rejected' | 승인 요청 상태. 대기/승인/반려를 의미한다. |
| ApprovalType | 'settlement' \| 'naverpayConversion' \| 'mint' \| 'burn' | 승인 요청 유형(정산/전환/Mint/Burn) |
| ApprovalRequesterType | 'merchant' \| 'system' \| 'admin' | 요청 주체(가맹점/시스템/관리자) |
| CoinUsageCategory | 'welfare' \| 'payment' | 복지 코인 vs 결제 코인 용도 구분. UI에서는 파이 차트/필터 등에 사용한다. |

| CoinType | 'welfare' \| 'payment' | 코인 식별자(동일 값). API/모델 타입으로 명시적으로 사용 |
| MonthlyPlanStatus | 'draft' \| 'confirmed' | 월별 지급 계획 상태(UI 배지) |
| MonthlyPayeeStatus | 'scheduled' \| 'paid' \| 'cancelled' | 월별 지급 대상 상태(스케줄/지급/취소) |

## 3. 상태/프로세스 값

- 긴 처리 플로우 상태/프로세스 값은 API 계약 문서에서 정의되는 값을 우선한다.
- 관리자 전용 Alert, 노드 상태 등은 UI 문서에서 텍스트로 표시하며, API에서 필요해지면 별도 enum 으로 확장한다.
