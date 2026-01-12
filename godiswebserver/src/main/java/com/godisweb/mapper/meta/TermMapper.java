package com.godisweb.mapper.meta;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TermMapper {
    List<Map<String, Object>> getTermList(Map<String, Object> param);
    
    Map<String, Object> getTermDetail(Map<String, Object> param);
    
    List<Map<String, Object>> getTermWordList(Map<String, Object> param);
    
    int checkTermEngNmDuplicate(Map<String, Object> param);
    
    int insertTerm(Map<String, Object> param);
    
    int updateTerm(Map<String, Object> param);
    
    int deleteTerm(Map<String, Object> param);
    
    int insertTermWordMapping(Map<String, Object> param);
    
    int deleteTermWordMapping(Map<String, Object> param);
    
    List<Map<String, Object>> getAllWords();
    
    List<Map<String, Object>> getHomonymWords(Map<String, Object> param);
    
    List<Map<String, Object>> getDomainList(Map<String, Object> param);
    
    Map<String, Object> getDomainDetail(Map<String, Object> param);
    
    int checkTermEngNmDuplicateExceptSelf(Map<String, Object> param);

    Map<String, Object> getWordByNo(Map<String, Object> param);
    
    int getLastTermNo();
    
    Map<String, Object> getWordByEngNm(Map<String, Object> param);
}