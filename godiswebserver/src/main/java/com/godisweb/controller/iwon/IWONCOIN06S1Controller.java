package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN06S1Service;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * SSOT: 월별 지급 대상자 관리 (MonthlyPlan)
 * - UI: docs/design/ui/admin/web-monthly-plan.md
 * - API: docs/design/api/web-admin.md (webMonthlyPayee.*)
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class IWONCOIN06S1Controller {

    private final IWONCOIN06S1Service service;

    public IWONCOIN06S1Controller(IWONCOIN06S1Service service) {
        this.service = service;
    }

    /**
     * SSOT: GET /admin/monthly-payees
     */
    @GetMapping("/monthly-payees")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "coinType", required = false) String coinType,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "100") int size) {
        List<Map<String, Object>> items = service.list(year, month, coinType, status, department, name, keyword, page,
                size);
        int total = service.count(year, month, coinType, status, department, name, keyword);
        return ResponseEntity.ok(Map.of("items", items, "total", total));
    }

    /**
     * SSOT: POST /admin/monthly-payees/{id}
     */
    @PostMapping("/monthly-payees/{id}")
    public ResponseEntity<Map<String, Object>> upsert(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        Map<String, Object> res = service.upsert(id, body);
        if (Boolean.FALSE.equals(res.get("success"))) {
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: DELETE /admin/monthly-payees/{id}
     */
    @DeleteMapping("/monthly-payees/{id}")
    public ResponseEntity<Map<String, Object>> deleteOne(@PathVariable("id") String id) {
        Map<String, Object> res = service.deleteOne(id);
        if (Boolean.FALSE.equals(res.get("success"))) {
            int http = "NOT_FOUND".equals(String.valueOf(res.get("code"))) ? 404 : 400;
            return ResponseEntity.status(http).body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: PUT /admin/monthly-payees/bulk-delete
     */
    @PutMapping("/monthly-payees/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (body.get("ids") instanceof List) ? (List<String>) body.get("ids") : null;

        Map<String, Object> res = service.bulkDelete(ids);
        if (Boolean.FALSE.equals(res.get("success"))) {
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: DELETE /admin/monthly-payees/{year}-{month}/confirm
     */
    @DeleteMapping("/monthly-payees/{yearMonth}/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@PathVariable("yearMonth") String yearMonth) {
        int[] ym = parseYearMonth(yearMonth);
        if (ym == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "INVALID_YEAR_MONTH",
                    "message", "year-month path param must be like 2026-01"));
        }

        Map<String, Object> res = service.confirm(ym[0], ym[1]);
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: GET /admin/monthly-payees/export
     *
     * NOTE:
     * - SSOT의 ExportMonthlyPayeesResponse는 다운로드 방식이 아직 확정되지 않아,
     * 이 구현은 (1) 기본 JSON(downloadUrl) (2) download=1 시 CSV 스트림을 지원합니다.
     */
    @GetMapping("/monthly-payees/export")
    public ResponseEntity<?> export(
            @RequestParam(value = "year") int year,
            @RequestParam(value = "month") int month,
            @RequestParam(value = "coinType", required = false) String coinType,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "format", required = false, defaultValue = "csv") String format,
            @RequestParam(value = "download", required = false, defaultValue = "0") int download) {
        String fileName = String.format("monthly-payees-%04d-%02d%s.%s",
                year,
                month,
                (coinType == null || coinType.isBlank()) ? "" : ("-" + coinType),
                (format == null || format.isBlank()) ? "csv" : format);

        if (download == 1) {
            List<Map<String, Object>> items = service.listForExport(year, month, coinType, status, department, name,
                    keyword);
            byte[] bytes = service.toCsvBytes(items);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(new MediaType("text", "csv"))
                    .body(bytes);
        }

        String downloadUrl = String.format("/api/admin/monthly-payees/export?year=%d&month=%d&format=%s&download=1",
                year,
                month,
                (format == null || format.isBlank()) ? "csv" : format);
        if (coinType != null && !coinType.isBlank())
            downloadUrl += "&coinType=" + coinType;
        if (status != null && !status.isBlank())
            downloadUrl += "&status=" + status;
        if (department != null && !department.isBlank())
            downloadUrl += "&department=" + department;
        if (name != null && !name.isBlank())
            downloadUrl += "&name=" + name;
        if (keyword != null && !keyword.isBlank())
            downloadUrl += "&keyword=" + keyword;

        return ResponseEntity.ok(Map.of(
                "downloadUrl", downloadUrl,
                "fileName", fileName,
                "expiresAt", OffsetDateTime.now().plusMinutes(10).toString()));
    }

    private static int[] parseYearMonth(String yearMonth) {
        if (yearMonth == null)
            return null;
        String s = yearMonth.trim();
        String[] parts = s.split("-");
        if (parts.length != 2)
            return null;
        try {
            int y = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            if (y < 1900 || y > 3000)
                return null;
            if (m < 1 || m > 12)
                return null;
            return new int[] { y, m };
        } catch (Exception e) {
            return null;
        }
    }
}
