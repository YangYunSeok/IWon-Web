package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;


@Mapper
public interface TransactionLogMapper{
    
	List<Map<String, Object>> getActionId(Map<String, Object> param) ;
	
	List<Map<String, Object>> getTransactionLog(Map<String, Object> param) ;

}
