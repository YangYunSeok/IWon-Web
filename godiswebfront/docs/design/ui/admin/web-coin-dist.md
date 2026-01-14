# Web Admin 코인 지급/회수 (CoinDist)

> 원본: [docs/기본설계문서/웹UI및설계가이드(관리자용).md](../../%EA%B8%B0%EB%B3%B8%EC%84%A4%EA%B3%84%EB%AC%B8%EC%84%9C/%EC%9B%B9UI%EB%B0%8F%EC%84%A4%EA%B3%84%EA%B0%80%EC%9D%B4%EB%93%9C(%EA%B4%80%EB%A6%AC%EC%9E%90%EC%9A%A9).md) 5장.
> API 참조: `webMint.request`, `webBurn.request`.

## 1. 목적

- 복지/결제 코인 지급(Mint), 회수(Burn), 일괄 업로드를 처리.
- Operator 가 기안하고 Approver 가 승인.

## 2. 레이아웃

1. **상단 요약**
   - 선택 인원 수, 총 금액 합계.
   - 현재 사용자 권한 표시 (Operator/Approver).
2. **좌측: 대상 선택 영역**
   - 조직도 트리 + 검색.
   - 다중 선택 시 선택 칩 목록.
3. **우측: 제어 패널(Tab)**
   - Tab1 `지급(Mint)` → 코인 타입, 수량 입력, 지급 사유, `[지급 기안]`.
   - Tab2 `회수(Burn)` → 회수 사유, 차감 금액.
   - Tab3 `일괄 업로드` → Excel 업로드, 사전 유효성 미리보기.
4. **하단 처리 로그**
   - 검증 메시지: 잔액 부족, 지갑 미생성 포함 여부.
   - 최근 처리 결과 리스트.

## 3. API 플로우

### 3.1 최초 진입

- TBD (화면 진입 시 호출 API/프리로드 규칙이 문서에 명시되어 있지 않음)

### 3.2 사용자 액션

| 액션 | API |
| --- | --- |
| `[지급 기안]` | `POST /admin/mint/request` (`MintRequest`) |
| `[회수 기안]` | `POST /admin/burn/request` (`BurnRequest`) |
| 일괄 업로드 검증 | 추후 전용 API (미정) |

### 3.3 추가 플로우

- Operator 가 실행 시 `ApprovalStatus=pending` 상태로 리스트에 추가됨.

## 4. 상태 / 에러 / 빈 화면

- 대상 미선택 또는 금액 미입력 시 버튼 비활성화.
- 서버 검증 에러(`VALIDATION_ERROR`, `INSUFFICIENT_RESERVE`)는 우측 패널 상단에 Alert.
- Excel 업로드 실패 시 행 번호/사유 표시.
- 빈 화면: TBD (검색/필터/목록 존재 여부 및 0건 표시 방식이 문서에 명시되어 있지 않음)
- Note: Mint/Burn Request 필드 스펙 확정 시 `docs/design/model/web-admin.md` 업데이트 후 본 문서의 입력 설명 보강.

## 5. 권한

- Role: Operator / Approver
- Operator: 지급/회수 기안(요청 생성)
- Approver: 승인(Approval) 처리 (본 화면에서 가능한 액션 범위는 TBD)
