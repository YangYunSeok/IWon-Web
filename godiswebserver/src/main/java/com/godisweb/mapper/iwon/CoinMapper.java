package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface CoinMapper {
    // 직원 목록 조회
    List<Map<String, Object>> selectEmpList(Map<String, Object> param);
    
    // 특정 직원 지갑 조회
    Map<String, Object> selectEmpWallet(String empNo);
    
    // 전송 이력 저장
    int insertTxHist(Map<String, Object> param);
    
    // 직원 잔액 업데이트
    int updateWalletBalance(Map<String, Object> param);
}