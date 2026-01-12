package com.godisweb.controller.meta;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.meta.DomainService;

@RestController
@RequestMapping("/api/meta")
@CrossOrigin(origins = "*")
public class DomainController {
    private final DomainService domainService;
    public DomainController(DomainService service) { this.domainService = service; }

    @PostMapping("/getDomainList")
    public List<Map<String, Object>> getDomainList(@RequestBody Map<String, Object> param) {
        List<Map<String, Object>> domainList = domainService.getDomainList(param);
        return domainList;
    }

    @PostMapping("/checkDomainEngNmDuplicate")
    public Map<String, Object> checkDomainEngNmDuplicate(@RequestBody Map<String, Object> param) {
        boolean isDuplicate = domainService.checkDomainEngNmDuplicate(param);
        
        Map<String, Object> result = new HashMap<>();
        result.put("isDuplicate", isDuplicate);
        
        return result;
    }

    @PostMapping("/insertDomain")
    public Map<String, Object> insertDomain(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int insertCount = domainService.insertDomain(param);
            result.put("success", true);
            result.put("message", "도메인이 등록되었습니다.");
            result.put("count", insertCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "도메인 등록 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    @PostMapping("/updateDomain")
    public Map<String, Object> updateDomain(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int updateCount = domainService.updateDomain(param);
            result.put("success", true);
            result.put("message", "도메인이 수정되었습니다.");
            result.put("count", updateCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "도메인 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    @PostMapping("/deleteDomain")
    public Map<String, Object> deleteDomain(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int deleteCount = domainService.deleteDomain(param);
            result.put("success", true);
            result.put("message", "도메인이 삭제되었습니다.");
            result.put("count", deleteCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "도메인 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }
}