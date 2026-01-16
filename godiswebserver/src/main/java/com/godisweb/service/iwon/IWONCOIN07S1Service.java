package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.IWONCOIN07S1Mapper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@Service
public class IWONCOIN07S1Service {

    private final IWONCOIN07S1Mapper mapper;
    private final IWONCOIN05S1Service approvalService;

    public IWONCOIN07S1Service(IWONCOIN07S1Mapper mapper, IWONCOIN05S1Service approvalService) {
        this.mapper = mapper;
        this.approvalService = approvalService;
    }

    public Map<String, Object> listJournals(
            String periodType,
            int year,
            Integer month,
            Integer quarter,
            Integer half,
            String coinType,
            String status,
            int page,
            int size) {
        PeriodRange r = computeRange(periodType, year, month, quarter, half);
        if (!r.ok()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "INVALID_PERIOD",
                    "message", r.message);
        }

        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 1000));
        int offset = (safePage - 1) * safeSize;

        Map<String, Object> p = new HashMap<>();
        p.put("fromDate", r.from.toString());
        p.put("toDate", r.to.toString());
        p.put("coinType", normalizeOpt(coinType));
        p.put("status", normalizeOpt(status));
        p.put("size", safeSize);
        p.put("offset", offset);

        List<Map<String, Object>> rows = mapper.selectFinancialClosingApprovals(p);
        int total = mapper.countFinancialClosingApprovals(p);

        Map<String, Object> agg = mapper.selectFinancialClosingAggregate(p);
        long mintCount = toLong(agg == null ? null : agg.get("mintCount"));
        long burnCount = toLong(agg == null ? null : agg.get("burnCount"));
        long mintAmount = toLong(agg == null ? null : agg.get("mintAmount"));
        long burnAmount = toLong(agg == null ? null : agg.get("burnAmount"));
        long netAmount = mintAmount - burnAmount;

        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> row : (rows == null ? List.<Map<String, Object>>of() : rows)) {
            Map<String, Object> item = new LinkedHashMap<>();
            String type = toStr(row.get("type"));
            String eventType = type == null ? null : type.toLowerCase();

            item.put("approvalId", row.get("approvalId"));
            item.put("requestedAt", row.get("requestedAt"));
            item.put("coinType", row.get("coinType"));
            item.put("eventType", eventType);
            item.put("amount", row.get("amount"));
            item.put("status", row.get("status"));
            if (row.get("title") != null)
                item.put("title", row.get("title"));

            // MVP: 미리보기는 2줄(차/대) 고정으로 제공
            List<Map<String, Object>> previewLines = buildJournalLines(eventType, toStr(row.get("coinType")),
                    toLong(row.get("amount")));
            item.put("previewLines", previewLines);
            item.put("previewLineCount", previewLines.size());

            items.add(item);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("mintCount", mintCount);
        summary.put("burnCount", burnCount);
        summary.put("mintAmount", mintAmount);
        summary.put("burnAmount", burnAmount);
        summary.put("netAmount", netAmount);
        summary.put("journalLineCount", (mintCount + burnCount) * 2);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("summary", summary);
        out.put("items", items);
        out.put("total", total);
        return out;
    }

    public List<Map<String, Object>> listJournalsForExport(
            String periodType,
            int year,
            Integer month,
            Integer quarter,
            Integer half,
            String coinType,
            String status) {
        PeriodRange r = computeRange(periodType, year, month, quarter, half);
        if (!r.ok())
            return List.of();

        Map<String, Object> p = new HashMap<>();
        p.put("fromDate", r.from.toString());
        p.put("toDate", r.to.toString());
        p.put("coinType", normalizeOpt(coinType));
        p.put("status", normalizeOpt(status));

        List<Map<String, Object>> rows = mapper.selectFinancialClosingApprovalsForExport(p);
        return rows == null ? List.of() : rows;
    }

    public Map<String, Object> getJournalDetail(String approvalId) {
        if (approvalId == null || approvalId.isBlank()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "APPROVAL_ID_REQUIRED",
                    "message", "approvalId is required");
        }

        Map<String, Object> source = approvalService.getDetail(approvalId);
        if (source == null) {
            return Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", "NOT_FOUND",
                    "message", "approval not found");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> approval = (source.get("approval") instanceof Map)
                ? (Map<String, Object>) source.get("approval")
                : null;
        String type = approval == null ? null : toStr(approval.get("type"));
        String eventType = type == null ? null : type.toLowerCase();
        if (!"mint".equals(eventType) && !"burn".equals(eventType)) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "UNSUPPORTED_EVENT_TYPE",
                    "message", "approval type must be mint|burn for financial closing");
        }

        String coinType = approval == null ? null : toStr(approval.get("coinType"));
        long amount = approval == null ? 0L : toLong(approval.get("amount"));
        List<Map<String, Object>> lines = buildJournalLines(eventType, coinType, amount);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("source", source);
        out.put("journalLines", lines);
        return out;
    }

    public Map<String, Object> getReport(
            String periodType,
            int year,
            Integer month,
            Integer quarter,
            Integer half,
            String coinType) {
        PeriodRange r = computeRange(periodType, year, month, quarter, half);
        if (!r.ok()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "INVALID_PERIOD",
                    "message", r.message);
        }

        Map<String, Object> p = new HashMap<>();
        p.put("fromDate", r.from.toString());
        p.put("toDate", r.to.toString());
        p.put("coinType", normalizeOpt(coinType));

        Map<String, Object> agg = mapper.selectFinancialClosingAggregate(p);
        long mintCount = toLong(agg == null ? null : agg.get("mintCount"));
        long burnCount = toLong(agg == null ? null : agg.get("burnCount"));
        long mintAmount = toLong(agg == null ? null : agg.get("mintAmount"));
        long burnAmount = toLong(agg == null ? null : agg.get("burnAmount"));
        long netAmount = mintAmount - burnAmount;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mintCount", mintCount);
        out.put("burnCount", burnCount);
        out.put("mintAmount", mintAmount);
        out.put("burnAmount", burnAmount);
        out.put("netAmount", netAmount);

        // 준비금/발행부채 스냅샷은 SSOT에서 TBD이므로 null 유지(확정 시 mapper 추가)
        out.put("reserveBeginning", null);
        out.put("reserveChange", null);
        out.put("reserveEnding", null);
        out.put("liabilityBeginning", null);
        out.put("liabilityChange", null);
        out.put("liabilityEnding", null);

        return out;
    }

    public byte[] toJournalCsvBytes(List<Map<String, Object>> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("approvalId,requestedAt,coinType,eventType,amount,status,title,debitAccount,creditAccount\n");

        for (Map<String, Object> r : (items == null ? List.<Map<String, Object>>of() : items)) {
            String type = toStr(r.get("type"));
            String eventType = type == null ? "" : type.toLowerCase();
            String ct = toStr(r.get("coinType"));
            long amount = toLong(r.get("amount"));
            List<Map<String, Object>> lines = buildJournalLines(eventType, ct, amount);

            String debitAccount = lines.stream().filter(m -> "debit".equals(m.get("side")))
                    .map(m -> String.valueOf(m.get("accountName"))).findFirst().orElse("");
            String creditAccount = lines.stream().filter(m -> "credit".equals(m.get("side")))
                    .map(m -> String.valueOf(m.get("accountName"))).findFirst().orElse("");

            sb.append(csvCell(r.get("approvalId"))).append(',');
            sb.append(csvCell(r.get("requestedAt"))).append(',');
            sb.append(csvCell(r.get("coinType"))).append(',');
            sb.append(csvCell(eventType)).append(',');
            sb.append(csvCell(r.get("amount"))).append(',');
            sb.append(csvCell(r.get("status"))).append(',');
            sb.append(csvCell(r.get("title"))).append(',');
            sb.append(csvCell(debitAccount)).append(',');
            sb.append(csvCell(creditAccount)).append('\n');
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] toReportCsvBytes(Map<String, Object> report) {
        Map<String, Object> r = report == null ? Map.of() : report;
        StringBuilder sb = new StringBuilder();
        sb.append(
                "mintCount,burnCount,mintAmount,burnAmount,netAmount,reserveBeginning,reserveChange,reserveEnding,liabilityBeginning,liabilityChange,liabilityEnding\n");
        sb.append(csvCell(r.get("mintCount"))).append(',');
        sb.append(csvCell(r.get("burnCount"))).append(',');
        sb.append(csvCell(r.get("mintAmount"))).append(',');
        sb.append(csvCell(r.get("burnAmount"))).append(',');
        sb.append(csvCell(r.get("netAmount"))).append(',');
        sb.append(csvCell(r.get("reserveBeginning"))).append(',');
        sb.append(csvCell(r.get("reserveChange"))).append(',');
        sb.append(csvCell(r.get("reserveEnding"))).append(',');
        sb.append(csvCell(r.get("liabilityBeginning"))).append(',');
        sb.append(csvCell(r.get("liabilityChange"))).append(',');
        sb.append(csvCell(r.get("liabilityEnding"))).append('\n');
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static List<Map<String, Object>> buildJournalLines(String eventType, String coinType, long amount) {
        String ct = (coinType == null) ? "" : coinType.trim().toLowerCase();
        String debit;
        String credit;

        // NOTE: 계정 매핑은 정책 확정 시 SSOT로 고정 필요. MVP는 표시용 계정명만 제공합니다.
        boolean welfare = "welfare".equals(ct);

        if ("mint".equals(eventType)) {
            debit = welfare ? "복리후생비" : "급여";
            credit = "발행부채";
        } else if ("burn".equals(eventType)) {
            debit = "발행부채";
            credit = welfare ? "복리후생비 환입" : "급여 환입";
        } else {
            debit = "";
            credit = "";
        }

        List<Map<String, Object>> lines = new ArrayList<>();
        if (!debit.isBlank()) {
            lines.add(Map.of(
                    "side", "debit",
                    "accountName", debit,
                    "amount", amount));
        }
        if (!credit.isBlank()) {
            lines.add(Map.of(
                    "side", "credit",
                    "accountName", credit,
                    "amount", amount));
        }
        return lines;
    }

    private static String normalizeOpt(String s) {
        if (s == null)
            return null;
        String v = s.trim();
        return v.isBlank() ? null : v;
    }

    private static Long toLong(Object v) {
        if (v == null)
            return 0L;
        if (v instanceof Number n)
            return n.longValue();
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (Exception e) {
            return 0L;
        }
    }

    private static String toStr(Object v) {
        if (v == null)
            return null;
        String s = String.valueOf(v);
        return s.isBlank() ? null : s;
    }

    private static String csvCell(Object v) {
        if (v == null)
            return "";
        String s = String.valueOf(v);
        boolean needsQuote = s.contains(",") || s.contains("\n") || s.contains("\r") || s.contains("\"");
        if (!needsQuote)
            return s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    private static PeriodRange computeRange(String periodTypeRaw, int year, Integer month, Integer quarter,
            Integer half) {
        if (year < 1900 || year > 3000) {
            return PeriodRange.invalid("year out of range");
        }

        String periodType = (periodTypeRaw == null || periodTypeRaw.isBlank()) ? "month"
                : periodTypeRaw.trim()
                        .toLowerCase();

        try {
            if ("month".equals(periodType)) {
                if (month == null || month < 1 || month > 12)
                    return PeriodRange.invalid("month is required (1-12)");
                LocalDate from = LocalDate.of(year, month, 1);
                LocalDate to = from.plusMonths(1).minusDays(1);
                return PeriodRange.ok(from, to);
            }

            if ("quarter".equals(periodType)) {
                if (quarter == null || quarter < 1 || quarter > 4)
                    return PeriodRange.invalid("quarter is required (1-4)");
                int startMonth = (quarter - 1) * 3 + 1;
                LocalDate from = LocalDate.of(year, startMonth, 1);
                LocalDate to = from.plusMonths(3).minusDays(1);
                return PeriodRange.ok(from, to);
            }

            if ("half".equals(periodType)) {
                if (half == null || half < 1 || half > 2)
                    return PeriodRange.invalid("half is required (1-2)");
                int startMonth = (half == 1) ? 1 : 7;
                LocalDate from = LocalDate.of(year, startMonth, 1);
                LocalDate to = from.plusMonths(6).minusDays(1);
                return PeriodRange.ok(from, to);
            }

            if ("year".equals(periodType)) {
                LocalDate from = LocalDate.of(year, 1, 1);
                LocalDate to = LocalDate.of(year, 12, 31);
                return PeriodRange.ok(from, to);
            }

            return PeriodRange.invalid("unknown periodType");
        } catch (Exception e) {
            return PeriodRange.invalid("failed to compute period range");
        }
    }

    private record PeriodRange(boolean valid, LocalDate from, LocalDate to, String message) {
        static PeriodRange ok(LocalDate from, LocalDate to) {
            return new PeriodRange(true, from, to, null);
        }

        static PeriodRange invalid(String message) {
            return new PeriodRange(false, null, null, message);
        }

        boolean ok() {
            return valid;
        }
    }
}
