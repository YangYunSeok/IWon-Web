package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.UserConnectStatusService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class UserConnectStatusController {

    private final UserConnectStatusService userConnectStatusService;

    public UserConnectStatusController(UserConnectStatusService userConnectStatusService) {
        this.userConnectStatusService = userConnectStatusService;
    }

    /**
     * 검색조건에 따른 사용자 접속현황을 검색한다
     */
    @PostMapping("/getuserconnectstatus")
    public List<Map<String, Object>> getUserConnectStatus(@RequestBody Map<String, Object> param) {
    	
    	List<Map<String, Object>> group = userConnectStatusService.getUserConnectStatus(param);
    	
        return group;
    }

    /**
     * 사용자 그룹 정보를 조회한다
     */
    @PostMapping("/getusergrouppopup")
    public List<Map<String, Object>> getUserGroupPopup(@RequestBody Map<String, Object> param) {
    	
    	List<Map<String, Object>> group = userConnectStatusService.getUserGroupPopup(param);
    	
        return group;
    }

    /**
     * 사용자 접속현황 상세정보를 조회한다
     */
    @PostMapping("/getuserconnectstatusdetail")
    public List<Map<String, Object>> getUserConnectStatusDetail(@RequestBody Map<String, Object> param) {
        return userConnectStatusService.getUserConnectStatusDetail(param);
    }
}
