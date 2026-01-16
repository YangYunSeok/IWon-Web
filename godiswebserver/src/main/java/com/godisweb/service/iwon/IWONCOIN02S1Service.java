package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.IWONCOIN02S1Mapper;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IWONCOIN02S1Service {

    private final IWONCOIN02S1Mapper mapper;
    private final EmployeeWalletProvisioningClient provisioningClient;

    public IWONCOIN02S1Service(IWONCOIN02S1Mapper mapper, EmployeeWalletProvisioningClient provisioningClient) {
        this.mapper = mapper;
        this.provisioningClient = provisioningClient;
    }

    public List<Map<String, Object>> getEmployees(
            String keyword,
            String name,
            String department,
            String walletStatus,
            String employmentStatus,
            Boolean onlyUncreated,
            Integer offset,
            Integer limit) {
        Map<String, Object> params = new HashMap<>();
        params.put("keyword", keyword);
        params.put("name", name);
        params.put("department", department);
        params.put("walletStatus", walletStatus);
        params.put("employmentStatus", employmentStatus);
        params.put("onlyUncreated", onlyUncreated);
        params.put("offset", offset);
        params.put("limit", limit);

        return mapper.selectEmployees(params);
    }

    public Map<String, Object> createWallets(List<String> employeeIds) {
        List<Map<String, Object>> results = new ArrayList<>();
        List<String> failedEmployeeIds = new ArrayList<>();

        int created = 0;
        int skipped = 0;
        int failed = 0;

        for (String employeeId : employeeIds) {
            try {
                String existing = mapper.selectWalletAddress(employeeId);
                if (existing != null && !existing.isBlank()) {
                    skipped++;
                    results.add(Map.of(
                            "employeeId", employeeId,
                            "status", "skipped",
                            "walletAddress", existing));
                    continue;
                }

                // 지갑 생성은 스마트 컨트랙트(또는 지갑 발급 API) 호출로 수행
                String walletAddress = provisioningClient.provisionWalletAddress(employeeId);
                int updated = mapper.createWalletIfMissing(employeeId, walletAddress);

                if (updated > 0) {
                    created++;
                    results.add(Map.of(
                            "employeeId", employeeId,
                            "status", "created",
                            "walletAddress", walletAddress));
                } else {
                    skipped++;
                    results.add(Map.of(
                            "employeeId", employeeId,
                            "status", "skipped"));
                }
            } catch (Exception ex) {
                failed++;
                failedEmployeeIds.add(employeeId);
                results.add(Map.of(
                        "employeeId", employeeId,
                        "status", "failed",
                        "message", ex.getMessage() == null ? "error" : ex.getMessage()));
            }
        }

        // Frontend(godiswebfront/src/screens/IWon/IWONCOIN02S1.jsx) 기대 응답 키에 맞춤
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("ok", failed == 0);
        response.put("requestedCount", employeeIds.size());
        response.put("createdCount", created);
        response.put("failedEmployeeIds", failedEmployeeIds);

        // 디버그/운영 모니터링에 유용한 상세 결과도 함께 제공(프론트에서 무시 가능)
        response.put("details", results);
        response.put("skippedCount", skipped);
        response.put("failedCount", failed);
        return response;
    }
}
