package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PushMonitorMapper {

	List<Map<String, Object>> getPushMonitor(Map<String, Object> param) ;
	
}
