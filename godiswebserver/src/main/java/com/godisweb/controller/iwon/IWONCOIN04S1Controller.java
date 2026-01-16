package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.IWONCOIN04S1Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * SSOT: 거래 이력 조회 (TxHistory)
 * - UI: docs/design/ui/admin/web-tx-history.md
 * - API: docs/design/api/web-admin.md (webTxHistory.list)
 * - GET /api/admin/transactions
 *
 * IMPORTANT:
 * - 백엔드 컴포넌트는 화면명(IWONCOIN04S1) 기준으로 구성합니다.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class IWONCOIN04S1Controller {

    private final IWONCOIN04S1Service service;

    public IWONCOIN04S1Controller(IWONCOIN04S1Service service) {
        this.service = service;
    }

    /**
     * SSOT: GET /admin/transactions
     * Query: from,to,type,coinType,keyword,page,size
     */
    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> listTransactions(
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "coinType", required = false) String coinType,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "100") int size) {
        List<Map<String, Object>> items = service.list(from, to, type, coinType, keyword, page, size);
        int total = service.count(from, to, type, coinType, keyword);
        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", total));
    }
}
