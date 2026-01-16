package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.IWONCOIN06S1Mapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class IWONCOIN06S1Service {

    private final IWONCOIN06S1Mapper mapper;

    public IWONCOIN06S1Service(IWONCOIN06S1Mapper mapper) {
        this.mapper = mapper;
    }

    public List<Map<String, Object>> list(
            Integer year,
            Integer month,
            String coinType,
            String status,
            String department,
            String name,
            String keyword,
            int page,
            int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 1000));
        int offset = (safePage - 1) * safeSize;

        Map<String, Object> p = new HashMap<>();
        p.put("year", year);
        p.put("month", month);
        p.put("coinType", coinType);
        p.put("status", status);
        p.put("department", department);
        p.put("name", name);
        p.put("keyword", keyword);
        p.put("size", safeSize);
        p.put("offset", offset);

        return mapper.selectMonthlyPayees(p);
    }

    public int count(
            Integer year,
            Integer month,
            String coinType,
            String status,
            String department,
            String name,
            String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("year", year);
        p.put("month", month);
        p.put("coinType", coinType);
        p.put("status", status);
        p.put("department", department);
        p.put("name", name);
        p.put("keyword", keyword);
        return mapper.countMonthlyPayees(p);
    }

    @Transactional
    public Map<String, Object> upsert(String pathId, Map<String, Object> body) {
        Integer year = toInt(body.get("year"));
        Integer month = toInt(body.get("month"));
        String employeeId = toStr(body.get("employeeId"));
        String coinType = toStr(body.get("coinType"));
        Long amount = toLong(body.get("amount"));
        String reason = body.get("reason") == null ? null : String.valueOf(body.get("reason"));

        if (year == null || month == null || employeeId == null || employeeId.isBlank() || coinType == null
                || coinType.isBlank()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "REQUIRED_FIELD_MISSING",
                    "message", "year, month, employeeId, coinType are required");
        }

        long safeAmount = amount == null ? 0L : amount;

        // 중복 방지: 동일 (year,month,employeeId,coinType) 존재 시 해당 id로 업데이트
        String existingByKey = mapper.findMonthlyPayeeIdByKey(year, month, employeeId, coinType);

        String resolvedId = normalizeId(pathId);
        if (existingByKey != null && !existingByKey.isBlank()) {
            resolvedId = existingByKey;
        }
        if (resolvedId == null) {
            resolvedId = UUID.randomUUID().toString();
        }

        String empName = mapper.selectEmployeeName(employeeId);
        String storedName = (empName == null || empName.isBlank()) ? "" : empName;

        Map<String, Object> p = new HashMap<>();
        p.put("id", resolvedId);
        p.put("year", year);
        p.put("month", month);
        p.put("employeeId", employeeId);
        p.put("name", storedName);
        p.put("coinType", coinType);
        p.put("amount", safeAmount);
        p.put("reason", reason);
        p.put("status", "scheduled");
        p.put("createdBy", "admin");

        boolean exists = (mapper.existsMonthlyPayee(resolvedId) != null);
        if (exists) {
            mapper.updateMonthlyPayee(p);
        } else {
            mapper.insertMonthlyPayee(p);
        }

        Map<String, Object> out = mapper.selectMonthlyPayeeById(resolvedId);
        if (out == null) {
            // 방어적 fallback
            out = new LinkedHashMap<>();
            out.put("id", resolvedId);
            out.put("year", year);
            out.put("month", month);
            out.put("employeeId", employeeId);
            out.put("name", storedName);
            out.put("coinType", coinType);
            out.put("amount", safeAmount);
            out.put("reason", reason);
            out.put("status", "scheduled");
            out.put("createdBy", "admin");
            out.put("createdAt", OffsetDateTime.now().toString());
        }
        return out;
    }

    @Transactional
    public Map<String, Object> deleteOne(String id) {
        if (id == null || id.isBlank()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "ID_REQUIRED",
                    "message", "id is required");
        }

        int deleted = mapper.deleteMonthlyPayee(id);
        if (deleted == 0) {
            return Map.of(
                    "success", false,
                    "errorType", "BIZ",
                    "code", "NOT_FOUND",
                    "message", "monthly payee not found");
        }

        return Map.of("deletedId", id);
    }

    @Transactional
    public Map<String, Object> bulkDelete(List<String> ids) {
        List<String> safe = (ids == null) ? List.of()
                : ids.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isBlank()).toList();
        if (safe.isEmpty()) {
            return Map.of(
                    "success", false,
                    "errorType", "VALIDATION",
                    "code", "IDS_REQUIRED",
                    "message", "ids is required");
        }

        int deleted = mapper.bulkDeleteMonthlyPayees(safe);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("deletedCount", deleted);
        out.put("deletedIds", safe);
        return out;
    }

    @Transactional
    public Map<String, Object> confirm(int year, int month) {
        List<String> coinTypes = mapper.selectDistinctCoinTypes(year, month);
        if (coinTypes == null || coinTypes.isEmpty()) {
            // SSOT 경로에는 coinType이 없고, 데이터가 없을 수도 있으니 기본값으로 계획만 생성
            coinTypes = List.of("welfare");
        }

        String confirmedBy = "admin";
        for (String ct : coinTypes) {
            String coinType = (ct == null || ct.isBlank()) ? "welfare" : ct;

            String planId = mapper.selectMonthlyPlanId(year, month, coinType);
            if (planId == null || planId.isBlank()) {
                String newId = UUID.randomUUID().toString();
                Map<String, Object> p = new HashMap<>();
                p.put("id", newId);
                p.put("year", year);
                p.put("month", month);
                p.put("coinType", coinType);
                p.put("status", "draft");
                mapper.insertMonthlyPlan(p);
                planId = newId;
            }

            Map<String, Object> u = new HashMap<>();
            u.put("id", planId);
            u.put("confirmedBy", confirmedBy);
            mapper.updateMonthlyPlanConfirmed(u);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("year", year);
        out.put("month", month);
        out.put("status", "confirmed");
        out.put("confirmedAt", OffsetDateTime.now().toString());
        return out;
    }

    public List<Map<String, Object>> listForExport(
            int year,
            int month,
            String coinType,
            String status,
            String department,
            String name,
            String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("year", year);
        p.put("month", month);
        p.put("coinType", coinType);
        p.put("status", status);
        p.put("department", department);
        p.put("name", name);
        p.put("keyword", keyword);
        return mapper.selectMonthlyPayeesForExport(p);
    }

    public byte[] toCsvBytes(List<Map<String, Object>> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("year,month,employeeId,name,coinType,amount,reason,status\n");
        for (Map<String, Object> r : (items == null ? List.<Map<String, Object>>of() : items)) {
            sb.append(csvCell(r.get("year"))).append(',');
            sb.append(csvCell(r.get("month"))).append(',');
            sb.append(csvCell(r.get("employeeId"))).append(',');
            sb.append(csvCell(r.get("name"))).append(',');
            sb.append(csvCell(r.get("coinType"))).append(',');
            sb.append(csvCell(r.get("amount"))).append(',');
            sb.append(csvCell(r.get("reason"))).append(',');
            sb.append(csvCell(r.get("status"))).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
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

    private static String normalizeId(String id) {
        if (id == null)
            return null;
        String s = id.trim();
        if (s.isEmpty())
            return null;
        if ("new".equalsIgnoreCase(s) || "create".equalsIgnoreCase(s) || "0".equals(s))
            return null;
        return s;
    }

    private static Integer toInt(Object v) {
        if (v == null)
            return null;
        if (v instanceof Number n)
            return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }

    private static Long toLong(Object v) {
        if (v == null)
            return null;
        if (v instanceof Number n)
            return n.longValue();
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }

    private static String toStr(Object v) {
        if (v == null)
            return null;
        return String.valueOf(v);
    }
}
