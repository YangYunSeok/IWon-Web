package com.godisweb.controller.admin;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.util.*;

import com.godisweb.service.admin.ClssCodeService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class ClssCodeController {

    private final ClssCodeService clssCodeService;

    public ClssCodeController(ClssCodeService clssCodeService) {
        this.clssCodeService = clssCodeService;
    }

    /** 계층코드 그룹 조회 */
    @PostMapping(value = "/getclsscodegroup")
    public List<Map<String, Object>> getClssCodeGroup(@RequestBody Map<String, Object> param) {
        List<Map<String, Object>> rtnLiMap = clssCodeService.getClssCodeGroup(param);
        return rtnLiMap;
    }

    /** 계층코드 그룹 저장 */
    @PostMapping(value = "/saveclsscodegroup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveClssCodeGroup(@RequestBody List<Map<String, Object>> rows) {
        clssCodeService.saveClssCodeGroup(rows);
        return Map.of("ok", true);
    }

    /** 계층코드 조회 */
    @PostMapping(value = "/getclsscode")
    public List<Map<String, Object>> getClssCode(@RequestBody Map<String, Object> param) {
        List<Map<String, Object>> rtnLiMap = clssCodeService.getClssCode(param);
        return rtnLiMap;
    }

    /** 계층코드 저장 */
    @PostMapping(value = "/saveclsscode", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveClssCode(@RequestBody List<Map<String, Object>> rows) {
        clssCodeService.saveClssCode(rows);
        return Map.of("ok", true);
    }
}
