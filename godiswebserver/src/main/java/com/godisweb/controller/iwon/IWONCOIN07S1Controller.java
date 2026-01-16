package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN07S1Service;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * SSOT: 재무회계결산 관리 (FinancialClosing)
 * - UI: docs/design/ui/admin/web-financial-closing.md
 * - API: docs/design/api/web-admin.md (webFinancialClosing.*)
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class IWONCOIN07S1Controller {

    private final IWONCOIN07S1Service service;

    public IWONCOIN07S1Controller(IWONCOIN07S1Service service) {
        this.service = service;
    }

    /**
     * SSOT: GET /admin/financial-closing/journals
     */
    @GetMapping("/financial-closing/journals")
    public ResponseEntity<Map<String, Object>> listJournals(
            @RequestParam(value = "periodType", required = false, defaultValue = "month") String periodType,
            @RequestParam(value = "year") int year,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "quarter", required = false) Integer quarter,
            @RequestParam(value = "half", required = false) Integer half,
            @RequestParam(value = "coinType", required = false) String coinType,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "200") int size) {
        Map<String, Object> res = service.listJournals(periodType, year, month, quarter, half, coinType, status, page,
                size);
        if (Boolean.FALSE.equals(res.get("success"))) {
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: GET /admin/financial-closing/journals/{approvalId}
     */
    @GetMapping("/financial-closing/journals/{approvalId}")
    public ResponseEntity<Map<String, Object>> getJournalDetail(@PathVariable("approvalId") String approvalId) {
        Map<String, Object> res = service.getJournalDetail(approvalId);
        if (Boolean.FALSE.equals(res.get("success"))) {
            String code = String.valueOf(res.get("code"));
            int http = "NOT_FOUND".equals(code) ? 404 : 400;
            return ResponseEntity.status(http).body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: GET /admin/financial-closing/report
     */
    @GetMapping("/financial-closing/report")
    public ResponseEntity<Map<String, Object>> getReport(
            @RequestParam(value = "periodType", required = false, defaultValue = "month") String periodType,
            @RequestParam(value = "year") int year,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "quarter", required = false) Integer quarter,
            @RequestParam(value = "half", required = false) Integer half,
            @RequestParam(value = "coinType", required = false) String coinType) {
        Map<String, Object> res = service.getReport(periodType, year, month, quarter, half, coinType);
        if (Boolean.FALSE.equals(res.get("success"))) {
            return ResponseEntity.badRequest().body(res);
        }
        return ResponseEntity.ok(res);
    }

    /**
     * SSOT: GET /admin/financial-closing/export
     *
     * NOTE: 다운로드 방식은 월별지급(export)과 동일하게
     * (1) JSON(downloadUrl) (2) download=1 시 CSV 스트림을 지원합니다.
     */
    @GetMapping("/financial-closing/export")
    public ResponseEntity<?> export(
            @RequestParam(value = "tab") String tab,
            @RequestParam(value = "periodType", required = false, defaultValue = "month") String periodType,
            @RequestParam(value = "year") int year,
            @RequestParam(value = "month", required = false) Integer month,
            @RequestParam(value = "quarter", required = false) Integer quarter,
            @RequestParam(value = "half", required = false) Integer half,
            @RequestParam(value = "coinType", required = false) String coinType,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "format", required = false, defaultValue = "csv") String format,
            @RequestParam(value = "download", required = false, defaultValue = "0") int download) {

        String normalizedTab = (tab == null) ? "" : tab.trim().toLowerCase();
        if (!"journal".equals(normalizedTab) && !"report".equals(normalizedTab)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "INVALID_TAB",
                    "message", "tab must be journal|report"));
        }

        String suffix;
        if ("month".equalsIgnoreCase(periodType)) {
            suffix = String.format("%04d%02d", year, (month == null ? 0 : month));
        } else if ("quarter".equalsIgnoreCase(periodType)) {
            suffix = String.format("%04dQ%d", year, (quarter == null ? 0 : quarter));
        } else if ("half".equalsIgnoreCase(periodType)) {
            suffix = String.format("%04dH%d", year, (half == null ? 0 : half));
        } else {
            suffix = String.format("%04d", year);
        }

        String ext = (format == null || format.isBlank()) ? "csv" : format.trim().toLowerCase();
        String fileName = String.format("FIN_CLOSE_%s_%s.%s", normalizedTab.toUpperCase(), suffix, ext);

        if (download == 1) {
            byte[] bytes;
            if ("journal".equals(normalizedTab)) {
                List<Map<String, Object>> items = service.listJournalsForExport(periodType, year, month, quarter, half,
                        coinType, status);
                bytes = service.toJournalCsvBytes(items);
            } else {
                Map<String, Object> report = service.getReport(periodType, year, month, quarter, half, coinType);
                bytes = service.toReportCsvBytes(report);
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(new MediaType("text", "csv"))
                    .body(bytes);
        }

        String downloadUrl = String.format(
                "/api/admin/financial-closing/export?tab=%s&periodType=%s&year=%d&format=%s&download=1",
                normalizedTab,
                (periodType == null || periodType.isBlank()) ? "month" : periodType,
                year,
                ext);

        if (month != null)
            downloadUrl += "&month=" + month;
        if (quarter != null)
            downloadUrl += "&quarter=" + quarter;
        if (half != null)
            downloadUrl += "&half=" + half;
        if (coinType != null && !coinType.isBlank())
            downloadUrl += "&coinType=" + coinType;
        if (status != null && !status.isBlank())
            downloadUrl += "&status=" + status;

        return ResponseEntity.ok(Map.of(
                "downloadUrl", downloadUrl,
                "fileName", fileName,
                "expiresAt", OffsetDateTime.now().plusMinutes(10).toString()));
    }
}
