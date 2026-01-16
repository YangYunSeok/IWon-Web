package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN03S1Mapper {

    /**
     * 코인 지급/회수 대상자의 지갑/잔액 정보를 조회합니다.
     * (SSOT: CoinDist 화면의 사전 검증 로그 용도)
     */
    List<Map<String, Object>> selectWalletRowsByEmployeeIds(@Param("employeeIds") List<String> employeeIds);
}
