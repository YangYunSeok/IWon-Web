package com.godisweb.controller.iwon;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.iwon.IWONCOIN01Service;

/**
 * Screen-aligned API controller for IWONCOIN01S1 (Dashboard).
 *
 * Naming rule:
 * - Frontend programId: IWONCOIN01S1
 * - Backend class/file base: IWONCOIN01 (suffix like S1 omitted)
 *
 * Endpoints:
 * - GET /api/iwon/iwoncoin01s1/supply
 * - GET /api/iwon/iwoncoin01s1/daily
 */
@RestController
@RequestMapping("/api/iwon/iwoncoin01s1")
public class IWONCOIN01Controller {

    private final IWONCOIN01Service iwoncoin01Service;

    public IWONCOIN01Controller(IWONCOIN01Service iwoncoin01Service) {
        this.iwoncoin01Service = iwoncoin01Service;
    }

    @GetMapping("/supply")
    public Map<String, Object> getSupplySummary() {
        return iwoncoin01Service.getSupplySummary();
    }

    @GetMapping("/daily")
    public Map<String, Object> getDailyMetrics() {
        return iwoncoin01Service.getDailyMetrics();
    }
}
