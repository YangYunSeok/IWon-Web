package com.godisweb.controller;

import com.godisweb.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST controller that exposes subscription data as JSON. The front‑end React
 * application can call this endpoint to retrieve the data to populate its
 * tables. Optional query parameter {@code status} filters the results by
 * subscription status.
 */
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Return all subscriptions or filter by status if provided. Example:
     * {@code GET /api/subscriptions?status=청약예정}
     *
     * @param status optional status filter
     * @return list of subscriptions
     */
    @PostMapping("/getsubscriptions")
    public List<Map<String, Object>> getSubscriptions(Map<String, Object> param) {
        List<Map<String, Object>> result = subscriptionService.getSubscriptions(param);
        return result;
    }
}