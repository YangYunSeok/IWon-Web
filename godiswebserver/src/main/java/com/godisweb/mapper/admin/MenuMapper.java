package com.godisweb.mapper.admin;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * Mapper interface for retrieving menu definitions. The SQL for this
 * mapper is defined externally in src/main/resources/mapper/MenuMapper.xml.
 * Using an XML mapper avoids issues with long or complex queries in
 * annotation-based mappers and allows easier maintenance.
 */
@Mapper
public interface MenuMapper {
    List<Map<String, Object>> selectMenus(Map<String, Object> param);

     /**
     * Select a single menu by ID.
     */
    Map<String, Object> selectMenu(Map<String, Object> param);
    
    /**
     * Insert a new menu.
     */
    void insertMenu(Map<String, Object> row);
    
    /**
     * Update an existing menu.
     */
    void updateMenu(Map<String, Object> row);
    
    /**
     * Delete a menu by ID.
     */
    void deleteMenu(Map<String, Object> row);
    
    List<Map<String, Object>> selectMenuList(Map<String, Object> param);
    List<Map<String, Object>> selectProgramList(Map<String, Object> param);
    List<Map<String, Object>> selectProgramBtnAuth(Map<String, Object> param);
    List<Map<String, Object>> selectBtnInfo(Map<String, Object> param);
    


    
	int insertMenuInfo(Map<String, Object> row);
	int updateMenuInfo(Map<String, Object> row);
	int deleteMenuInfo(Map<String, Object> row);
	
	int insertProgramInfo(Map<String, Object> row);
	int updateProgramInfo(Map<String, Object> row);
	int deleteProgramInfo(Map<String, Object> row);
	
	int insertProgramBtnAuth(Map<String, Object> row);
//	int updateBtnInfo(Map<String, Object> row);
	int deleteProgramBtnAuth(Map<String, Object> row);
	int insertBtnInfo(Map<String, Object> row);
	int updateBtnInfo(Map<String, Object> row);
	int deleteBtn(Map<String, Object> row);

}