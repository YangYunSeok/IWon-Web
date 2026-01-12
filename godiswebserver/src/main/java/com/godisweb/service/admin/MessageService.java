package com.godisweb.service.admin;

import java.util.*;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class MessageService {
	
	
	@Cacheable(value = "commonMessages", key = "'ALL'")
    public Map<String, Map<String, Object>> getAllMessages() {
        // 서버 기동 시 이미 캐시 로딩 → DB 조회 없음
        return null; // 캐시에서 바로 반환
    }
}
