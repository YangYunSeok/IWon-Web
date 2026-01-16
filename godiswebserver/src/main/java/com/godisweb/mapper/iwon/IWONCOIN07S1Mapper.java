package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN07S1Mapper {

    List<Map<String, Object>> selectFinancialClosingApprovals(@Param("p") Map<String, Object> params);

    int countFinancialClosingApprovals(@Param("p") Map<String, Object> params);

    Map<String, Object> selectFinancialClosingAggregate(@Param("p") Map<String, Object> params);

    List<Map<String, Object>> selectFinancialClosingApprovalsForExport(@Param("p") Map<String, Object> params);
}
