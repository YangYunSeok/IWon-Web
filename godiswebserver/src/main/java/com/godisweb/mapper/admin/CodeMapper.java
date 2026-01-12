package com.godisweb.mapper.admin;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface CodeMapper {
	List<Map<String, Object>> selectGroups(Map<String, Object> param);
    int insertGroup(Map<String, Object> row);
    int updateGroup(Map<String, Object> row);
    int deleteGroup(Map<String, Object> row);

    List<Map<String, Object>> selectCode(Map<String, Object> param);
    int insertCode(Map<String, Object> row);
    int updateCode(Map<String, Object> row);
    int deleteCode(Map<String, Object> row);
}
