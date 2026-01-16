package com.godisweb.service.iwon;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 스마트 컨트랙트(또는 지갑 발급 전용) API를 호출해 직원 지갑을 발급/조회합니다.
 *
 * NOTE: "지갑 생성"은 프론트에서 구현하지 않고, 서버가 외부(SC API) 호출로 수행합니다.
 *
 * 설정값:
 * - iwon.wallet.provisioning.base-url (필수)
 * - iwon.wallet.provisioning.create-path (선택, 기본: /wallets/create)
 */
@Service
public class EmployeeWalletProvisioningClient {

    private final RestTemplate restTemplate;

    private final String baseUrl;
    private final String createPath;

    public EmployeeWalletProvisioningClient(
            @Value("${iwon.wallet.provisioning.base-url:}") String baseUrl,
            @Value("${iwon.wallet.provisioning.create-path:/wallets/create}") String createPath) {
        this.restTemplate = new RestTemplate();
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
        this.createPath = createPath == null ? "/wallets/create" : createPath.trim();
    }

    /**
     * @return walletAddress (0x...)
     */
    public String provisionWalletAddress(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) {
            throw new IllegalArgumentException("employeeId is required");
        }
        if (baseUrl.isBlank()) {
            throw new IllegalStateException("SMART_CONTRACT_API_NOT_CONFIGURED: iwon.wallet.provisioning.base-url");
        }

        String url = baseUrl.endsWith("/")
                ? baseUrl.substring(0, baseUrl.length() - 1) + normalizePath(createPath)
                : baseUrl + normalizePath(createPath);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("employeeId", employeeId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> res = restTemplate.exchange(url, HttpMethod.POST, req, Map.class);
            if (!res.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("SMART_CONTRACT_API_ERROR: status=" + res.getStatusCode());
            }

            Map<?, ?> map = res.getBody();
            Object addrObj = (map == null) ? null
                    : (map.get("walletAddress") != null ? map.get("walletAddress") : map.get("address"));
            String addr = addrObj == null ? "" : String.valueOf(addrObj).trim();

            if (addr.isBlank()) {
                throw new IllegalStateException("SMART_CONTRACT_API_INVALID_RESPONSE: missing walletAddress");
            }
            return addr;
        } catch (RestClientException ex) {
            throw new IllegalStateException("SMART_CONTRACT_API_CALL_FAILED: " + ex.getMessage(), ex);
        }
    }

    private static String normalizePath(String path) {
        if (path == null || path.isBlank())
            return "";
        return path.startsWith("/") ? path : "/" + path;
    }
}
