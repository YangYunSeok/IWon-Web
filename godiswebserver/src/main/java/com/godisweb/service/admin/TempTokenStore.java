package com.godisweb.service.admin;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 관리자 로그인용 임시 토큰 저장소
 * 메모리 기반 (서버 재시작 시 초기화됨)
 */
@Component
public class TempTokenStore {
	
	private final Map<String, TokenData> store = new ConcurrentHashMap<>();
	
	/**
	 * 토큰 저장
	 */
	public void put(String token, String managerId, String targetUsrId, long expireAt) {
		store.put(token, new TokenData(managerId, targetUsrId, expireAt));
		System.out.println("[TempTokenStore] Token stored: " + token);
	}
	
	/**
	 * 토큰 조회 및 제거 (일회용)
	 */
	public TokenData remove(String token) {
		TokenData data = store.remove(token);
		if (data != null) {
			System.out.println("[TempTokenStore] Token consumed: " + token);
		}
		return data;
	}
	
	/**
	 * 만료된 토큰 정리 (선택사항)
	 */
	public void cleanExpired() {
		long now = System.currentTimeMillis();
		
		int sizeBefore = store.size();
		store.entrySet().removeIf(entry -> entry.getValue().expireAt < now);
		int removed = sizeBefore - store.size();
		
		if (removed > 0) {
			System.out.println("[TempTokenStore] Expired tokens removed: " + removed);
		}
	}
	
	/**
	 * 토큰 데이터 클래스
	 */
	public static class TokenData {
		public String managerId;
		public String targetUsrId;
		public long expireAt;
		
		public TokenData(String managerId, String targetUsrId, long expireAt) {
			this.managerId = managerId;
			this.targetUsrId = targetUsrId;
			this.expireAt = expireAt;
		}
	}
}