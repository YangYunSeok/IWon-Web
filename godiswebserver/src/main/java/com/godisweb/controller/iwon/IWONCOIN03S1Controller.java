package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN03S1Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * SSOT: IWONCOIN03S1 (코인 지급 관리)
 * Front: godiswebfront/src/screens/IWon/IWONCOIN03S1.jsx
 */
@RestController
@RequestMapping("/api/admin")
public class IWONCOIN03S1Controller {

    private final IWONCOIN03S1Service service;

    public IWONCOIN03S1Controller(IWONCOIN03S1Service service) {
        this.service = service;
    }

    /**
     * 지급 요청 생성 (Mint)
     * POST /api/admin/mint/request
     */
    @PostMapping("/mint/request")
    public ResponseEntity<Map<String, Object>> requestMint(@RequestBody Map<String, Object> body) {
        Object employeeIdsObj = body.get("employeeIds");
        @SuppressWarnings("unchecked")
        List<String> employeeIds = (employeeIdsObj instanceof List) ? (List<String>) employeeIdsObj : null;

        String coinType = body.get("coinType") == null ? null : String.valueOf(body.get("coinType"));
        Object amountObj = body.get("amount");
        Long amount = (amountObj instanceof Number) ? ((Number) amountObj).longValue() : null;
        String reason = body.get("reason") == null ? null : String.valueOf(body.get("reason"));

        if (employeeIds == null || employeeIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "employeeIds is required"));
        }
        if (coinType == null || coinType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "coinType is required"));
        }
        if (amount == null || amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "amount must be > 0"));
        }

        return ResponseEntity.ok(service.createMintRequest(employeeIds, coinType, amount, reason));
    }

    /**
     * 회수 요청 생성 (Burn)
     * POST /api/admin/burn/request
     */
    @PostMapping("/burn/request")
    public ResponseEntity<Map<String, Object>> requestBurn(@RequestBody Map<String, Object> body) {
        Object employeeIdsObj = body.get("employeeIds");
        @SuppressWarnings("unchecked")
        List<String> employeeIds = (employeeIdsObj instanceof List) ? (List<String>) employeeIdsObj : null;

        String coinType = body.get("coinType") == null ? null : String.valueOf(body.get("coinType"));
        Object amountObj = body.get("amount");
        Long amount = (amountObj instanceof Number) ? ((Number) amountObj).longValue() : null;
        String reason = body.get("reason") == null ? null : String.valueOf(body.get("reason"));

        if (employeeIds == null || employeeIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "employeeIds is required"));
        }
        if (coinType == null || coinType.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "coinType is required"));
        }
        if (amount == null || amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "amount must be > 0"));
        }

        return ResponseEntity.ok(service.createBurnRequest(employeeIds, coinType, amount, reason));
    }
}
