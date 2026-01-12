package com.godisweb.service.webcom;

import java.util.*;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;

import com.godisweb.mapper.webcom.CacheMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
//@Component
public class CacheService {
	private final CacheManager cacheManager;
 
    public CacheService(CacheManager cacheManager)
    { 
    	this.cacheManager = cacheManager;
    }
    
    public Map<String, Object> getCacheCodes(List<Map<String, Object>> param)
    {
        Cache cache = cacheManager.getCache("COMMON_CODE");
        if (cache == null) return Map.of();
        
        Map<String, Object> ds = new HashMap<>();
        
        for(Map<String, Object> key : param)
        {
        	String strGrpCdId = "" + key.get("KEY");
            List<Map<String,Object>> codes = cache != null ? cache.get(strGrpCdId, List.class) : null;        	
            ds.put(strGrpCdId, codes);            
        }
        
        return ds;
    }

    public List<Map<String,Object>> getCacheMsgs(Map<String, Object> param)
    {
        Cache cache = cacheManager.getCache("MESSAGE_CODE");
        if (cache == null) return List.of();
        
       	String strMsgClssCd = "" + param.get("MSG_CLSS_CD");
       	strMsgClssCd = "01";
        List<Map<String,Object>> msgs = cache != null ? cache.get(strMsgClssCd, List.class) : null;        	           
        
        return msgs;
    }    
}
