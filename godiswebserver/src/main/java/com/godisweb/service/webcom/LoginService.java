package com.godisweb.service.webcom;

import com.godisweb.mapper.webcom.LoginMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service layer for retrieving menu definitions. Delegates to the
 * MenuMapper to execute the recursive SQL query. Having a service
 * abstraction makes it easy to add caching or additional business
 * logic later without changing controller code.
 */
@Service
public class LoginService {

    private final LoginMapper loginMapper;

    public LoginService(LoginMapper loginMapper) {
        this.loginMapper = loginMapper;
    }

    /**
     * Return all menu entries that the specified user has access to.
     *
     * @param usrId the user identifier used to filter menu authorization
     * @return list of menu entries in flattened form
     */
    public Map<String, Object> getLogin(Map<String, Object> param)
    {
    	Map<String, Object> map = loginMapper.selectUser(param);

        return map;
    }
}