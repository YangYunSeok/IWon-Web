package com.godisweb.cache;

import java.util.*;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.mapper.admin.CodeMapper;
import com.godisweb.mapper.admin.MessageMapper;
import com.godisweb.mapper.webcom.CacheMapper;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@RestController
@RequestMapping("/cache")
public class CacheLoader {
    private static final String COMMON_CODE  = "COMMON_CODE";
    private static final String MESSAGE_CODE = "MESSAGE_CODE";
    private static final String KEY_ALL      = "ALL";
	
	private final CacheMapper cacheMapper;
	private final CacheManager cacheManager;
	
	/**
	 * 서버기동시 전체캐시를 로딩한다
	 * 
	 * @return
	 */
	@PostConstruct
	public void loadCaches() {
		log.info("////////////////////// Init Common Cache Loading.......//////////////////////");
		loadCommonCodes();
		loadCommonMessages();
	}
	
	/**
	 * 30분 간격으로 캐시를 자동 재로딩한다
	 * 
	 * @return
	 */
	@Scheduled(fixedDelay = 30 * 60 * 1000)
    public void scheduledReload() {
        log.info("스케줄러 자동 공통코드, 공통메시지 재로딩...");
        loadCommonCodes();
        loadCommonMessages();
    }
	
	/**
	 * 공통 코드 캐시를 로딩한다.
	 * 
	 * @return
	 */
	private void loadCommonCodes() {
        try {
        	List<Map<String, Object>> codeList = cacheMapper.selectAllCodes();
            Cache cache = cacheManager.getCache(COMMON_CODE);
        	if(cache == null) {
        		log.warn("⚠️ CommonCodes 캐시가 존재하지 않습니다.");
        		return;
        	}
        	
            if (codeList != null)
            {
            	Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
	            for (Map<String, Object> code : codeList)
	            {
	                String grpCdId = (String) code.get("GRP_CD_ID");
	                grouped.computeIfAbsent(grpCdId, k -> new ArrayList<>()).add(code);
	            }
	            cache.put("ALL", codeList);
	            grouped.forEach((grpCdId, codes) -> cache.put(grpCdId, codes)); // 그룹별

	            log.info("✅ commonCodes {}개 그룹 로드 완료", grouped.size());
            }
            
            
		} catch (Exception e) {
			log.error("❌ commonCodes 캐시 로딩 중 오류 발생", e);
		}
    }
	
	/**
	 * 공통 메시지 코드 캐시를 로딩한다.
	 * 
	 * @return
	 */
    private void loadCommonMessages() {
    	try {
            List<Map<String, Object>> msgList = cacheMapper.selectAllMessages();
            Cache cache = cacheManager.getCache(MESSAGE_CODE);
            
            if (cache == null) {
                log.warn("⚠️ commonMessages 캐시가 존재하지 않습니다.");
                return;
            }
            
           
            if (msgList != null)
            {
            	Map<String, List<Map<String, Object>>> classed = new LinkedHashMap<>();
                for (Map<String, Object> msg : msgList)
                {
                    String msgClssCd = (String) msg.get("MSG_CLSS_CD");
                    classed.computeIfAbsent(msgClssCd, k -> new ArrayList<>()).add(msg);
                }
                
                cache.put("ALL", msgList);
                classed.forEach((msgClssCd, msgs) -> cache.put(msgClssCd, msgs)); // 메시지유형별                
            }
            
            log.info("✅ commonMessages {}개 로드 완료", msgList.size());

        } catch (Exception e) {
            log.error("❌ commonMessages 캐시 로딩 중 오류 발생", e);
        }
    }
	
    /**
     * 수동으로 캐시 로싱시 사용하는 api
     * 
     * @return
     */
	public String cacheReload() {
		try {
	        loadCommonCodes();
	        loadCommonMessages();
	        
	        return "✅ 캐시가 성공적으로 재로딩되었습니다.";
	    } catch (Exception e) {
	        log.error("❌ 캐시 수동 리로드 중 오류 발생", e);
	        return "❌ 캐시 재로딩 중 오류가 발생했습니다: " + e.getMessage();
	    }
	}
}
