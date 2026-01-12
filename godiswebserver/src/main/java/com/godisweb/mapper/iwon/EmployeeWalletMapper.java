package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface EmployeeWalletMapper {

    List<Map<String, Object>> selectWalletList(Map<String, Object> params);

    Map<String, Object> selectWalletDetail(@Param("id") String id);

    int updateWallet(@Param("id") String id, @Param("param") Map<String, Object> param);
}
