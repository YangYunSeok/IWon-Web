package com.godisweb.mapper.iwon;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface IWONCOIN01Mapper {

    Map<String, Object> selectSupplySummary(Map<String, Object> param);

    Map<String, Object> selectDailyMetrics(Map<String, Object> param);
}
