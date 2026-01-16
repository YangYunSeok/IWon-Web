package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN05S1Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class IWONCOIN05S1Controller {

    private final IWONCOIN05S1Service service;

    public IWONCOIN05S1Controller(IWONCOIN05S1Service service) {
        this.service = service;
    }

    /**
     * SSOT: GET /admin/approvals
     */
    @GetMapping("/approvals")
    public ResponseEntity<Map<String, Object>> listApprovals(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "50") int size) {
        List<Map<String, Object>> items = service.list(status, keyword, page, size);
        int total = service.count(status, keyword);
        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", total));
    }

    /**
     * SSOT: GET /admin/approvals/{approvalId}
     */
    @GetMapping("/approvals/{approvalId}")
    public ResponseEntity<Map<String, Object>> getApproval(@PathVariable String approvalId) {
        Map<String, Object> detail = service.getDetail(approvalId);
        if (detail == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", "APPROVAL_NOT_FOUND",
                    "message", "approval not found"));
        }
        return ResponseEntity.ok(detail);
    }

    /**
     * SSOT: POST /admin/approvals/{approvalId}/confirm
     */
    @PostMapping("/approvals/{approvalId}/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@PathVariable String approvalId) {
        Map<String, Object> tx = service.confirm(approvalId, null);
        if (tx == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", "APPROVAL_NOT_FOUND",
                    "message", "approval not found"));
        }
        if (tx.containsKey("error")) {
            String code = String.valueOf(tx.get("error"));
            int http = "UNSUPPORTED_APPROVAL_TYPE".equals(code) ? 400 : 409;
            return ResponseEntity.status(http).body(Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", code,
                    "message", "approval confirm failed"));
        }
        return ResponseEntity.ok(tx);
    }

    /**
     * SSOT: POST /admin/approvals/{approvalId}/reject
     */
    @PostMapping("/approvals/{approvalId}/reject")
    public ResponseEntity<Map<String, Object>> reject(
            @PathVariable String approvalId,
            @RequestBody Map<String, Object> body) {
        String reason = body.get("reason") == null ? null : String.valueOf(body.get("reason"));
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "REJECT_REASON_REQUIRED",
                    "message", "reason is required"));
        }

        Map<String, Object> detail = service.reject(approvalId, null, reason);
        if (detail == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", "APPROVAL_NOT_FOUND",
                    "message", "approval not found"));
        }
        if (detail.containsKey("error")) {
            return ResponseEntity.status(409).body(Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", String.valueOf(detail.get("error")),
                    "message", "approval already processed"));
        }
        return ResponseEntity.ok(detail);
    }
}
