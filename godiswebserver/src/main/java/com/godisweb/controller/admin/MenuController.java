package com.godisweb.controller.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.godisweb.service.admin.MenuService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller that exposes menu definitions to the front‑end. Menus
 * are fetched from the database via the MenuService and returned as
 * JSON. The optional userId query parameter determines for which user
 * the menu authorization should be resolved.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class MenuController {

    private final MenuService menuService;
    private final ObjectMapper objectMapper;

    public MenuController(MenuService menuService, ObjectMapper objectMapper) {
        this.menuService = menuService;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieve the full menu structure for a given user. If no userId
     * parameter is provided, a default user ("KICHO") is used.
     *
     * @param userId optional user identifier
     * @return list of menu entities
     */
    @PostMapping("/getmenus")
    public List<Map<String, Object>> getMenus(@RequestBody Map<String, Object> param) {
        return menuService.getMenus(param);
    }

    /**
     * 메뉴 일괄 저장 (CUD 처리)
     * @param payload 삽입/수정/삭제할 메뉴 데이터
     * @return 처리 결과
     */
    @PostMapping("/savemenus")
    public Map<String, Object> saveMenus(@RequestBody List<Map<String, Object>> rows) {
//        try {
//            // payload에서 inserts, updates, deletes 추출
//            List<MenuDto.MenuInfo> inserts = extractMenuList(payload, "inserts");
//            List<MenuDto.MenuInfo> updates = extractMenuList(payload, "updates");
//            List<MenuDto.MenuInfo> deletes = extractMenuList(payload, "deletes");
//
//            // 서비스에서 일괄 처리
//            Map<String, Object> result = menuService.saveMenus(inserts, updates, deletes);
//            
//            Map<String, Object> response = new HashMap<>();
//            response.put("success", true);
//            response.put("message", "메뉴가 성공적으로 저장되었습니다.");
//            response.put("result", result);
//            
//            return ResponseEntity.ok(response);
//        } catch (Exception e) {
//            Map<String, Object> errorResponse = new HashMap<>();
//            errorResponse.put("success", false);
//            errorResponse.put("message", "메뉴 저장 중 오류가 발생했습니다: " + e.getMessage());
//            
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
//        }
    	
    	return null;
    }


    /**
     * 메뉴 수정
     * @param menuId 수정할 메뉴 ID
     * @param MenuDto 수정할 메뉴 정보
     * @return 수정된 메뉴 정보
     */
    @PostMapping(value = "/updatemenu", consumes = MediaType.APPLICATION_JSON_VALUE)
    public int updateMenu(@RequestBody Map<String, Object> body)
    {

        return 1;
    }

    // 한 화면에서 필요한 메뉴, 프로그램, 버튼 데이터를 한 번에 반환
    @PostMapping("/getMenuData")
    public Map<String, List<Map<String, Object>>> getMenuData(
        @RequestParam("systemCode") String systemCode  // ✅ name 명시
    ) {
        return menuService.getMenuData(systemCode);
    } 

    @PostMapping("/getBtnAuth")
    public List<Map<String, Object>> getBtnAuth(@RequestBody Map<String, String> param) {
        return menuService.getBtnAuth(param.get("BUTN_ID"));
    }
 
    /**
     * @author     김진솔
     * @since      2025. 11. 04
     * @MethodName saveMenuData
     * @return     Map<String, Object>
     *             메뉴데이터 저장 결과(I/U/D 건수)를 반환한다.
     */
    @PostMapping(value = "/savemenudata", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveMenuData(@RequestBody List<Map<String, Object>> param) {
        return menuService.saveMenuData(param);
    }

    /**
     * @author     김진솔
     * @since      2025. 11. 04
     * @MethodName saveButtonList
     * @return     Map<String, Object>
     *             버튼정보 저장 결과(I/U/D 건수)를 반환한다.
     */
    @PostMapping(value = "/savebuttonlist", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveButtonList(@RequestBody List<Map<String, Object>> param) {
        return menuService.saveButtonList(param);
    }

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveProgramList
	 * @return      Map<String, Object>
	 *             프로그램 및 버튼권한 데이터를 저장한다
	 */		
	@PostMapping(value = "/saveprogramlist", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveProgrmAuthority(
	        @RequestBody Map<String, List<Map<String, Object>>> param) {

	    return menuService.saveProgramInfo(param);
	}

}