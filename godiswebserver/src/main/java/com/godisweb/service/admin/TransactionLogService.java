package com.godisweb.service.admin;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.godisweb.mapper.admin.TransactionLogMapper;

@Service
public class TransactionLogService
{
	private final TransactionLogMapper mapper;
	private static final Logger logger = LoggerFactory.getLogger(TransactionLogService.class);
	
    public TransactionLogService(TransactionLogMapper mapper) {
        this.mapper = mapper;
    }
    
    	
    public List<Map<String, Object>> getActionId(Map<String, Object> param) {
    	return mapper.getActionId(param);
    }
    
    public List<Map<String, Object>> getTransactionLog(Map<String, Object> param) {	
    	return mapper.getTransactionLog(param);
    }
    
}
