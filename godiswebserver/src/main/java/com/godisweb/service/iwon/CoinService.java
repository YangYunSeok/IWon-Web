package com.godisweb.service.iwon; 

import com.godisweb.mapper.iwon.CoinMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.web3j.contracts.eip20.generated.ERC20;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class CoinService {

    private final CoinMapper coinMapper;
    
    private final String RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1dLpJhj9MODsaD4Iw7xvh";
    private final String PRIVATE_KEY = "1e95474a1da9103583ef359e35fd48562e10e60ad842c512a8a6dbf2afe78b2a";
    private final String CONTRACT_ADDR = "0xb954Ee9E72b3aede6b1671934AeD23721EB93228";
    private final String ADMIN_ADDR = "0x6FA2692b918B8D63b35bd2f33906639Ff31b4b71"; // 계정주소

    public CoinService(CoinMapper coinMapper) {
        this.coinMapper = coinMapper;
    }

    /** 직원 목록 조회 */
    public List<Map<String, Object>> getEmployeeList(Map<String, Object> param) {
        return coinMapper.selectEmpList(param);
    }

    /** 관리자 지갑 정보 조회 (Web3J 실시간) */
    public Map<String, Object> getAdminWalletInfo() {
        Map<String, Object> result = new HashMap<>();
        try {
            Web3j web3j = Web3j.build(new HttpService(RPC_URL));
            Credentials credentials = Credentials.create(PRIVATE_KEY);
            ERC20 token = ERC20.load(CONTRACT_ADDR, web3j, credentials, new DefaultGasProvider());
            
            // Wei 단위(10^18)를 보기 좋게 변환
            BigInteger balanceWei = token.balanceOf(ADMIN_ADDR).send();
            BigDecimal balanceEth = new BigDecimal(balanceWei).divide(BigDecimal.TEN.pow(18));

            result.put("address", ADMIN_ADDR);
            result.put("balance", balanceEth.toString());
        } catch (Exception e) {
            e.printStackTrace();
            result.put("address", ADMIN_ADDR);
            result.put("balance", "Error");
        }
        return result;
    }
    
    /** 전체 직원 잔액 동기화 */
    public Map<String, Object> syncBalances() {
        Map<String, Object> result = new HashMap<>();
        
        AtomicInteger successCnt = new AtomicInteger(0);
        AtomicInteger failCnt = new AtomicInteger(0);

        // 스레드 풀: 무료 노드이므로 20개 정도로 제한 (너무 많으면 차단됨)
        ForkJoinPool customThreadPool = new ForkJoinPool(20); 

        try {
            List<Map<String, Object>> list = coinMapper.selectEmpList(new HashMap<>());
            
            Web3j web3j = Web3j.build(new HttpService(RPC_URL));
            Credentials credentials = Credentials.create(PRIVATE_KEY);
            // 전역 토큰 인스턴스
            ERC20 token = ERC20.load(CONTRACT_ADDR, web3j, credentials, new DefaultGasProvider());

            // 병렬 스트림 실행
            customThreadPool.submit(() -> 
                list.parallelStream().forEach(emp -> {
                    String walletAddr = (String) emp.get("WALLET_ADDR");
                    
                    if (walletAddr != null && walletAddr.startsWith("0x")) {
                        
                        // === [여기서부터 재시도 로직 시작] ===
                        boolean isSuccess = false;
                        int retryCount = 0;
                        int maxRetries = 3; // 최대 3번까지 재시도

                        while (!isSuccess && retryCount < maxRetries) {
                            try {
                                // 너무 빠른 요청 방지용 미세 딜레이 (0.3초)
                                Thread.sleep(300);

                                // 블록체인 조회
                                BigInteger balanceWei = token.balanceOf(walletAddr).send();
                                BigDecimal balanceEth = new BigDecimal(balanceWei).divide(BigDecimal.TEN.pow(18));
                                
                                // DB 업데이트
                                Map<String, Object> updateParam = new HashMap<>();
                                updateParam.put("walletAddr", walletAddr);
                                updateParam.put("balance", balanceEth);
                                
                                coinMapper.updateWalletBalance(updateParam);
                                
                                // 성공 처리
                                successCnt.incrementAndGet();
                                isSuccess = true; // while 문 탈출

                            } catch (Exception e) {
                                retryCount++;
                                if (retryCount == maxRetries) {
                                    // 3번 다 실패하면 진짜 실패로 간주
                                    failCnt.incrementAndGet();
                                    System.err.println("최종 실패 (" + emp.get("EMP_NM") + "): " + e.getMessage());
                                } else {
                                    // 실패 시 1초 쉬고 다시 시도 (Back-off)
                                    try { Thread.sleep(1000); } catch (InterruptedException ie) {}
                                    System.out.println("재시도 중 (" + retryCount + "/" + maxRetries + "): " + walletAddr);
                                }
                            }
                        }
                        // === [재시도 로직 끝] ===
                    }
                })
            ).get(); // 모든 작업 완료 대기

            result.put("status", "success");
            result.put("message", "총 " + successCnt.get() + "건 동기화 완료" + 
                                (failCnt.get() > 0 ? " (" + failCnt.get() + "건 실패)" : ""));

        } catch (Exception e) {
            e.printStackTrace();
            result.put("status", "error");
            result.put("message", "동기화 중 오류 발생: " + e.getMessage());
        } finally {
            if (customThreadPool != null) {
                customThreadPool.shutdown();
            }
        }
        
        return result;
    }

    /** 코인 전송 및 결과 DB 저장 */
    public Map<String, Object> transferCoin(Map<String, Object> param) {
        Map<String, Object> response = new HashMap<>();
        
        // 필요한 데이터 미리 꺼내기
        String toAddr = (String) param.get("toAddress");
        String amountStr = (String) param.get("amount");
        String empNo = (String) param.get("empNo");
        String reasonCd = (String) param.get("reasonCd");

        // 별도 스레드에서 전송 수행
        new Thread(() -> {
            try {
                System.out.println(">>> [Async] 블록체인 전송 시작: " + toAddr);
                
                Web3j web3j = Web3j.build(new HttpService(RPC_URL));
                Credentials credentials = Credentials.create(PRIVATE_KEY);
                ERC20 token = ERC20.load(CONTRACT_ADDR, web3j, credentials, new DefaultGasProvider());

                BigInteger value = new BigInteger(amountStr).multiply(BigInteger.TEN.pow(18));
                
                // 실제 전송
                String txHash = token.transfer(toAddr, value).send().getTransactionHash();

                // DB 이력 저장
                Map<String, Object> histParam = new HashMap<>();
                histParam.put("sndWalletAddr", ADMIN_ADDR);
                histParam.put("rcvWalletAddr", toAddr);
                histParam.put("rcvEmpNo", empNo);
                histParam.put("amount", amountStr);
                histParam.put("reasonCd", reasonCd);
                histParam.put("txHash", txHash);
                histParam.put("txStatCd", "SUCCESS");

                coinMapper.insertTxHist(histParam);
                
                // 받는 사람의 '진짜 잔액'을 블록체인에서 다시 조회하여 DB 갱신
                BigInteger newBalanceWei = token.balanceOf(toAddr).send();
                BigDecimal newBalanceEth = new BigDecimal(newBalanceWei).divide(BigDecimal.TEN.pow(18));
                
                Map<String, Object> updateParam = new HashMap<>();
                updateParam.put("walletAddr", toAddr);
                updateParam.put("balance", newBalanceEth);
                
                coinMapper.updateWalletBalance(updateParam);

                System.out.println(">>> [Async] 전송 완료 TxHash: " + txHash);

            } catch (Exception e) {
                e.printStackTrace();
                System.err.println(">>> [Async] 전송 실패: " + e.getMessage());
            }
        }).start();

        // 화면에는 즉시 성공 응답 반환
        response.put("status", "success");
        response.put("message", "전송 요청이 접수되었습니다.\n(블록체인 반영까지 잠시 시간이 소요됩니다.)");
        
        return response;
    }
    
}