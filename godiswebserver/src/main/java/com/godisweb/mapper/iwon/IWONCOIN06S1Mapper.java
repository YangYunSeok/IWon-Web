package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN06S1Mapper {

    List<Map<String, Object>> selectMonthlyPayees(@Param("p") Map<String, Object> params);

    int countMonthlyPayees(@Param("p") Map<String, Object> params);

    Map<String, Object> selectMonthlyPayeeById(@Param("id") String id);

    Integer existsMonthlyPayee(@Param("id") String id);

    String findMonthlyPayeeIdByKey(
            @Param("year") int year,
            @Param("month") int month,
            @Param("employeeId") String employeeId,
            @Param("coinType") String coinType);

    String selectEmployeeName(@Param("employeeId") String employeeId);

    int insertMonthlyPayee(@Param("p") Map<String, Object> params);

    int updateMonthlyPayee(@Param("p") Map<String, Object> params);

    int deleteMonthlyPayee(@Param("id") String id);

    int bulkDeleteMonthlyPayees(@Param("ids") List<String> ids);

    List<String> selectDistinctCoinTypes(@Param("year") int year, @Param("month") int month);

    String selectMonthlyPlanId(
            @Param("year") int year,
            @Param("month") int month,
            @Param("coinType") String coinType);

    int insertMonthlyPlan(@Param("p") Map<String, Object> params);

    int updateMonthlyPlanConfirmed(@Param("p") Map<String, Object> params);

    List<Map<String, Object>> selectMonthlyPayeesForExport(@Param("p") Map<String, Object> params);
}
