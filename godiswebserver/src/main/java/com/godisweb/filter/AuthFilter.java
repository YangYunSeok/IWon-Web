package com.godisweb.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.util.StreamUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class AuthFilter extends UsernamePasswordAuthenticationFilter {
	
	private final ObjectMapper objectMapper = new ObjectMapper();
	
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
    	
    	log.info("====================================");
        log.info(">>> AuthFilter 진입");
        log.info(">>> URL: {}", request.getRequestURI());
        log.info(">>> Method: {}", request.getMethod());
        log.info(">>> Content-Type: {}", request.getContentType());
        
        try {
        	
        	// 요청 본문 읽기 (디버깅용)
        	 String body = StreamUtils.copyToString(request.getInputStream(), StandardCharsets.UTF_8);
             log.info(">>> Request Body: {}", body);
        	
            LoginRequest loginRequest = objectMapper.readValue(body, LoginRequest.class);

            if (loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
                log.error(">>> username 또는 password가 null입니다!");
                throw new AuthenticationServiceException("username과 password는 필수입니다");
            }
            
            UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(), 
                    loginRequest.getPassword()
            );
            
            setDetails(request, authRequest);
            
            log.info(">>> AuthenticationManager.authenticate() 호출");
            Authentication authentication = this.getAuthenticationManager().authenticate(authRequest);
            log.info(">>> 인증 성공! Principal: {}", authentication.getPrincipal());
            log.info("====================================");
            
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);

            HttpSession session = request.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", securityContext);
            		
            return authentication;
            
        } catch (IOException e) {
            log.error(">>> JSON 파싱 실패: {}", e.getMessage(), e);
            throw new AuthenticationServiceException("JSON 파싱 실패: " + e.getMessage(), e);
        } catch (AuthenticationException e) {
            log.error(">>> 인증 실패: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error(">>> 예상치 못한 오류: {}", e.getMessage(), e);
            throw new AuthenticationServiceException("인증 처리 중 오류 발생", e);
        }
    }
}

@Data
class LoginRequest {
    private String username;
    private String password;
}