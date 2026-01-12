package com.godisweb.mapper.admin;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import java.util.Map;

@Mapper
public interface BatMntrMapper {
    // 배치 모니터링 목록 조회
    List<Map<String, Object>> selectBatchMonitorDt(Map<String, Object> param);

    // Exception Log 조회 (상단)
    // List<Map<String, Object>> selectExcpDtlLog(Map<String, Object> param);
    Map<String, Object> selectExcpDtlLog(Map<String, Object> param);

    // Exception Log Detail 조회 (하단)
    List<Map<String, Object>> selectExcpDtlLogList(Map<String, Object> param);
}

