package com.godisweb.mapper.webcom;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

/**
 * Mapper interface for retrieving menu definitions. The SQL for this
 * mapper is defined externally in src/main/resources/mapper/MenuMapper.xml.
 * Using an XML mapper avoids issues with long or complex queries in
 * annotation-based mappers and allows easier maintenance.
 */
@Mapper
public interface CacheMapper {

	List<Map<String, Object>> selectAllCodes();
	List<Map<String, Object>> selectAllMessages();
}