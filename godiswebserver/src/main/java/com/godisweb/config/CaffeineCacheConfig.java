package com.godisweb.config;

import java.time.Duration;
import java.util.Arrays;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
public class CaffeineCacheConfig {
	
    private static final String COMMON_CODE  = "COMMON_CODE";
    private static final String MESSAGE_CODE = "MESSAGE_CODE";

	/**
	 * CaffeineCache를 생성하고 cache 기본값을 설정한다.
	 * 
	 * @author joonyoung
	 * @return
	 */
	@Bean
	public CacheManager cacheManager() {
		CaffeineCacheManager cacheManager = new CaffeineCacheManager();
		
		cacheManager.setCacheNames(Arrays.asList(COMMON_CODE, MESSAGE_CODE));
		
		cacheManager.setCaffeine(Caffeine.newBuilder()
				.maximumSize(1000)
				.expireAfterWrite(Duration.ofHours(24))
				.recordStats());
		
		return cacheManager;
	}
}
