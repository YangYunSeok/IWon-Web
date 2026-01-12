package com.godisweb.mapper.meta;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WordMapper {
    List<Map<String, Object>> getWordList(Map<String, Object> param);
    
    int checkWordEngNmDuplicate(Map<String, Object> param);
    
    List<Map<String, Object>> checkWordUsedInTerm(Map<String, Object> param);
    
    int insertWord(Map<String, Object> param);
    
    int updateWord(Map<String, Object> param);
    
    int deleteWord(Map<String, Object> param);
}
