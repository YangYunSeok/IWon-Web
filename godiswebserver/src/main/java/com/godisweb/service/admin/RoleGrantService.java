package com.godisweb.service.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.godisweb.mapper.admin.RoleGrantMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RoleGrantService {

    private final RoleGrantMapper mapper;

    @Value("${gpcl.system.code}")
    private String systemCode;

    public RoleGrantService(RoleGrantMapper roleGrantMapper) {
        this.mapper = roleGrantMapper;
    }

    public Map<String, List<Map<String, Object>>> getUserGroup(Map<String, Object> param) {
        Map<String, List<Map<String, Object>>> resultMap = new HashMap<>();

        List<Map<String, Object>> userGroup = mapper.getUserGroup();
        param.put("SYS_TP_CD", systemCode);
        List<Map<String, Object>> roleDefinition = mapper.getRoleDefinition(param);

        resultMap.put("userGroup", userGroup);
        resultMap.put("roleDefinition", roleDefinition);

        return resultMap;
    }

    public List<Map<String, Object>> getUser(String usrGrpId) {
        Map<String, Object> param = new HashMap<>();
        param.put("SYS_TP_CD", systemCode);
        param.put("USR_GRP_ID", usrGrpId);
        return mapper.getUser(param);
    }

    public List<Map<String, Object>> getUserRoleMappingData(String usrId) {
        return mapper.getUserRoleMappingData(usrId);
    }

    /**
     * 사용자 역할 매핑 저장 (INSERT / DELETE)
     */
    public Map<String, Object> saveRoleMapping(Map<String, Object> param) {

        int insertCnt = 0;
        int deleteCnt = 0;

        String usrId = (String) param.get("USR_ID");

        List<Map<String, Object>> insertList =
            (List<Map<String, Object>>) param.get("insertList");

        List<Map<String, Object>> deleteList =
            (List<Map<String, Object>>) param.get("deleteList");

        // 삭제 먼저
        if (deleteList != null && !deleteList.isEmpty()) {

            for (Map<String, Object> row : deleteList) {
                row.put("USR_ID", usrId);
            }

            deleteCnt = mapper.removeUserRoleMapping(deleteList);
        }

        // 추가
        if (insertList != null && !insertList.isEmpty()) {

            for (Map<String, Object> row : insertList) {
                row.put("USR_ID", usrId);
            }

            insertCnt = mapper.addUserRoleMapping(insertList);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("I", insertCnt);
        result.put("D", deleteCnt);

        return result;
    }
}