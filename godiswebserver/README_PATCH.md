# Flicker Fix Patch (Backend)
적용 일시: 2025-08-12 02:51:30

## 변경 파일
- `src/main/java/com/example/menutreebackend/model/SubscriptionRecord.java`
  - `@JsonProperty("key") getKey()` 추가: JSON 응답에 안정적인 `key` 필드 포함

## 실행 방법
```bash
./gradlew bootRun
```
서버 포트: 8080
