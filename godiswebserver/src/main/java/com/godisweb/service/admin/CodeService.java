package com.godisweb.service.admin;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.helper.Utils;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.godisweb.mapper.admin.CodeMapper;

@Service
public class CodeService {
    private final CodeMapper mapper;
    public CodeService(CodeMapper mapper) { this.mapper = mapper; }

    public List<Map<String, Object>> getGroups(Map<String, Object> param) {
    	List<Map<String, Object>> group = mapper.selectGroups(param);
        return group;
    }

//    public Map<String, Object> getCommon(Map<String, Object> param) {
//    	List<Map<String, Object>> group = mapper.selectGroups(param);
//    	Map<String, Object> map = group.get(0);
//    	List<Map<String, Object>> code = mapper.selectCode(map);
//    	Map<String, Object> common = new HashMap<String, Object>();
//    	common.put("GROUP", group);
//    	common.put("CODE", code);
//        return common;
//    }

    @Transactional
    public int saveGroup(List<Map<String, Object>> param)
    {
        int ins=0, upd=0, del=0;
        if (param != null)
        {
            for(Map<String, Object> row : param)
            {
            	if ("I".equals(row.get("ROW_STATE")))
            	{
                    mapper.insertGroup(row);            		
            	}
            	else if ("U".equals(row.get("ROW_STATE")))
            	{
                    mapper.updateGroup(row);            		
            	}
            	else if ("D".equals(row.get("ROW_STATE")))
            	{
                    mapper.deleteGroup(row);            		
            	}
            }
        }

        return 1;
    }

    public List<Map<String, Object>> getCodes(Map<String, Object> param) {
    	List<Map<String, Object>>  items = mapper.selectCode(param);
        return items;
    }
    
    @Transactional
    public int saveCode(List<Map<String, Object>> param)
    {
        int ins=0, upd=0, del=0;
        if (param != null)
        {
            for(Map<String, Object> row : param)
            {
            	if ("I".equals(row.get("ROW_STATE")))
            	{
                    mapper.insertCode(row);            		
            	}
            	else if ("U".equals(row.get("ROW_STATE")))
            	{
                    mapper.updateCode(row);            		
            	}
            	else if ("D".equals(row.get("ROW_STATE")))
            	{
                    mapper.deleteCode(row);            		
            	}
            }
        }

        return 1;
    }
    
    ///////////////////////////////////////
    // CACHE
    ///////////////////////////////////////
    
    
    @Cacheable(value = "commonCodes", key = "#params['grpCdId']")
    public Map<String, String> getCodeMap(Map<String, Object> params) {
        // DB 쿼리용 파라미터 생성
        Map<String, Object> param = new HashMap<>();
        param.put("grpCdId", params.get("grpCdId"));

        List<Map<String, Object>> items = mapper.selectCode(param);
        Map<String, String> result = new LinkedHashMap<>();

        for (Map<String, Object> item : items) {
            String codeValue = (String) item.get("codeValue");
            String codeName = (String) item.get("codeName");
            result.put(codeValue, codeName);
        }

        return result;
    }
    
    @CacheEvict(value = "commonCodes", allEntries = true)
    public void refreshAllCommonCodesCache() {}
    
    @CacheEvict(value = "commonCodes", key = "#grpCdId")
    public void refreshCommonCodeCache() {}
    
}
