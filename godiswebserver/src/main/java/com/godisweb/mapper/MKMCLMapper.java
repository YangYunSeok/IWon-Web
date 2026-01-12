package com.godisweb.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MKMCLMapper {
	List<Map<String, Object>> selectMKMCL01Holy(Map<String, Object> param);
	List<Map<String, Object>> selectMKMCL01Stdr(Map<String, Object> param);
	
	int insertHolyDate(Map<String, Object> row);
	int updateHolyDate(Map<String, Object> row);
	int deleteHolyDate(Map<String, Object> row);
	
	List<Map<String, Object>> selectHolyDateAll(Map<String, Object> param);
	List<Map<String, Object>> selectBizDate(Map<String, Object> param);
	

	
	int insertBizDate(Map<String, Object> row);
	int updateBizDate(Map<String, Object> row);
	

	List<Map<String, Object>> selectHolidayList(Map<String, Object> param);	
}
