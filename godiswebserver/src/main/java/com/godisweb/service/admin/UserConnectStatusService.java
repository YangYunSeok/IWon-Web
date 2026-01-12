package com.godisweb.service.admin;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.godisweb.mapper.admin.UserConnectStatusMapper;

@Service
public class UserConnectStatusService {

    private final UserConnectStatusMapper mapper;
    private static final Logger logger = LoggerFactory.getLogger(UserConnectStatusService.class);

    private String systemCode = "STO";

    public UserConnectStatusService(UserConnectStatusMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * 검색조건에 따른 항목들을 검색한다
     * @author     이정호
     * @since      2019. 12. 11.
     * @MethodName getUserConnectStatus
     * @return     List<Map<String, Object>>
     */
    public List<Map<String, Object>> getUserConnectStatus(Map<String, Object> param) {

        // 접속내역, 현황에 따라서 조회 달라짐
        if ("Y".equals(String.valueOf(param.get("TR_CONN_STAT")))) {
            return mapper.getUserConnectStatus(param);
        } else {
            param.put("SYS_TP_CD", systemCode);
            return mapper.getUserConnectDetail(param);
        }
    }

    /**
     * 사용자 접속현황 상세 조회
     */
    public List<Map<String, Object>> getUserConnectStatusDetail(Map<String, Object> param) {
        return mapper.getUserConnectStatusDetail(param);
    }

    /**
     * 사용자 그룹 조회
     */
    public List<Map<String, Object>> getUserGroupPopup(Map<String, Object> param) {
        return mapper.getUserGroupPopup(param);
    }
}
