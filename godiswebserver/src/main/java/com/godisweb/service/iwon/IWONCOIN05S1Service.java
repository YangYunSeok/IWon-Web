package com.godisweb.service.iwon;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.godisweb.mapper.iwon.CoinMapper;
import com.godisweb.mapper.iwon.IWONCOIN05S1Mapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class IWONCOIN05S1Service {

    private final IWONCOIN05S1Mapper mapper;
    private final CoinMapper coinMapper;
    private final ObjectMapper objectMapper;

    public IWONCOIN05S1Service(IWONCOIN05S1Mapper mapper, CoinMapper coinMapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.coinMapper = coinMapper;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> createMintApproval(
            String requesterName,
            String subjectName,
            String coinType,
            long totalAmount,
            Long amountPerPerson,
            List<String> employeeIds,
            String title) {
        return createApproval("mint", requesterName, subjectName, coinType, totalAmount, amountPerPerson, employeeIds,
                title);
    }

    public Map<String, Object> createBurnApproval(
            String requesterName,
            String subjectName,
            String coinType,
            long totalAmount,
            Long amountPerPerson,
            List<String> employeeIds,
            String title) {
        return createApproval("burn", requesterName, subjectName, coinType, totalAmount, amountPerPerson, employeeIds,
                title);
    }

    @Transactional
    public Map<String, Object> createApproval(
            String type,
            String requesterName,
            String subjectName,
            String coinType,
            long totalAmount,
            Long amountPerPerson,
            List<String> employeeIds,
            String title) {
        String approvalId = UUID.randomUUID().toString();

        Map<String, Object> mintBurn = new LinkedHashMap<>();
        mintBurn.put("coinType", coinType);
        mintBurn.put("totalAmount", totalAmount);
        if (amountPerPerson != null)
            mintBurn.put("amountPerPerson", amountPerPerson);
        if (employeeIds != null)
            mintBurn.put("employeeIds", employeeIds);
        if (title != null && !title.isBlank())
            mintBurn.put("reason", title);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("mintBurn", mintBurn);

        String requestPayload;
        try {
            requestPayload = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            requestPayload = "{}";
        }

        Map<String, Object> approvalRow = new HashMap<>();
        approvalRow.put("id", approvalId);
        approvalRow.put("type", type);
        approvalRow.put("requesterType", "admin");
        approvalRow.put("requesterId", null);
        approvalRow.put("requesterName", requesterName);
        approvalRow.put("subjectName", subjectName);
        approvalRow.put("requestPayload", requestPayload);
        approvalRow.put("amount", totalAmount);
        approvalRow.put("coinType", coinType);
        approvalRow.put("status", "pending");
        approvalRow.put("approverId", null);
        approvalRow.put("decidedAt", null);
        approvalRow.put("executedAt", null);
        approvalRow.put("reason", title);

        mapper.insertApproval(approvalRow);

        if (employeeIds != null && !employeeIds.isEmpty()) {
            List<Map<String, Object>> targets = new ArrayList<>();
            for (String employeeId : employeeIds) {
                Map<String, Object> t = new HashMap<>();
                t.put("id", UUID.randomUUID().toString());
                t.put("approvalId", approvalId);
                t.put("employeeId", employeeId);
                t.put("walletId", null); // wallet_id 컬럼 NULL 허용
                t.put("amount", amountPerPerson == null ? 0L : amountPerPerson);
                t.put("note", title);
                targets.add(t);
            }
            mapper.insertApprovalTargets(targets);
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("approvalId", approvalId);
        res.put("type", type);
        res.put("requesterType", "admin");
        res.put("requesterName", requesterName);
        res.put("subjectName", subjectName);
        res.put("amount", totalAmount);
        res.put("status", "pending");
        res.put("requestedAt", OffsetDateTime.now().toString());
        res.put("coinType", coinType);
        if (title != null && !title.isBlank())
            res.put("title", title);
        return res;
    }

    public List<Map<String, Object>> list(String status, String keyword, int page, int size) {
        String normalizedStatus = (status == null || status.isBlank()) ? "pending" : status.trim();
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 200));
        int offset = (safePage - 1) * safeSize;

        Map<String, Object> params = new HashMap<>();
        params.put("status", normalizedStatus);
        params.put("keyword", keyword);
        params.put("size", safeSize);
        params.put("offset", offset);
        return mapper.selectApprovals(params);
    }

    public int count(String status, String keyword) {
        String normalizedStatus = (status == null || status.isBlank()) ? "pending" : status.trim();
        Map<String, Object> params = new HashMap<>();
        params.put("status", normalizedStatus);
        params.put("keyword", keyword);
        return mapper.countApprovals(params);
    }

    public Map<String, Object> getDetail(String approvalId) {
        Map<String, Object> approval = mapper.selectApprovalById(approvalId);
        if (approval == null)
            return null;

        List<Map<String, Object>> targets = mapper.selectApprovalTargetsByApprovalId(approvalId);

        Map<String, Object> mintBurn = new LinkedHashMap<>();
        Object payloadRaw = approval.get("requestPayload");
        if (payloadRaw != null) {
            try {
                Map<String, Object> payload = objectMapper.readValue(
                        String.valueOf(payloadRaw),
                        new TypeReference<Map<String, Object>>() {
                        });
                Object mb = payload.get("mintBurn");
                if (mb instanceof Map<?, ?> mbMap) {
                    for (Map.Entry<?, ?> e : mbMap.entrySet()) {
                        if (e.getKey() == null)
                            continue;
                        mintBurn.put(String.valueOf(e.getKey()), e.getValue());
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (!targets.isEmpty())
            mintBurn.put("targets", targets);

        List<Map<String, Object>> timeline = new ArrayList<>();
        String requestedAt = approval.get("requestedAt") == null ? null : String.valueOf(approval.get("requestedAt"));
        if (requestedAt != null && !requestedAt.isBlank()) {
            timeline.add(Map.of("status", "pending", "at", requestedAt, "by",
                    approval.getOrDefault("requesterName", "admin")));
        }
        String status = String.valueOf(approval.getOrDefault("status", "pending"));
        if ("approved".equalsIgnoreCase(status)) {
            String decidedAt = approval.get("decidedAt") == null ? null : String.valueOf(approval.get("decidedAt"));
            timeline.add(Map.of("status", "approved", "at",
                    decidedAt == null ? OffsetDateTime.now().toString() : decidedAt, "by", "approver"));
        }
        if ("rejected".equalsIgnoreCase(status)) {
            String decidedAt = approval.get("decidedAt") == null ? null : String.valueOf(approval.get("decidedAt"));
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("status", "rejected");
            ev.put("at", decidedAt == null ? OffsetDateTime.now().toString() : decidedAt);
            ev.put("by", "approver");
            if (approval.get("reason") != null)
                ev.put("reason", String.valueOf(approval.get("reason")));
            timeline.add(ev);
        }

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("approval", normalizeApprovalForResponse(approval));
        detail.put("timeline", timeline);
        detail.put("mintBurn", mintBurn);
        return detail;
    }

    private Map<String, Object> normalizeApprovalForResponse(Map<String, Object> approval) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("approvalId", approval.get("approvalId"));
        out.put("type", approval.get("type"));
        out.put("requesterType", approval.get("requesterType"));
        out.put("requesterName", approval.get("requesterName"));
        out.put("subjectName", approval.get("subjectName"));
        out.put("amount", approval.get("amount"));
        out.put("coinType", approval.get("coinType"));
        out.put("status", approval.get("status"));
        out.put("requestedAt", approval.get("requestedAt"));
        out.put("decidedAt", approval.get("decidedAt"));
        out.put("executedAt", approval.get("executedAt"));
        if (approval.get("reason") != null)
            out.put("title", approval.get("reason"));
        return out;
    }

    @Transactional
    public Map<String, Object> confirm(String approvalId, String approverIdOrNull) {
        Map<String, Object> existing = mapper.selectApprovalById(approvalId);
        if (existing == null)
            return null;

        String approvalType = String.valueOf(existing.getOrDefault("type", ""));
        boolean isMint = "mint".equalsIgnoreCase(approvalType);
        boolean isBurn = "burn".equalsIgnoreCase(approvalType);
        if (!isMint && !isBurn) {
            return Map.of("error", "UNSUPPORTED_APPROVAL_TYPE");
        }

        Map<String, Object> params = new HashMap<>();
        params.put("approvalId", approvalId);
        params.put("status", "approved");
        params.put("approverId", approverIdOrNull);
        params.put("executedAtNow", true);
        params.put("reason", null);
        int updated = mapper.updateApprovalStatus(params);
        if (updated == 0)
            return Map.of("error", "APPROVAL_ALREADY_PROCESSED");

        List<Map<String, Object>> targets = mapper.selectApprovalTargetsByApprovalId(approvalId);
        for (Map<String, Object> t : targets) {
            String employeeId = t.get("employeeId") == null ? null : String.valueOf(t.get("employeeId"));
            if (employeeId == null || employeeId.isBlank())
                continue;

            long amount = 0L;
            Object amtRaw = t.get("amount");
            if (amtRaw instanceof Number n) {
                amount = n.longValue();
            } else if (amtRaw != null) {
                try {
                    amount = Long.parseLong(String.valueOf(amtRaw));
                } catch (Exception ignored) {
                }
            }

            long delta = isMint ? amount : -amount;
            Map<String, Object> updateParam = new HashMap<>();
            updateParam.put("rcvEmpNo", employeeId);
            updateParam.put("amount", delta);
            coinMapper.updateEmpBalance(updateParam);
        }

        Map<String, Object> approval = mapper.selectApprovalById(approvalId);
        String now = OffsetDateTime.now().toString();
        Map<String, Object> tx = new LinkedHashMap<>();
        tx.put("txId", UUID.randomUUID().toString());
        tx.put("type", approval == null ? "mint" : approval.getOrDefault("type", "mint"));
        tx.put("coinType", approval == null ? null : approval.get("coinType"));
        tx.put("amount", approval == null ? null : approval.get("amount"));
        tx.put("status", "success");
        tx.put("createdAt", now);
        return tx;
    }

    @Transactional
    public Map<String, Object> reject(String approvalId, String approverIdOrNull, String reason) {
        Map<String, Object> existing = mapper.selectApprovalById(approvalId);
        if (existing == null)
            return null;

        Map<String, Object> params = new HashMap<>();
        params.put("approvalId", approvalId);
        params.put("status", "rejected");
        params.put("approverId", approverIdOrNull);
        params.put("executedAtNow", false);
        params.put("reason", reason);
        int updated = mapper.updateApprovalStatus(params);
        if (updated == 0)
            return Map.of("error", "APPROVAL_ALREADY_PROCESSED");
        return getDetail(approvalId);
    }
}
