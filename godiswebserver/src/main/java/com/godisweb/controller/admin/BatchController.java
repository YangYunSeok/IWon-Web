package com.godisweb.controller.admin;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.godisweb.service.admin.BatchService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }
 
    @PostMapping("/getbatchgroup")
    public List<Map<String, Object>> getBatchGroup(@RequestBody Map<String, Object> param)
    {
    	List<Map<String, Object>> group = batchService.getBatchGroup(param);
        return group;
    }

    @PostMapping(value = "/savebatchgroup", consumes = MediaType.APPLICATION_JSON_VALUE)
    public int saveBatchGroup(@RequestBody Map<String, Object> param) {
        // @SuppressWarnings("unchecked")
        batchService.saveBatchGroup(param);
        return 1;
    }

    @PostMapping("/getbatchflow")
    public Map<String, Object> getBatchFlow(@RequestBody Map<String, Object> param)
    {
        return batchService.getBatchFlow(param);
    }

    @PostMapping("/savebatchflow")
    public int saveBatchFlow(@RequestBody Map<String, Object> param)
    {
        batchService.saveBatchFlow(param);
        return 1;
    }

    @PostMapping("/getfilemaps")
    public List<Map<String, Object>> getFileMaps(@RequestBody Map<String, Object> param)
    {
        return batchService.getFileMaps(param);
    }

    @PostMapping("/getstoredprocs")
    public List<Map<String, Object>> getStoredProcs(@RequestBody Map<String, Object> param)
    {
        return batchService.getStoredProcs(param);
    }
}
