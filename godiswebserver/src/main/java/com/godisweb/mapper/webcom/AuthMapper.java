package com.godisweb.mapper.webcom;

import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface AuthMapper {
	Map<String, Object> findByUsrId(@Param("username") String username);
}
