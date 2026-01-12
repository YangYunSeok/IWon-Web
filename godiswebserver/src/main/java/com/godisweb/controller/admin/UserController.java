package com.godisweb.controller.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.UserService;
import com.godisweb.service.admin.TempTokenStore;
import com.godisweb.service.webcom.CustomUserDetails;

/**
 * @author 김진솔
 * @since  2025. 11. 04
 *         <PRE>
 *         소속그룹 및 사용자화면
 *         2025. 10. 23. kej : 최조작성
 *         </PRE>
 */	
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class UserController {
	private final UserService userService;

	@Autowired
	private TempTokenStore tempTokenStore;

	public UserController(UserService service) {
		this.userService = service;
	}
	
	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName getUserGroups
	 * @return     List<Map<String, Object>>
	 *             소속그룹을 조회한다.
	 */
	@PostMapping("/getusergroups")
	public List<Map<String, Object>> getUserGroups(@RequestBody Map<String, Object> param) {
		List<Map<String, Object>> userGroup = userService.getUserGroups(param);
		return userGroup;
	}
	
	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveUserGroups
	 * @return     Map<String, Object>
	 *             소속그룹정보 저장 결과(I/U/D 건수)를 반환한다.
	 */
	@PostMapping(value = "/saveusergroups", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveUserGroups(@RequestBody List<Map<String, Object>> param) {
	    return userService.saveUserGroups(param);
	}

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName getUser
	 * @return     List<Map<String, Object>>
	 *             사용자 정보를 조회한다.
	 */	
	@PostMapping("/getuser")
	public List<Map<String, Object>> getUser(@RequestBody Map<String, Object> param) {
		List<Map<String, Object>> user = userService.getUser(param);
		return user;
	}

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveUser
	 * @return     Map<String, Object>
	 *             사용자 정보 저장 결과(I/U/D 건수)를 반환한다.
	 */
	@PostMapping(value = "/saveuser", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveUser(@RequestBody List<Map<String, Object>> param) {
	    return userService.saveUser(param);
	}

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveUserPw
	 * @return     Map<String, Object>
	 *             사용자 비밀번호 초기화 결과(U 건수)를 반환한다.
	 */
	@PostMapping(value = "/saveuserpw", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveUserPw(@RequestBody List<Map<String, Object>> param) {
	    return userService.saveUserPw(param);
	}
	
	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName createManagerLoginToken
	 * @return     ResponseEntity<Map<String, Object>>  
	 *             관리자 로그인용 임시 토큰 생성 결과를 반환한다.
	 *             success: true/false, token: 생성된 임시 토큰 (성공 시)
	 */	
	@PostMapping("/createManagerLoginToken")
	public ResponseEntity<Map<String, Object>> createManagerLoginToken(@RequestBody Map<String, Object> params,
			HttpSession session) {

		Map<String, Object> result = new HashMap<>();

		try {
			// 1. Spring Security에서 현재 사용자 정보 가져오기
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

			if (authentication == null || !authentication.isAuthenticated()) {
				result.put("success", false);
				result.put("message", "로그인이 필요합니다.");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
			}

			// 2. CustomUserDetails에서 userId 가져오기
			CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
			String managerId = userDetails.getUsername();

			System.out.println("[Manager Login Token] Manager ID: " + managerId);

			// 3. 관리자 권한 확인
			boolean hasAdminRole = userService.hasAdminRole(managerId);
			if (!hasAdminRole) {
				result.put("success", false);
				result.put("message", "관리자 권한이 없습니다.");
				return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
			}

			// 4. 대상 사용자 ID 가져오기
			String targetUsrId = (String) params.get("USR_ID");
			if (targetUsrId == null || targetUsrId.isEmpty()) {
				result.put("success", false);
				result.put("message", "대상 사용자 ID가 없습니다.");
				return ResponseEntity.badRequest().body(result);
			}

			// 5. 대상 사용자 존재 확인
			boolean userExists = userService.userExists(targetUsrId);
			if (!userExists) {
				result.put("success", false);
				result.put("message", "사용자를 찾을 수 없습니다.");
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
			}

			// 6. 임시 토큰 생성 (UUID)
			String token = UUID.randomUUID().toString().replace("-", "");

			// 7. 만료 시간 설정 (5분)
			long expireAt = System.currentTimeMillis() + (5 * 60 * 1000);

			// 8. 토큰 저장
			tempTokenStore.put(token, managerId, targetUsrId, expireAt);

			// 9. 로그 기록
			System.out.println(String.format("[Manager Login Token Created] Manager: %s, Target User: %s, Token: %s",
					managerId, targetUsrId, token));

			// 10. 응답
			result.put("success", true);
			result.put("token", token);
			return ResponseEntity.ok(result);

		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
			result.put("message", "서버 오류: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
		}
	}

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName checkDuplicateUserId
	 * @return     ResponseEntity<Map<String, Object>>  
	 *             사용자 ID 중복 체크 결과를 반환한다.
	 *             success: true/false, isDuplicate: 중복 여부, message: 안내 메시지
	 */		
	@PostMapping("/checkDuplicateUserId")
	public ResponseEntity<Map<String, Object>> checkDuplicateUserId(@RequestBody Map<String, Object> params) {
		Map<String, Object> result = new HashMap<>();

		try {
			String usrId = (String) params.get("USR_ID");

			if (usrId == null || usrId.trim().isEmpty()) {
				result.put("success", false);
				result.put("message", "사용자 ID를 입력해주세요.");
				return ResponseEntity.badRequest().body(result);
			}

			// 서비스에서 중복 체크
			boolean isDuplicate = userService.checkDuplicateUserId(usrId);

			result.put("success", true);
			result.put("isDuplicate", isDuplicate);
			result.put("message", isDuplicate ? "이미 존재하는 사용자 ID입니다." : "사용 가능한 ID입니다.");

			return ResponseEntity.ok(result);

		} catch (Exception e) {
			e.printStackTrace();
			result.put("success", false);
			result.put("message", "중복 체크 중 오류가 발생했습니다: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
		}
	}
}