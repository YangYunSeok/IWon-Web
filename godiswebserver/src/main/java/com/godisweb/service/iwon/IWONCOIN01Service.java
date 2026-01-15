package com.godisweb.service.iwon;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.godisweb.mapper.iwon.IWONCOIN01Mapper;

@Service
public class IWONCOIN01Service {

    private final IWONCOIN01Mapper mapper;

    public IWONCOIN01Service(IWONCOIN01Mapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> getSupplySummary() {
        Map<String, Object> row = mapper.selectSupplySummary(new HashMap<>());

        boolean matched = toBoolean(getAny(row, "matched"));
        String checkedAt = toStringOrNull(getAny(row, "checkedAt", "checked_at"));
        Long blockHeight = toLongOrNull(getAny(row, "blockHeight", "block_height"));
        BigDecimal dbTotal = toBigDecimal(getAny(row, "dbTotal", "db_total"));
        BigDecimal chainTotal = toBigDecimal(getAny(row, "chainTotal", "chain_total"));
        BigDecimal diff = toBigDecimal(getAny(row, "diff"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matched", matched);
        result.put("checkedAt", checkedAt);
        result.put("blockHeight", blockHeight);
        result.put("dbTotal", dbTotal);
        result.put("chainTotal", chainTotal);
        result.put("diff", diff);
        return result;
    }

    public Map<String, Object> getDailyMetrics() {
        return getDailyMetrics(null);
    }

    public Map<String, Object> getDailyMetrics(String queryDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("date", queryDate);

        Map<String, Object> row = mapper.selectDailyMetrics(params);

        String date = toStringOrNull(getAny(row, "date"));
        int newWalletCount = toInt(getAny(row, "newWalletCount", "new_wallet_count"));
        BigDecimal mintedAmount = toBigDecimal(getAny(row, "mintedAmount", "minted_amount"));
        BigDecimal burnedAmount = toBigDecimal(getAny(row, "burnedAmount", "burned_amount"));
        int pendingApprovalCount = toInt(getAny(row, "pendingApprovalCount", "pending_approval_count"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", date);
        result.put("newWalletCount", newWalletCount);
        result.put("mintedAmount", mintedAmount);
        result.put("burnedAmount", burnedAmount);
        result.put("pendingApprovalCount", pendingApprovalCount);
        return result;
    }

    private static Object getAny(Map<String, Object> row, String... keys) {
        if (row == null || keys == null)
            return null;
        for (String key : keys) {
            if (key == null)
                continue;
            if (row.containsKey(key))
                return row.get(key);
        }
        return null;
    }

    private static boolean toBoolean(Object v) {
        if (v == null)
            return false;
        if (v instanceof Boolean b)
            return b;
        if (v instanceof Number n)
            return n.intValue() != 0;
        return "true".equalsIgnoreCase(String.valueOf(v).trim()) || "Y".equalsIgnoreCase(String.valueOf(v).trim());
    }

    private static int toInt(Object v) {
        if (v == null)
            return 0;
        if (v instanceof Number n)
            return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static Long toLongOrNull(Object v) {
        if (v == null)
            return null;
        if (v instanceof Number n)
            return n.longValue();
        try {
            return Long.parseLong(String.valueOf(v).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null)
            return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd)
            return bd;
        if (v instanceof Number n)
            return new BigDecimal(String.valueOf(n));
        try {
            return new BigDecimal(String.valueOf(v).trim());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private static String toStringOrNull(Object v) {
        if (v == null)
            return null;
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }
}
