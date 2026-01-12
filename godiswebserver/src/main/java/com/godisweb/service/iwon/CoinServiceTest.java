package com.godisweb.service.iwon;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CoinServiceTest {
	
	@Autowired
    private CoinService_bak coinService;
	
	String mainName = "IWon";
	String mainPk = "1e95474a1da9103583ef359e35fd48562e10e60ad842c512a8a6dbf2afe78b2a";
	String mainAdress = "0xb954Ee9E72b3aede6b1671934AeD23721EB93228";
	
	String empName1 = "직원1";
	String empPk1 = "bd625eecf28dd172607eaad0f49b3a24d1938e3ab10f0e0597c269038c7653a4";
	String empAdress1 = "0xCfdf456fa55AF4f26c611Fc396511750c8d98c16";

    @Test
    @Order(1)
    void 전송_전_잔액조회_테스트() {
        System.out.println("============== 테스트 시작 ==============");
        coinService.checkBalance(mainName, mainPk, mainAdress); // 메인 잔액 조회
        coinService.checkBalance(empName1, empPk1, empAdress1); // 직원1 잔액 조회
    }

    @Test
    @Order(2)
    void 코인전송_테스트() {
    	
        String sendCoinValue = "400";
        
        coinService.sendCoin(empName1, empAdress1, sendCoinValue);
    }
    
    @Test
    @Order(3)
    void 전송_후_잔액조회_테스트() {
        try {
            System.out.println(">>> 블록체인 업데이트 대기 중 (5초)...");
            Thread.sleep(5000); // 5초 동안 멈춤 (블록체인이 반영할 시간 주기)
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        coinService.checkBalance(mainName, mainPk, mainAdress);   // 메인 잔액 조회
        coinService.checkBalance(empName1, empPk1, empAdress1);   // 직원1 잔액 조회
        System.out.println("============== 테스트 종료 ==============");
    }

}
