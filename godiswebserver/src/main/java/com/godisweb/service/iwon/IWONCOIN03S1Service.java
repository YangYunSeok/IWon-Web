package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.IWONCOIN03S1Mapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IWONCOIN03S1Service {

    private final IWONCOIN03S1Mapper mapper;
    private final IWONCOIN05S1Service approvalService;

    public IWONCOIN03S1Service(IWONCOIN03S1Mapper mapper, IWONCOIN05S1Service approvalService) {
        this.mapper = mapper;
        this.approvalService = approvalService;
    }

    public Map<String, Object> createMintRequest(List<String> employeeIds, String coinType, long amountPerPerson,
            String reason) {
        // NOTE: approvals/approval_targets 테이블 스키마가 서버 측에 확정/반영되어 있지 않아
        // 현재는 SSOT 계약(ApprovalRequest) 기반으로 “요청 생성 결과”만 반환하는 초안입니다.
        // (추후 approvals INSERT + targets INSERT로 확장)

        List<Map<String, Object>> walletRows = mapper.selectWalletRowsByEmployeeIds(employeeIds);
        Set<String> foundEmployees = new HashSet<>();
        List<String> missingWalletEmployees = new ArrayList<>();

        for (Map<String, Object> r : walletRows) {
            String employeeId = String.valueOf(r.get("employeeId"));
            foundEmployees.add(employeeId);
            String walletAddress = r.get("walletAddress") == null ? "" : String.valueOf(r.get("walletAddress")).trim();
            if (walletAddress.isEmpty())
                missingWalletEmployees.add(employeeId);
        }

        // 조회 자체가 안 된 사번도 누락으로 취급
        for (String employeeId : employeeIds) {
            if (!foundEmployees.contains(employeeId)) {
                missingWalletEmployees.add(employeeId);
            }
        }

        if (!missingWalletEmployees.isEmpty()) {
            return Map.of(
                    "ok", false,
                    "code", "WALLET_UNCREATED",
                    "message", "wallet is uncreated for some employees",
                    "missingEmployeeIds", missingWalletEmployees);
        }

        long totalAmount = amountPerPerson * (long) employeeIds.size();
        String subjectName = employeeIds.size() == 1 ? employeeIds.get(0) : (employeeIds.size() + " employees");
        return approvalService.createMintApproval(
                "admin",
                subjectName,
                coinType,
                totalAmount,
                amountPerPerson,
                employeeIds,
                (reason != null && !reason.isBlank()) ? reason : null);
    }

    public Map<String, Object> createBurnRequest(List<String> employeeIds, String coinType, long amountPerPerson,
            String reason) {
        List<Map<String, Object>> walletRows = mapper.selectWalletRowsByEmployeeIds(employeeIds);
        Set<String> foundEmployees = new HashSet<>();
        List<String> missingWalletEmployees = new ArrayList<>();
        List<String> insufficientEmployees = new ArrayList<>();

        for (Map<String, Object> r : walletRows) {
            String employeeId = String.valueOf(r.get("employeeId"));
            foundEmployees.add(employeeId);
            String walletAddress = r.get("walletAddress") == null ? "" : String.valueOf(r.get("walletAddress")).trim();
            long balance = 0L;
            Object balObj = r.get("balance");
            if (balObj instanceof Number)
                balance = ((Number) balObj).longValue();
            else if (balObj != null) {
                try {
                    balance = Long.parseLong(String.valueOf(balObj));
                } catch (Exception ignore) {
                }
            }

            if (walletAddress.isEmpty())
                missingWalletEmployees.add(employeeId);
            else if (balance < amountPerPerson)
                insufficientEmployees.add(employeeId);
        }

        for (String employeeId : employeeIds) {
            if (!foundEmployees.contains(employeeId)) {
                missingWalletEmployees.add(employeeId);
            }
        }

        if (!missingWalletEmployees.isEmpty()) {
            return Map.of(
                    "ok", false,
                    "code", "WALLET_UNCREATED",
                    "message", "wallet is uncreated for some employees",
                    "missingEmployeeIds", missingWalletEmployees);
        }
        if (!insufficientEmployees.isEmpty()) {
            return Map.of(
                    "ok", false,
                    "code", "INSUFFICIENT_BALANCE",
                    "message", "insufficient balance for some employees",
                    "insufficientEmployeeIds", insufficientEmployees);
        }

        long totalAmount = amountPerPerson * (long) employeeIds.size();
        String subjectName = employeeIds.size() == 1 ? employeeIds.get(0) : (employeeIds.size() + " employees");
        return approvalService.createBurnApproval(
                "admin",
                subjectName,
                coinType,
                totalAmount,
                amountPerPerson,
                employeeIds,
                (reason != null && !reason.isBlank()) ? reason : null);
    }
}
