package com.godisweb.controller.webcom;

import com.godisweb.service.webcom.AuthService;
import com.godisweb.service.webcom.CustomUserDetails;
import com.godisweb.service.admin.TempTokenStore;
import com.godisweb.service.admin.UserService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    
    @Autowired
    private TempTokenStore tempTokenStore;
    
    @Autowired
    private UserService userService;
    
    /**
     * 현재 사용자의 세션을 확인한다.
     * @param session
     * @return
     */
    @PostMapping("/session")
    public Map<String, Object> getCurrentUser(HttpSession session) {
        Object auth = session.getAttribute("SPRING_SECURITY_CONTEXT");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        log.info("/api/auth/session : " + auth);
        
		if (auth != null && authentication != null && authentication.isAuthenticated()) {
            return Map.of(
                "success", true,
                "message", "인증됨",
                "user", getUserInfo(authentication)
            );
        }
		
        return Map.of(
            "success", false,
            "message", "인증되지 않은 사용자입니다"
        );
    }

    /**
     * 세션 체크
     * @param session
     * @return
     */
    @PostMapping("/sessioncheck")
    public ResponseEntity<?> getSessionInfo(HttpSession session) {
        Map<String, Object> sessionInfo = new HashMap<>();
        sessionInfo.put("sessionId", session.getId());
        sessionInfo.put("creationTime", session.getCreationTime());
        sessionInfo.put("lastAccessedTime", session.getLastAccessedTime());
        sessionInfo.put("maxInactiveInterval", session.getMaxInactiveInterval());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        sessionInfo.put("authenticated", authentication != null && authentication.isAuthenticated());
        
        if (authentication != null && authentication.isAuthenticated()) {
            sessionInfo.put("username", authentication.getName());
        }

        return ResponseEntity.ok(sessionInfo);
    }
    
    @PostMapping("/keepsession")
    public ResponseEntity<Void> keepAlive(HttpSession session) {
        if (session.isNew()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        log.info("keepsession 호출 시간: " + LocalDateTime.now());
        log.info("세션 ID: " + session.getId() + ", maxInactiveInterval: " + session.getMaxInactiveInterval());
        
        session.setMaxInactiveInterval(30 * 60); // 30분 갱신
        return ResponseEntity.ok().build();
    }
    
    // ============================================
    // 관리자 로그인 API - 새로 추가
    // ============================================
    
    /**
     * 임시 토큰으로 로그인
     */
    @PostMapping("/loginWithToken")
    public ResponseEntity<Map<String, Object>> loginWithToken(
        //    @RequestParam String token,
    		@RequestParam("token") String token,
            HttpSession session) {
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("[Manager Login] Token received: " + token);
            
            // 1. 토큰 검증 및 소비 (일회용)
            TempTokenStore.TokenData tokenData = tempTokenStore.remove(token);
            
            if (tokenData == null) {
                result.put("success", false);
                result.put("message", "유효하지 않거나 이미 사용된 토큰입니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
            }
            
            // 2. 만료 시간 체크
            long now = System.currentTimeMillis();
            if (now > tokenData.expireAt) {
                result.put("success", false);
                result.put("message", "만료된 토큰입니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
            }
            
            // 3. 대상 사용자 정보 조회
            Map<String, Object> user = userService.getUserById(tokenData.targetUsrId);
            
            if (user == null) {
                result.put("success", false);
                result.put("message", "사용자를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
            }
            
            // 4. Spring Security 인증 객체 생성
            String userId = (String) user.get("USR_ID");
            String userNm = (String) user.get("USR_NM");
            String usrGrpId = (String) user.get("USR_GRP_ID");
            String usrGrpNm = (String) user.get("USR_GRP_NM");
            
            // 권한 설정 (필요에 따라 수정)
            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            
            // CustomUserDetails 생성 (기존 로그인과 동일하게)
            CustomUserDetails userDetails = new CustomUserDetails(
                userId,
                "",  // 비밀번호는 필요없음
                authorities,
                userNm,
                usrGrpId,
                usrGrpNm
            );
            
            // 5. Authentication 객체 생성 및 SecurityContext에 저장
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
            
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            
            // 6. 세션에 SecurityContext 저장
            session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
                securityContext
            );
            
            // 7. 감사 로그 기록
            log.info(String.format(
                "[Manager Login Success] Manager '%s' logged in as user '%s'", 
                tokenData.managerId, tokenData.targetUsrId));
            
            // 8. 응답
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", userId);
            userInfo.put("userNm", userNm);
            userInfo.put("usrGrpId", usrGrpId);
            userInfo.put("usrGrpNm", usrGrpNm);
            
            result.put("success", true);
            result.put("user", userInfo);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("[Manager Login Error]", e);
            result.put("success", false);
            result.put("message", "서버 오류: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    
    /**
     * 현재 사용자 정보를 맵으로 반환한다
     * @param authentication
     * @return
     */
    private Map<String, Object> getUserInfo(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return Map.of(
    		"userId", userDetails.getUsername(),
            "userNm", userDetails.getUsrNm(),
            "usrGrpId", userDetails.getUsrGrpId(),
            "usrGrpNm", userDetails.getUsrGrpNm(),
            "authorities", userDetails.getAuthorities()
        );
    }
}