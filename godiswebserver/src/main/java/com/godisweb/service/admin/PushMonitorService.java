package com.godisweb.service.admin;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.godisweb.mapper.admin.PushMonitorMapper;


@Service
public class PushMonitorService {

    private final PushMonitorMapper mapper;
    private static final Logger logger = LoggerFactory.getLogger(PushMonitorService.class);
    

    public PushMonitorService(PushMonitorMapper mapper) {
        this.mapper = mapper;
    }

    public List<Map<String, Object>> getPushMonitor(Map<String, Object> param) {
        return mapper.getPushMonitor(param);
    }
}
