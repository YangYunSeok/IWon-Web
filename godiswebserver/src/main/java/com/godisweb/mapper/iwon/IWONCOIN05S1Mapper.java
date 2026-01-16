package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN05S1Mapper {
    int insertApproval(Map<String, Object> approval);

    int insertApprovalTargets(List<Map<String, Object>> targets);

    List<Map<String, Object>> selectApprovals(Map<String, Object> params);

    int countApprovals(Map<String, Object> params);

    Map<String, Object> selectApprovalById(String approvalId);

    List<Map<String, Object>> selectApprovalTargetsByApprovalId(String approvalId);

    int updateApprovalStatus(Map<String, Object> params);
}
