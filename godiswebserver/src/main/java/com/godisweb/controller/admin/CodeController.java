package com.godisweb.controller.admin;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.godisweb.service.admin.CodeService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")

public class CodeController {
    private final CodeService codeService;
    public CodeController(CodeService service) { this.codeService = service; }

    @PostMapping("/getgroups")
    public List<Map<String, Object>> getGroups(@RequestBody Map<String, Object> param)
    {
        List<Map<String, Object>> group = codeService.getGroups(param);
        return group;
    }
    
//    @PostMapping("/getcommon")
//    public Map<String, Object> getCommon(@RequestBody Map<String, Object> param)
//    {
//        Map<String, Object> group = codeService.getCommon(param);
//        return group;
//    }

    @PostMapping(value = "/savegroup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveGroup(@RequestBody List<Map<String, Object>> param)
    {
        codeService.saveGroup(param);
        Map<String, Object> map = new HashMap<String, Object>();
        return map;
    }

    @PostMapping("/getcodes")
    public List<Map<String, Object>> getCodes(@RequestBody Map<String, Object> param)
    {
        List<Map<String, Object>> item = codeService.getCodes(param);
        return item;
    }

    @PostMapping(value = "/savecode", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> saveCode(@RequestBody List<Map<String, Object>> param)
    {
        codeService.saveCode(param);
        Map<String, Object> map = new HashMap<String, Object>();
        return map;
    }
}
