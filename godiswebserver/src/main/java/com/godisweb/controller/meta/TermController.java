package com.godisweb.controller.meta;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.meta.TermService;

@RestController
@RequestMapping("/api/meta")
@CrossOrigin(origins = "*")
public class TermController {
    private final TermService termService;
    public TermController(TermService service) { this.termService = service; }

    @PostMapping("/getTermList")
    public List<Map<String, Object>> getTermList(@RequestBody Map<String, Object> param) {
        return termService.getTermList(param);
    }

    @PostMapping("/getTermDetail")
    public Map<String, Object> getTermDetail(@RequestBody Map<String, Object> param) {
        return termService.getTermDetail(param);
    }

    @PostMapping("/suggestTermWords")
    public List<Map<String, Object>> suggestTermWords(@RequestBody Map<String, Object> param) {
        return termService.suggestTermWords(param);
    }

    @PostMapping("/getHomonymWords")
    public List<Map<String, Object>> getHomonymWords(@RequestBody Map<String, Object> param) {
        return termService.getHomonymWords(param);
    }

    @PostMapping("/getTermDomainList")
    public List<Map<String, Object>> getDomainList(@RequestBody Map<String, Object> param) {
        return termService.getDomainList(param);
    }

    @PostMapping("/getDomainDetail")
    public Map<String, Object> getDomainDetail(@RequestBody Map<String, Object> param) {
        return termService.getDomainDetail(param);
    }

    @PostMapping("/checkTermEngNmDuplicate")
    public Map<String, Object> checkTermEngNmDuplicate(@RequestBody Map<String, Object> param) {
        boolean isDuplicate = termService.checkTermEngNmDuplicate(param);
        Map<String, Object> result = new HashMap<>();
        result.put("isDuplicate", isDuplicate);
        return result;
    }

    @PostMapping("/insertTerm")
    public Map<String, Object> insertTerm(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int insertCount = termService.insertTerm(param);
            result.put("success", true);
            result.put("message", "용어가 등록되었습니다.");
            result.put("count", insertCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping("/updateTerm")
    public Map<String, Object> updateTerm(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int updateCount = termService.updateTerm(param);
            result.put("success", true);
            result.put("message", "용어가 수정되었습니다.");
            result.put("count", updateCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }

    @PostMapping("/deleteTerm")
    public Map<String, Object> deleteTerm(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int deleteCount = termService.deleteTerm(param);
            result.put("success", true);
            result.put("message", "용어가 삭제되었습니다.");
            result.put("count", deleteCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }
}