package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN02S1Mapper {

    List<Map<String, Object>> selectEmployees(@Param("p") Map<String, Object> params);

    String selectWalletAddress(@Param("employeeId") String employeeId);

    int createWalletIfMissing(
            @Param("employeeId") String employeeId,
            @Param("walletAddress") String walletAddress);
}
