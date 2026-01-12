# Web Admin 코인 지급/회수 (CoinDist)

> 원본: `docs/기본설계문서/웹UI및설계가이드(관리자용).md` 5장.
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

| 액션 | API |
| --- | --- |
| `[지급 기안]` | `POST /admin/mint/request` (`MintRequest`) |
| `[회수 기안]` | `POST /admin/burn/request` (`BurnRequest`) |
| 일괄 업로드 검증 | 추후 전용 API (미정) |

## 4. UX/검증 규칙

- 대상 미선택 또는 금액 미입력 시 버튼 비활성화.
- Operator 가 실행 시 `ApprovalStatus=pending` 상태로 리스트에 추가됨.
- 서버 검증 에러(`VALIDATION_ERROR`, `INSUFFICIENT_RESERVE`)는 우측 패널 상단에 Alert.
- Excel 업로드 실패 시 행 번호/사유 표시.

## 5. 추후 TODO

- Mint/Burn Request 필드 스펙 확정 시 `docs/design/model/web-admin.md` 업데이트 후 본 문서의 입력 설명 보강.
