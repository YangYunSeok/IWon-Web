package com.godisweb.service.webcom;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.godisweb.mapper.webcom.AuthMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {
	
	private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Map<String, Object> user = authMapper.findByUsrId(username);

        if (user == null) {
        	log.error(">>> DB에서 사용자를 찾을 수 없음: {}", username);
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username);
        }
        
        String dbUserId = (String) user.get("USR_ID");
        String dbPassword = (String) user.get("ENCRYP_PW");
        String dbUserNm = (String) user.get("USR_NM");
        String dbGrpId = (String) user.get("USR_GRP_ID");
        String dbGrpNm = (String) user.get("USR_GRP_NM");
        
        if (dbUserId == null || dbPassword == null) {
            log.error(">>> USR_ID 또는 ENCRYP_PW가 null입니다!");
            throw new UsernameNotFoundException("사용자 정보가 완전하지 않습니다");
        }
        
        // ENCRYP_PW가 암호화되어 있지 않다면 BCrypt로 인코딩 처리
        // dbPassword = passwordEncoder.encode(dbPassword);
        
        // 서버에서 권한을 관리하지 않는다.
        List<GrantedAuthority> authorities = Collections.emptyList();
//        UserDetails userDetails = User.builder()
//                .username(dbUserId)
//                .password("{noop}" + dbPassword) // 임시 평문사용 추후 반드시 암호화
//                .authorities(authorities)
//                .build();
        
        // 데이터베이스에서 조회한 유저정보를 CustomUserDetails 객체에 담는다.
        CustomUserDetails userDetails = new CustomUserDetails(username, "{noop}" + dbPassword, authorities, dbUserNm, dbGrpId, dbGrpNm);

        return userDetails;
    }
}