package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.CoinService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * IWon 코인 관리 컨트롤러
 * - 지갑 정보 조회, 직원 목록 조회, 코인 전송 API 제공
 */
@RestController
@RequestMapping("/api/coin")
public class CoinController {

    private final CoinService coinService;

    public CoinController(CoinService coinService) {
        this.coinService = coinService;
    }

    /**
     * 관리자 지갑 정보 및 잔액 조회
     */
    @PostMapping("/getAdminWalletInfo")
    public Map<String, Object> getAdminWalletInfo() {
        return coinService.getAdminWalletInfo();
    }

    /**
     * 직원 목록 조회
     */
    @GetMapping("/getEmployeeList")
    public List<Map<String, Object>> getEmployeeList(@RequestParam Map<String, Object> param) {
        return coinService.getEmployeeList(param);
    }

    /**
     * 코인 전송 (지급)
     */
    @PostMapping("/transfer")
    public Map<String, Object> transferCoin(@RequestBody Map<String, Object> param) {
        return coinService.transferCoin(param);
    }
    
    /**
     * 전체 잔액 동기화
     */
    @PostMapping("/syncBalances")
    public Map<String, Object> syncBalances() {
        return coinService.syncBalances();
    }
}