package com.godisweb.mapper.webcom;

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
public interface MainMapper {

    /**
     * Return the list of menus available to a given user.
     *
     * @param userId the user identifier used to filter menu authorization
     * @return list of menu entries in flattened form
     */
	List<Map<String, Object>> selectMenus(Map<String, Object> param);
}