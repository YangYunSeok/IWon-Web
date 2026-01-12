package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.PushMonitorService;


@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class PushMonitorController {

    private final PushMonitorService pushMonitorService;

    public PushMonitorController(PushMonitorService pushMonitorService) {
        this.pushMonitorService = pushMonitorService;
    }

    @PostMapping("/getpushmonitor")
    public List<Map<String, Object>> getPushMonitor(@RequestBody Map<String, Object> param)  {
        
    	List<Map<String, Object>> group = pushMonitorService.getPushMonitor(param);
    	
    	return group;
    }
}
