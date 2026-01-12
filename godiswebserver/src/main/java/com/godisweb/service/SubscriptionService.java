package com.godisweb.service;

import com.godisweb.mapper.SubscriptionMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service layer for working with Subscription data. Encapsulates the
 * interaction with the MyBatis mapper and could eventually include business
 * logic such as validation or transformation.
 */
@Service
public class SubscriptionService {

    private final SubscriptionMapper subscriptionMapper;

    public SubscriptionService(SubscriptionMapper subscriptionMapper) {
        this.subscriptionMapper = subscriptionMapper;
    }

    /**
     * Retrieve subscriptions filtered by status. Passing {@code null} will
     * return all records.
     *
     * @param status desired status or null
     * @return list of subscriptions
     */
    public List<Map<String, Object>> getSubscriptions(Map<String, Object> param) {
        return subscriptionMapper.selectSubscriptions(param);
    }
}