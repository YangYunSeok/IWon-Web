package com.godisweb.service.admin;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.godisweb.mapper.admin.UserMapper;

@Service
public class UserService {
	private final UserMapper mapper;

	public UserService(UserMapper mapper) {
		this.mapper = mapper;
	}

	public List<Map<String, Object>> getUserGroups(Map<String, Object> param) {
		List<Map<String, Object>> userGroup = mapper.selectUserGroups(param);
		return userGroup;
	}

	@Transactional
	public Map<String, Object> saveUserGroups(List<Map<String, Object>> param) {
	    
	    int ins = 0;
	    int upd = 0;
	    int del = 0;
	    
	    Map<String, Object> result = new LinkedHashMap<>();
	    
	    if (param != null) {
	        
	        System.out.println("소속그룹 저장 쿼리 시작");
	        
	        // ============================================================
	        // INSERT / UPDATE / DELETE 로직
	        // ============================================================
	        for (Map<String, Object> row : param) {
	            
	            if ("I".equals(row.get("ROW_STATE"))) {
	                ins += mapper.insertGroupInfo(row);
	                System.out.println("소속그룹 insert");
	                
	            } else if ("U".equals(row.get("ROW_STATE"))) {
	                upd += mapper.updateGroupInfo(row);
	                System.out.println("소속그룹 update");
	                
	            } else if ("D".equals(row.get("ROW_STATE"))) {
	                del += mapper.deleteGroupinfo(row);
	                System.out.println("소속그룹 delete");
	            }
	        }
	    }
	    
	    // ============================================================
	    // return 값 반환
	    // ============================================================
	    result.put("I", ins);
	    result.put("U", upd);
	    result.put("D", del);
	    
	    return result;
	}
	
	public List<Map<String, Object>> getUser(Map<String, Object> param) {
		List<Map<String, Object>> user = mapper.selectUser(param);
		return user;
	}

	@Transactional
	public Map<String, Object> saveUser(List<Map<String, Object>> param) {
	    
	    int ins = 0;
	    int upd = 0;
	    int del = 0;
	    
	    Map<String, Object> result = new LinkedHashMap<>();
	    
	    if (param != null) {
	        
	        System.out.println("사용자 저장 쿼리 시작");
	        
	        // ============================================================
	        // INSERT / UPDATE / DELETE 로직
	        // ============================================================
	        for (Map<String, Object> row : param) {
	            
	            if ("I".equals(row.get("ROW_STATE"))) {
	                ins += mapper.insertUserInfo(row);
	                mapper.insertUserLogin(row);
	                System.out.println("사용자 insert");
	                
	            } else if ("U".equals(row.get("ROW_STATE"))) {
	                upd += mapper.updateUserInfo(row);
	                mapper.updateUserLogin(row);
	                System.out.println("사용자 update");
	                
	            } else if ("D".equals(row.get("ROW_STATE"))) {
	                del += mapper.deleteUserInfo(row);
	                mapper.deleteUserLogin(row);
	                System.out.println("사용자 delete");
	            }
	        }
	    }
	    
	    // ============================================================
	    // return 값 반환
	    // ============================================================
	    result.put("I", ins);
	    result.put("U", upd);
	    result.put("D", del);
	    
	    return result;
	}

	@Transactional
	public Map<String, Object> saveUserPw(List<Map<String, Object>> param) {
	    
	    int upd = 0;
	    
	    Map<String, Object> result = new LinkedHashMap<>();
	    
	    if (param != null && !param.isEmpty()) {
	        
	        System.out.println("사용자 비밀번호 초기화 쿼리 시작");
	        
	        // ============================================================
	        // UPDATE 로직 (비밀번호 초기화)
	        // ============================================================
	        for (Map<String, Object> row : param) {
	            if (row.get("USR_ID") != null) {
	                String userId = row.get("USR_ID").toString();
	                // row.put("ENCRYP_PW", KbBascp.encryptString(userId, "ONE_WAY"));
	                upd += mapper.updateUserPw(row);
	                System.out.println("사용자 비밀번호 초기화: " + userId);
	            }
	        }
	    }
	    
	    // ============================================================
	    // return 값 반환
	    // ============================================================
	    result.put("I", 0);
	    result.put("U", upd);
	    result.put("D", 0);
	    
	    return result;
	}

	/**
	 * 관리자 권한 확인
	 */
	public boolean hasAdminRole(String userId) {
		try {
			// TODO: 실제 권한 확인 로직으로 교체 필요
			// 예시: mapper.selectUserRole(userId) 등으로 DB 조회

			// 임시 구현: 사용자 존재 여부만 확인
			Map<String, Object> user = mapper.selectUserById(userId);

			if (user != null) {
				// TODO: 실제로는 USR_ROLE, USR_GRP_ID 등으로 관리자 여부 확인
				// 예: "ADMIN".equals(user.get("USR_ROLE"))
				return true; // 임시: 모든 사용자를 관리자로 간주
			}

			return false;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * 사용자 존재 확인
	 */
	public boolean userExists(String userId) {
		try {
			Map<String, Object> user = mapper.selectUserById(userId);
			return user != null;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * 사용자 정보 조회 (로그인용)
	 */
	public Map<String, Object> getUserById(String userId) {
		try {
			return mapper.selectUserById(userId);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

	/**
	 * 사용자 ID 중복 체크 (대소문자 구분 없이)
	 */
	public boolean checkDuplicateUserId(String userId) {
		try {
			int count = mapper.countUserById(userId);
			return count > 0;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}
}