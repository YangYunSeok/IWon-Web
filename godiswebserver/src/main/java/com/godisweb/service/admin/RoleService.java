package com.godisweb.service.admin;

import com.godisweb.mapper.admin.RoleMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author 김은지
 * @since  2025. 10. 23
 *         <PRE>
 *         역할 정의
 *         2025. 10. 23. kej : 최조작성
 *         </PRE>
 */
@Service
@Slf4j
public class RoleService {

    private final RoleMapper mapper;

    @Value("${gpcl.system.code}")
    String systemCode;

    public RoleService(RoleMapper mapper) {
        this.mapper = mapper;
    }

	/**
	 * @author     김은지
	 * @since      2025. 10. 23
	 * @MethodName getRoles
	 * @return     List<Map<String, Object>>
	 *             Role 및 메뉴/버튼 권한을 조회한다.
	 */
    public List<Map<String, Object>> getRoles(Map<String, Object> param)
    {
        param.put("SYS_TP_CD", systemCode);
        return mapper.selectRoles(param);
    }

	/**
	 * @author     김은지
	 * @since      2025. 10. 23
	 * @MethodName getMenuButnAuth
	 * @return     List<Map<String, Object>>
	 *             메뉴/버튼 권한을 조회한다.
	 */
    public Map<String, Object> getMenuButnAuth(Map<String, Object> param)
    {
    	Map<String, Object> result = new HashMap<>();
        param.put("SYS_TP_CD", systemCode);
    	result.put("DtMenuButnAuth", mapper.selectMenuButnAuth(param));				// 메뉴/버튼/권한
    	result.put("DtBtn", mapper.selectBtnList(param));							// 버튼 목록
    	result.put("DtMenu", mapper.selectMenuList(param));							// 메뉴 목록
    	result.put("DtProgmButnMappList", mapper.selectProgmButnMappList(param));	// 화면별 버튼

		return result;
    }

    /**
     * @author 신상민
     * @since 2025. 12. 03
     * @MethodName saveRoleMenu
     * @return void
     * @Description 메뉴/버튼 권한을 저장한다.
     */
    public void saveRoleMenu(Map<String, Object> param) {
        //Table - GPCL_ROLE_BUTN_AUTH
        List<Map<String, String>> rowList = ParamParsingRow(param, "saveRoleMenu");
        executeSave(rowList, "saveRoleMenu");
    }

    /**
     * @author 신상민
     * @since 2025. 12. 04
     * @MethodName saveRole
     * @return void
     * @Description 사용자 역할에 대한 정보를 저장한다.
     */
    public void saveRole(Map<String, Object> param) {
        List<Map<String, String>> rowList = ParamParsingRow(param, "saveRole");
        executeSave(rowList, "saveRole");
    }

    public List<Map<String, String>> ParamParsingRow(Map<String, Object> param, String methodName) {
        List<Map<String, String>> paramList = new ArrayList<>();

        for (String state : param.keySet()) {
            if ( !(param.get(state) instanceof String) ) {
                List<Map<String, String>> rowList = (List<Map<String, String>>) param.getOrDefault(state, new ArrayList<>());
                for (Map<String, String> row : rowList) {
                    Map<String, String> parsingParamMap = new HashMap<>();
                    parsingParamMap.put("state", state);

                    if ("saveRoleMenu".equals(methodName)) {
                        parsingParamMap.put("ROLE_ID", (String)param.get("ROLE_ID"));
                        parsingParamMap.put("MENU_ID", row.get("MENU_ID"));
                        parsingParamMap.put("BUTN_ID", row.get("BUTN_ID"));
                    } else if ("saveRole".equals(methodName)) {
                        parsingParamMap.put("SYS_TP_CD", systemCode); //설정파일 변수 불러오는 것으로 변경할때 수정필요
                        parsingParamMap.put("ROLE_ID", row.getOrDefault("ROLE_ID", ""));
                        parsingParamMap.put("ROLE_NM", row.get("ROLE_NM"));
                        parsingParamMap.put("ROLE_ENG_NM", row.get("ROLE_ENG_NM"));
                        parsingParamMap.put("ROLE_DSC", row.get("ROLE_DSC"));
                        parsingParamMap.put("ROLE_ENG_DSC", row.get("ROLE_ENG_DSC"));
                        parsingParamMap.put("USR_TP_CD", row.get("USR_TP_CD"));
                        parsingParamMap.put("MBR_TP_CD", row.getOrDefault("MBR_TP_CD", ""));

                    }
                    paramList.add(parsingParamMap);
                }
            }
        }
        return paramList;
    }

    public int executeSave(List<Map<String, String>> rowList, String methodName) {

        for (Map<String, String> row : rowList) {
            if ("saveRoleMenu".equals(methodName)) {

                //역할에 매뉴 권한이 없으면 신규 등록
                if (mapper.getRoleMenuButn(row) == 0) {
                    mapper.addRoleMenuButn(row);
                }

                if ("inserts".equals(row.get("state"))) {
                    mapper.insertRoleMenuBtn(row);
                } else if ("deletes".equals(row.get("state"))) {
                    mapper.deleteRoleMenuBtn(row);
                }
            } else if ("saveRole".equals(methodName)) {
                if ("inserts".equals(row.get("state"))) {
                    mapper.insertRole(row);
                } else if("deletes".equals(row.get("state"))) {
                    mapper.removeRoleAllBtnAuth(row); // 역할버튼권한매핑 삭제
                    mapper.removeRoleMenuAuth(row); // 역할메뉴권한매핑 삭제
                    mapper.removeRoleDefin(row); // 역할정의 삭제
                } else if("updates".equals(row.get("state"))) {
                    mapper.updateRole(row);
                }
            }
        }

        return 0;
    }

}