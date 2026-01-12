package com.godisweb.controller.admin;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.admin.TransactionLogService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class TransactionLogController {
	
    private TransactionLogService transactionLogService;
    
    public TransactionLogController (TransactionLogService transactionLogService) {
        this.transactionLogService = transactionLogService;
    }
    
    @PostMapping("/getactionid")
    public List<Map<String, Object>> getActionId(@RequestBody Map<String, Object> param)  {
    	
        List<Map<String, Object>> group = transactionLogService.getActionId(param);
        System.out.println("🟢 getActionId result = " + group);

        return group;
    }
    
    @PostMapping("/gettransactionlog")
    public List<Map<String, Object>> getTransactionLog(@RequestBody Map<String, Object> param)  {

    	List<Map<String, Object>> group = transactionLogService.getTransactionLog(param);
    	
    	return group;

    }

}
