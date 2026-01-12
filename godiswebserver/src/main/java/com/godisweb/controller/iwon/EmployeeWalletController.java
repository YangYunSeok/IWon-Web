package com.godisweb.controller.iwon;

import com.godisweb.service.iwon.EmployeeWalletService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Employee Wallet API
 * Frontend SSOT: godiswebfront/src/api/employeeWalletApi.jsx
 */
@RestController
@RequestMapping("/api/employee-wallet")
public class EmployeeWalletController {

    private final EmployeeWalletService employeeWalletService;

    public EmployeeWalletController(EmployeeWalletService employeeWalletService) {
        this.employeeWalletService = employeeWalletService;
    }

    /**
     * GET /api/employee-wallet/list
     */
    @GetMapping("/list")
    public List<Map<String, Object>> getWalletList(@RequestParam Map<String, Object> params) {
        return employeeWalletService.getWalletList(params);
    }

    /**
     * GET /api/employee-wallet/detail/{id}
     */
    @GetMapping("/detail/{id}")
    public Map<String, Object> getWalletDetail(@PathVariable("id") String id) {
        return employeeWalletService.getWalletDetail(id);
    }

    /**
     * PUT /api/employee-wallet/update/{id}
     */
    @PutMapping("/update/{id}")
    public Map<String, Object> updateWallet(@PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {
        return employeeWalletService.updateWallet(id, body);
    }
}
