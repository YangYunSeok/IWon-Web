package com.godisweb.mapper.meta;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DomainMapper {
    List<Map<String, Object>> getDomainList(Map<String, Object> param);
    
    int checkDomainEngNmDuplicate(Map<String, Object> param);
    
    int insertDomain(Map<String, Object> param);
    
    int updateDomain(Map<String, Object> param);
    
    int deleteDomain(Map<String, Object> param);
}
