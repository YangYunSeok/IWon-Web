package com.godisweb.handler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.godisweb.service.webcom.CustomUserDetails;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class AuthSuccessSHandler implements AuthenticationSuccessHandler{
	private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, 
                                       HttpServletResponse response,
                                       Authentication authentication) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json;charset=UTF-8");
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        
        // 로그인 성공시 화면으로 전달할 값들을 맵에 담는다.
        Map<String, Object> userInfo = Map.of(
            "userId", userDetails.getUsername(),
            "userNm", userDetails.getUsrNm(),
            "usrGrpId", userDetails.getUsrGrpId(),
            "usrGrpNm", userDetails.getUsrGrpNm(),
            "authorities", userDetails.getAuthorities()
        );
        
        HttpSession session = request.getSession(true);
        session.setAttribute("loginInfo", session);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "로그인 성공");
        result.put("user", userInfo);

        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
