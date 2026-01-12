package com.godisweb.service.webcom;

import com.godisweb.mapper.webcom.MainMapper;
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
public class MainService {

    private final MainMapper mainMapper;

    public MainService(MainMapper mainMapper) {
        this.mainMapper = mainMapper;
    }

    /**
     * Return all menu entries that the specified user has access to.
     *
     * @param usrId the user identifier used to filter menu authorization
     * @return list of menu entries in flattened form
     */
    public List<Map<String, Object>> getMain(Map<String, Object> param)
    {
        return mainMapper.selectMenus(param);
    }
}