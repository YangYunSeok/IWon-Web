package com.godisweb.mapper.admin;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;


@Mapper
public interface BatchMapper {
    List<Map<String, Object>> selectBatchGroups(Map<String, Object> param);
    int selectChildCnt(@Param("taskGrpId") String taskGrpId);
    int insertBatchGroup(Map<String, Object> row);
    int updateBatchGroup(Map<String, Object> row);
    int deleteBatchGroup(Map<String, Object> row);

    Map<String, Object> selectBatchFlow(Map<String, Object> param);
    int updateBatchFlow(Map<String, Object> row);
    
    int insertExecConnTask(Map<String, Object> row);
    int updateExecConnTask(Map<String, Object> row);

    List<Map<String, Object>> selectFileMaps(Map<String, Object> param);
    List<Map<String, Object>> selectStoredProc(Map<String, Object> param);
}
