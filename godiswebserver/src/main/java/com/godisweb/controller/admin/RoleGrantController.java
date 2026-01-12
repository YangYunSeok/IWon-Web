package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.RoleGrantService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
@Slf4j
public class RoleGrantController {

    private final RoleGrantService service;

    public RoleGrantController(RoleGrantService roleGrantService) {
        this.service = roleGrantService;
    }

    @GetMapping("/getUserGroup")
    public Map<String, List<Map<String, Object>>> getUserGroup(Map<String, Object> param) {
        return service.getUserGroup(param);
    }

    @GetMapping("/getUser")
    public List<Map<String, Object>> getUser(@RequestParam("usrGrpId") String usrGrpId) {
        return service.getUser(usrGrpId);
    }

    @GetMapping("/getUserRoleMappingData")
    public List<Map<String, Object>> getUserRoleMappingData(@RequestParam("usrId") String usrId) {
        log.info("usrId = {}", usrId);
        return service.getUserRoleMappingData(usrId);
    }

    /**
     * 사용자-역할 매핑 저장 (insert / delete)
     */
    @PostMapping("/saveRoleMapping")
    public Map<String, Object> saveRoleMapping(@RequestBody Map<String, Object> param) {
        return service.saveRoleMapping(param);
    }
}