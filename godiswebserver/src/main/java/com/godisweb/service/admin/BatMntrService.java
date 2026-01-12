package com.godisweb.service.admin;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.godisweb.mapper.admin.BatMntrMapper;

@Service
public class BatMntrService {

    private final BatMntrMapper mapper;
    private static final Logger logger = LoggerFactory.getLogger(BatMntrService.class);

    public BatMntrService(BatMntrMapper mapper) {
        this.mapper = mapper;
    }

    /*
     * public List<Map<String, Object>> getBatchGroups(Map<String, Object> param) {
     *     return mapper.selectBatchMonitorDt(param);
     * }
     */

    /**
     * 배치 모니터링 목록 조회
     */
    public List<Map<String, Object>> getBatchMonitorDt(Map<String, Object> param) {
        logger.info("▶ getBatchMonitorDt start: {}", new Date());

        List<Map<String, Object>> monitoringList = mapper.selectBatchMonitorDt(param);

        if (monitoringList == null || monitoringList.isEmpty()) {
            logger.info("▶ 조회 결과 없음");
            return Collections.emptyList();
        }

        // 컬럼 추가 (필요 시 기존 DataTable addColumn 대체)
        monitoringList.forEach(row -> {
            row.putIfAbsent("DATA_CNT", "");
            row.putIfAbsent("TASK_CNT", "");
        });

        logger.info("▶ root group 찾기 시작");
        List<Map<String, Object>> rootGroups = monitoringList.stream()
                //.filter(row -> StringUtils.isEmpty(row.get("GRP_SEQ"))) 
                .filter(row -> !StringUtils.hasText((String) row.get("GRP_SEQ")))
                .collect(Collectors.toList());

        rootGroups.parallelStream().forEach(root -> setGroupDataCount(monitoringList, root));

        logger.info("▶ getBatchMonitorDt end: {}", new Date());
        return monitoringList;
    }

    /**
     * 그룹 단위 데이터 건수 계산
     */
    private void setGroupDataCount(List<Map<String, Object>> monitoringList, Map<String, Object> row) {
        int totalCnt = Integer.parseInt(String.valueOf(row.get("TOTAL_CNT")));
        int failCnt = Integer.parseInt(String.valueOf(row.get("DATA_FAIL_CNT")));
        int grpCnt = Integer.parseInt(String.valueOf(row.get("GRP_CNT")));
        int grpSucCnt = Integer.parseInt(String.valueOf(row.get("GRP_SUC_CNT")));

        // 자식 그룹 탐색
        List<Map<String, Object>> childList = monitoringList.stream()
                .filter(r -> Objects.equals(String.valueOf(row.get("SEQ_KEY")), String.valueOf(r.get("GRP_SEQ"))))
                .collect(Collectors.toList());

        for (Map<String, Object> child : childList) {
            String executeTpCd = String.valueOf(child.get("EXECUTE_TP_CD"));

            if ("00".equals(executeTpCd)) {
                int childTotal = Integer.parseInt(String.valueOf(child.get("TOTAL_CNT")));
                int childFail = Integer.parseInt(String.valueOf(child.get("DATA_FAIL_CNT")));

                totalCnt += childTotal;
                failCnt += childFail;
                grpCnt += 1;
                grpSucCnt += "09".equals(String.valueOf(child.get("EXECUTE_STAT_CD"))) ? 1 : 0;

                String taskTpCd = String.valueOf(child.get("TASK_TP_CD"));
                if (Set.of("01", "02", "03").contains(taskTpCd)) {
                    child.put("DATA_CNT", String.format("[%d] / [%d]",
                            (childTotal - childFail),
                            (childTotal)));
                }
            } else {
                setGroupDataCount(monitoringList, child);
                totalCnt += Integer.parseInt(String.valueOf(child.get("TOTAL_CNT")));
                failCnt += Integer.parseInt(String.valueOf(child.get("DATA_FAIL_CNT")));
                grpCnt += Integer.parseInt(String.valueOf(child.get("GRP_CNT")));
                grpSucCnt += Integer.parseInt(String.valueOf(child.get("GRP_SUC_CNT")));
            }
        }

        row.put("TOTAL_CNT", totalCnt);
        row.put("DATA_FAIL_CNT", failCnt);
        row.put("GRP_CNT", grpCnt);
        row.put("GRP_SUC_CNT", grpSucCnt);

        if (!"00".equals(String.valueOf(row.get("EXECUTE_TP_CD")))) {
            row.put("TASK_CNT", String.format("[%d] / [%d]", (grpSucCnt), (grpCnt)));
            row.put("DATA_CNT", String.format("[%d] / [%d]", (totalCnt - failCnt), (totalCnt)));
            row.put("DATA_FAIL_YN", failCnt != 0 ? "Y" : "N");
        }
    }



     /**
     * Exception Log + Detail 통합 조회
     * (ASIS의 DataSet 구조를 하나의 Map으로 통합)
     */
    public Map<String, Object> getExcpDtlLog(Map<String, Object> param) {
        
        logger.info("▶ getExcpDtlLog param = {}", param);

        // 단건
        Map<String, Object> dtExcptDtlLog = mapper.selectExcpDtlLog(param);

        // 상세 로그 리스트
        List<Map<String, Object>> dtExcptDtlLogList = mapper.selectExcpDtlLogList(param);

        // Map 형태로 통합
        Map<String, Object> result = new HashMap<>();
        result.put("dtExcptDtlLog", dtExcptDtlLog);
        result.put("dtExcptDtlLogList", dtExcptDtlLogList);

        return result;
    }

    /**
     * Exception Log Detail 단독 조회
     * (ASIS의 getExcpDtlLogList)
     */
    public List<Map<String, Object>> getExcpDtlLogList(Map<String, Object> param) {

        List<Map<String, Object>> result = mapper.selectExcpDtlLogList(param);

        return result;
    }
}
