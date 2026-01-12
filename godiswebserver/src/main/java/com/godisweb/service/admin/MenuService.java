package com.godisweb.service.admin;

import com.godisweb.mapper.admin.MenuMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Service layer for retrieving menu definitions. Delegates to the
 * MenuMapper to execute the recursive SQL query. Having a service
 * abstraction makes it easy to add caching or additional business
 * logic later without changing controller code.
 */
@Service
public class MenuService {

    private final MenuMapper menuMapper;

    public MenuService(MenuMapper menuMapper) {
        this.menuMapper = menuMapper;
    }

    /**
     * Return all menu entries that the specified user has access to.
     *
     * @param userId the user identifier used to filter menu authorization
     * @return list of menu entries in flattened form
     */
    public List<Map<String, Object>> getMenus(Map<String, Object> param)
    {
        return menuMapper.selectMenus(param);
    }

    /**
     * Save a single menu entity. If menuId is null, insert new menu.
     * Otherwise, update existing menu.
     *
     * @param MenuDto the menu entity to save
     * @return saved menu entity
     */
    public int saveMenu(Map<String, Object> row) {
//        if (menuInfo.MENU_ID == null || menuInfo.MENU_ID.trim().isEmpty()) {
//            // Generate new menu ID if needed
//            // String newMenuId = generateMenuId();
//            // MenuDto.setMenuId(newMenuId);
//            menuMapper.insertMenu(menuInfo);
//        } else {
//            menuMapper.updateMenu(menuInfo);
//        }
        return 1;
    }

    /**
     * Process bulk menu operations (insert, update, delete).
     *
     * @param inserts list of menu entities to insert
     * @param updates list of menu entities to update
     * @param deletes list of menu entities to delete
     * @return map containing operation counts
     */
    public Map<String, Object> saveMenus(List<Map<String, Object>> rows) {
        int insertCount = 0, updateCount = 0, deleteCount = 0;

//        // Process deletes first to avoid constraint issues
//        for (MenuDto.MenuInfo menu : deletes) {
//            menuMapper.deleteMenu(menu.MENU_ID);
//            deleteCount++;
//        }
//
//        // Process updates
//        for (MenuDto.MenuInfo menu : updates) {
//            menuMapper.updateMenu(menu);
//            updateCount++;
//        }
//
//        // Process inserts
//        for (MenuDto.MenuInfo menu : inserts) {
//            menuMapper.insertMenu(menu);
//            insertCount++;
//        }

        return Map.of(
            "insertCount", insertCount,
            "updateCount", updateCount,
            "deleteCount", deleteCount,
            "totalProcessed", insertCount + updateCount + deleteCount
        );
    }
    public Map<String, List<Map<String, Object>>> getMenuData(String systemCode) {
        LinkedHashMap<String, Object> param = new LinkedHashMap<>();
        param.put("SYS_TP_CD", systemCode);

        List<Map<String,Object>> menuList = menuMapper.selectMenuList(param);
        List<Map<String,Object>> programList = menuMapper.selectProgramList(param);
        List<Map<String,Object>> btnList = menuMapper.selectProgramBtnAuth(param);//Program 별 버튼 권한 조회

        return Map.of(
            "dtMenu", menuList,
            "dtProgramList", programList,
            "dtBtnList", btnList
        );
    }
    public List<Map<String, Object>> getBtnAuth(String butnId) {
        LinkedHashMap<String, Object> param = new LinkedHashMap<>();
        param.put("BUTN_ID", butnId != null ? butnId : "");
        return menuMapper.selectBtnInfo(param);                    //버튼 마스터테이블 조회
    }    
 
    @Transactional
    public Map<String, Object> saveMenuData(List<Map<String, Object>> param) {
        
        int ins = 0;
        int upd = 0;
        int del = 0;
        
        Map<String, Object> result = new LinkedHashMap<>();
        
        if (param != null) {
            
            System.out.println("메뉴 저장 쿼리 시작");
            
            // ============================================================
            // INSERT / UPDATE / DELETE 로직
            // ============================================================
            for (Map<String, Object> row : param) {
                
                if ("I".equals(row.get("ROW_STATE"))) {
                    ins += menuMapper.insertMenuInfo(row);
                    System.out.println("메뉴 insert");
                    
                } else if ("U".equals(row.get("ROW_STATE"))) {
                    upd += menuMapper.updateMenuInfo(row);
                    System.out.println("메뉴 update");
                    
                } else if ("D".equals(row.get("ROW_STATE"))) {
                    del += menuMapper.deleteMenuInfo(row);
                    System.out.println("메뉴 delete");
                }
            }
        }
        
        // ============================================================
        // return 값 반환
        // ============================================================
        result.put("I", ins);
        result.put("U", upd);
        result.put("D", del);
        
        return result;
    }  

    @Transactional
    public Map<String, Object> saveProgramInfo(Map<String, List<Map<String, Object>>> param) {

        int ins = 0, upd = 0, del = 0;

        // ==========================
        // 1) ProgramList 처리
        // ==========================
        List<Map<String, Object>> programList = param.get("dtProgramList");
        if (programList != null) {
            for (Map<String, Object> row : programList) {

                String rowState = (String) row.get("ROW_STATE");

                if ("I".equals(rowState)) {
                    menuMapper.insertProgramInfo(row);
                    System.out.println("프로그램 목록 저장: Rowsatatus - "+rowState);
                    ins++;
                }
                else if ("U".equals(rowState)) {
                    menuMapper.updateProgramInfo(row);
                    System.out.println("프로그램 목록 저장: Rowsatatus - "+rowState);
                    upd++;
                }
                else if ("D".equals(rowState)) {
                    menuMapper.deleteProgramInfo(row);
                    System.out.println("프로그램 목록 저장: Rowsatatus - "+rowState);
                    del++;
                }
            }
        }

        // ==========================
        // 2) BtnList 처리
        // ==========================
        List<Map<String, Object>> btnList = param.get("dtBtnList");
        if (btnList != null) {
            for (Map<String, Object> row : btnList) {

                String rowState = (String) row.get("ROW_STATE");

                if ("I".equals(rowState)) {
                    menuMapper.insertProgramBtnAuth(row);
                    System.out.println("프로그램퀀한: Rowsatatus - "+rowState);
                }
                else if ("U".equals(rowState)) {
                //    menuMapper.updateBtnInfo(row);
                 //   upd++;
                }                
                else if ("D".equals(rowState)) {
                    menuMapper.deleteProgramBtnAuth(row);
                    System.out.println("프로그램퀀한: Rowsatatus - "+rowState);
                }
            }
        }

        
        // 결과 반환
        return Map.of(
            "I", ins,
            "U", upd,
            "D", del
        );
    }
    
    @Transactional
    public Map<String, Object> saveButtonList(List<Map<String, Object>> param) {
        
        int ins = 0;
        int upd = 0;
        int del = 0;
        
        Map<String, Object> result = new LinkedHashMap<>();
        
        if (param != null) {
            
            System.out.println("버튼 저장 쿼리 시작");
            
            // ============================================================
            // INSERT / UPDATE / DELETE 로직
            // ============================================================
            for (Map<String, Object> row : param) {
                
                if ("I".equals(row.get("ROW_STATE"))) {
                    ins += menuMapper.insertBtnInfo(row);
                    System.out.println("버튼 insert");
                    
                } else if ("U".equals(row.get("ROW_STATE"))) {
                    upd += menuMapper.updateBtnInfo(row);
                    System.out.println("버튼 update");
                    
                } else if ("D".equals(row.get("ROW_STATE"))) {
                    del += menuMapper.deleteBtn(row);
                    System.out.println("버튼 delete");
                }
            }
        }
        
        // ============================================================
        // return 값 반환
        // ============================================================
        result.put("I", ins);
        result.put("U", upd);
        result.put("D", del);
        
        return result;
    }

}