package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.BatMntrService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class BatMntrController {

    private final BatMntrService batMntrService;

    public BatMntrController(BatMntrService batMntrService) {

        this.batMntrService = batMntrService;
        
    }

    @PostMapping("/getbatchgroups")
    public List<Map<String, Object>> getBatchMonitorDt(@RequestBody Map<String, Object> param) {

		List<Map<String, Object>> group = batMntrService.getBatchMonitorDt(param);

        return group;
    }
    /** 배치모니터링목록을 조회 **/
    @PostMapping("/getexcpdtllog")
    public Map<String, Object> getExcpDtlLog(@RequestBody Map<String, Object> param) {
    
        return batMntrService.getExcpDtlLog(param);

    }
    
    /**
     * 배치모니터링 상세 팝업 목록 조회
     * (상세 리스트형 조회)
     */
    @PostMapping("/getexcpdtlloglist")
    public List<Map<String, Object>> getExcpDtlLogList(@RequestBody Map<String, Object> param) {
        return batMntrService.getExcpDtlLogList(param);
    }
}

    

