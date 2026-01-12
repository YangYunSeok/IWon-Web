package com.godisweb.service.iwon; 

import org.web3j.contracts.eip20.generated.ERC20;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;
import org.springframework.stereotype.Service;
import java.math.BigInteger;

@Service
public class CoinService_bak {

    // 1. 아까 확보한 정보들을 여기에 넣습니다.
    private final String RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1dLpJhj9MODsaD4Iw7xvh";
    private final String PRIVATE_KEY = "1e95474a1da9103583ef359e35fd48562e10e60ad842c512a8a6dbf2afe78b2a"; 
    private final String CONTRACT_ADDR = "0xb954Ee9E72b3aede6b1671934AeD23721EB93228";

    public void checkBalance(String name, String PK, String Adress) {
        try {
            // 2. 블록체인 네트워크 연결 (접속)
            Web3j web3j = Web3j.build(new HttpService(RPC_URL));

            // 3. 지갑 자격 증명 로드 (로그인)
            Credentials credentials = Credentials.create(PK);

            // 4. 계약서 불러오기 (Web3J가 제공하는 표준 ERC20 껍데기 사용)
            ERC20 token = ERC20.load(CONTRACT_ADDR, web3j, credentials, new DefaultGasProvider());

            // 5. 잔액 조회 (블록체인에 질문)
            BigInteger balance = token.balanceOf(credentials.getAddress()).send();

            System.out.println(">>> 현재" + name + " 지갑 잔액: " + balance);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 코인 전송 기능
    public String sendCoin(String name, String toAddress, String amount) {
        try {
            // 1. 연결 및 인증 (기존과 동일)
            Web3j web3j = Web3j.build(new HttpService(RPC_URL));
            Credentials credentials = Credentials.create(PRIVATE_KEY);
            ERC20 token = ERC20.load(CONTRACT_ADDR, web3j, credentials, new DefaultGasProvider());

            // 2. 보낼 금액 설정 (입력받은 개수 * 10^18)
            // 예: "10"을 보내면 -> 10000000000000000000 (18자리)로 변환
            BigInteger value = new BigInteger(amount).multiply(BigInteger.TEN.pow(18));

            System.out.println(">>> 송금 시작: " + amount + " IWC를 " + name + "에게 보냅니다...");

            // 3. 전송 실행 (여기서 시간이 조금 걸립니다)
            // transfer 함수가 '영수증(TransactionReceipt)'을 반환합니다.
            String txHash = token.transfer(toAddress, value).send().getTransactionHash();

            System.out.println(">>> 송금 성공! (트랜잭션 해시: " + txHash + ")");
            return txHash;

        } catch (Exception e) {
            e.printStackTrace();
            return "실패: " + e.getMessage();
        }
    }
    
    
}