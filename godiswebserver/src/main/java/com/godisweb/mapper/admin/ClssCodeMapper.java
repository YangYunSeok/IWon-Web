package com.godisweb.mapper.admin;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;


@Mapper
public interface ClssCodeMapper {
    List<Map<String, Object>> getClssCodeGroup(Map<String, Object> param);
    int addClssCodeGroup(Map<String, Object> row);
    int updateClssCodeGroup(Map<String, Object> row);
    int removeClssCodeGroup(Map<String, Object> row);

    List<Map<String, Object>> getClssCode(Map<String, Object> param);
    int insertClssCode(Map<String, Object> row);
    int updateClssCode(Map<String, Object> row);
    int removeClssCode(Map<String, Object> row);
}
