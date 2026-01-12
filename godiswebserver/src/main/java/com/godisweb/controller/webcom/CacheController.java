package com.godisweb.controller.webcom;

import java.util.*;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.webcom.CacheService;
import com.godisweb.service.webcom.LoginService;
import com.godisweb.mapper.admin.CodeMapper;
import com.godisweb.mapper.admin.MessageMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/api/webcom")
public class CacheController {
    private final CacheService cacheService;
    
    public CacheController(CacheService cacheService) {
        this.cacheService = cacheService;
    }
	
	@PostMapping("/getcachecodes")
	public Map<String, Object> getCacheCodes(@RequestBody List<Map<String, Object>> param) {
	    return cacheService.getCacheCodes(param);
	}
	
	@PostMapping("/getcachemsgs")
	public List<Map<String,Object>> getCacheMsgs(@RequestBody Map<String, Object> param) {
	    return cacheService.getCacheMsgs(param);
	}

	
//	@PostMapping("/reload")
//	public void cacheReload() {
//		try {
//			commonCacheLoader.cacheReload();
//	    } catch (Exception e) {
//	        log.error("❌ 캐시 수동 리로드 중 오류 발생", e);
//	    }
//	}
}
