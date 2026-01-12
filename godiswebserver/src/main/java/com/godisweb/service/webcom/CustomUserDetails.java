package com.godisweb.service.webcom;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class CustomUserDetails extends User{
	private final String usrNm;
    private final String usrGrpId;
    private final String usrGrpNm;

    public CustomUserDetails(
            String username,
            String password,
            Collection<? extends GrantedAuthority> authorities,
            String usrNm,
            String usrGrpId,
            String usrGrpNm
    ) {
        super(username, password, authorities);
        this.usrNm = usrNm;
        this.usrGrpId = usrGrpId;
        this.usrGrpNm = usrGrpNm;
    }

    public String getUsrNm() {
        return usrNm;
    }

    public String getUsrGrpId() {
        return usrGrpId;
    }

    public String getUsrGrpNm() {
        return usrGrpNm;
    }
}
