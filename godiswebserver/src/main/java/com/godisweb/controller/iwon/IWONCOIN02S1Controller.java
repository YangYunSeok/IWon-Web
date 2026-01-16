package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN02S1Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * SSOT: IWONCOIN02S1 (임직원 지갑 관리)
 * Front: godiswebfront/src/screens/IWon/IWONCOIN02S1.jsx
 */
@RestController
@RequestMapping("/api/admin")
public class IWONCOIN02S1Controller {

    private final IWONCOIN02S1Service service;

    public IWONCOIN02S1Controller(IWONCOIN02S1Service service) {
        this.service = service;
    }

    /**
     * 임직원 지갑 관리 목록
     * GET /api/admin/employees
     */
    @GetMapping("/employees")
    public ResponseEntity<List<Map<String, Object>>> getEmployees(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String walletStatus,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(required = false) Boolean onlyUncreated,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) Integer limit) {
        Integer resolvedLimit = limit;
        Integer resolvedOffset = offset;

        if (resolvedLimit == null && size != null && size > 0) {
            resolvedLimit = size;
        }
        if (resolvedOffset == null && page != null && resolvedLimit != null && page > 0) {
            resolvedOffset = (page - 1) * resolvedLimit;
        }

        return ResponseEntity.ok(service.getEmployees(
                keyword,
                name,
                department,
                walletStatus,
                employmentStatus,
                onlyUncreated,
                resolvedOffset,
                resolvedLimit));
    }

    /**
     * 지갑 생성
     * POST /api/admin/wallets/create
     */
    @PostMapping("/wallets/create")
    public ResponseEntity<Map<String, Object>> createWallets(@RequestBody Map<String, Object> body) {
        Object employeeIdsObj = body.get("employeeIds");
        @SuppressWarnings("unchecked")
        List<String> employeeIds = (employeeIdsObj instanceof List) ? (List<String>) employeeIdsObj : null;

        if (employeeIds == null || employeeIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "ok", false,
                    "message", "employeeIds is required"));
        }

        return ResponseEntity.ok(service.createWallets(employeeIds));
    }
}
