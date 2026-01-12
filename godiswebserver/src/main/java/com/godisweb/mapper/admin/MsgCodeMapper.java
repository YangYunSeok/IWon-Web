package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MsgCodeMapper {
    public List<Map<String, Object>> getMessageCode(Map<String, Object> param);
    public void saveMessageCode(List<Map<String, Object>> rows);

    public int getPkCnt(Map<String, Object> param);
    public int addMessageCode(Map<String, Object> param);
    public int updateMessageCode(Map<String, Object> param);
    public int removeMessageCode(Map<String, Object> param); 
}
