package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.IWONCOIN04S1Mapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class IWONCOIN04S1Service {

    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final IWONCOIN04S1Mapper mapper;

    public IWONCOIN04S1Service(IWONCOIN04S1Mapper mapper) {
        this.mapper = mapper;
    }

    public List<Map<String, Object>> list(
            String from,
            String to,
            String type,
            String coinType,
            String keyword,
            int page,
            int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 200));
        int offset = (safePage - 1) * safeSize;

        String fromDate = normalizeToYmdOrNull(from);
        String toDate = normalizeToYmdOrNull(to);

        // SSOT: 기본 최근 30일
        if (fromDate == null && toDate == null) {
            LocalDate today = LocalDate.now();
            fromDate = today.minusDays(29).format(YMD);
            toDate = today.format(YMD);
        } else if (fromDate == null && toDate != null) {
            // to만 있으면 from은 동일 일자 기준으로 최소 범위
            fromDate = toDate;
        } else if (fromDate != null && toDate == null) {
            toDate = fromDate;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("fromDate", fromDate);
        params.put("toDate", toDate);
        params.put("type", normalizeLowerOrNull(type));
        params.put("coinType", normalizeLowerOrNull(coinType));
        params.put("keyword", keyword == null ? null : keyword.trim());
        params.put("size", safeSize);
        params.put("offset", offset);

        return mapper.selectTransactions(params);
    }

    public int count(
            String from,
            String to,
            String type,
            String coinType,
            String keyword) {
        String fromDate = normalizeToYmdOrNull(from);
        String toDate = normalizeToYmdOrNull(to);

        if (fromDate == null && toDate == null) {
            LocalDate today = LocalDate.now();
            fromDate = today.minusDays(29).format(YMD);
            toDate = today.format(YMD);
        } else if (fromDate == null && toDate != null) {
            fromDate = toDate;
        } else if (fromDate != null && toDate == null) {
            toDate = fromDate;
        }

        Map<String, Object> params = new HashMap<>();
        params.put("fromDate", fromDate);
        params.put("toDate", toDate);
        params.put("type", normalizeLowerOrNull(type));
        params.put("coinType", normalizeLowerOrNull(coinType));
        params.put("keyword", keyword == null ? null : keyword.trim());

        return mapper.countTransactions(params);
    }

    private String normalizeLowerOrNull(String v) {
        if (v == null)
            return null;
        String s = v.trim();
        if (s.isEmpty())
            return null;
        return s.toLowerCase();
    }

    private String normalizeToYmdOrNull(String v) {
        if (v == null)
            return null;
        String s = v.trim();
        if (s.isEmpty())
            return null;

        // ISODateString("2026-01-16T00:00:00Z") 등으로 들어오면 날짜부만 사용
        if (s.length() >= 10) {
            String head = s.substring(0, 10);
            if (head.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return head;
            }
        }

        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return s;
        }

        return null;
    }
}
