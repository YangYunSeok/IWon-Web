package com.godisweb.service.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.helper.Utils;

import com.godisweb.mapper.admin.BatchMapper;

@Service
public class BatchService {

    private final BatchMapper mapper;
    public BatchService(BatchMapper mapper) { this.mapper = mapper; }
    

    public List<Map<String, Object>> getBatchGroup(Map<String, Object> param)
    {
        return mapper.selectBatchGroups(param);
    }
    public Map<String, Object> getBatchFlow(Map<String, Object> param)
    {
        return mapper.selectBatchFlow(param);
    }
    public List<Map<String, Object>> getFileMaps(Map<String, Object> param)
    {
        return mapper.selectFileMaps(param);
    }
    public List<Map<String, Object>> getStoredProcs(Map<String, Object> param)
    {
    	return mapper.selectStoredProc(param);
    }

    @Transactional
    public int saveBatchGroup(Map<String, Object> rows)
    {
        int ins=0, upd=0, del=0;
        if (rows != null)
        {
//            List<BatchDto.BatchGroup> insRows = Utils.toList(rows.get("inserts"), Map<String, Object>.class);
//            for(BatchDto.BatchGroup row : insRows)
//            {
//                mapper.insertBatchGroup(row);
//            }
//            List<BatchDto.BatchGroup> updRows = Utils.toList(rows.get("updates"), BatchDto.BatchGroup.class);
//            for(BatchDto.BatchGroup row : updRows)
//            {
//                mapper.updateBatchGroup(row);
//            }
//            List<BatchDto.BatchGroup> delRows = Utils.toList(rows.get("deletes"), BatchDto.BatchGroup.class);
//            for(BatchDto.BatchGroup row : delRows)
//            {
//                int iRowCnt = mapper.selectChildCnt(row.TASK_GRP_ID);
//                if (iRowCnt == 0)
//                {
//                    mapper.deleteBatchGroup(row);
//                }
//            }
        }

        return 1;
    }

    @Transactional
    public int saveBatchFlow(Map<String, Object> data)
    {
        if (data != null)
        {
            mapper.updateBatchFlow(data);
            mapper.updateExecConnTask(data);
            String strXml = data.get("GRP_XML_CONTN").toString();
            
            Gson gson = new Gson();
            Map<String, Object> xml = gson.fromJson(strXml, Map.class);
            List<Map<String, Object>> nodes = (List<Map<String, Object>>) xml.get("nodes");
            List<Map<String, Object>> edges = (List<Map<String, Object>>) xml.get("edges");
             
            for (Map<String, Object> node : nodes)
            {
            	if (node.get("meta") == null)
            	{
            		Map<String, Object> meta = new HashMap<String, Object>();
            		meta.put("kind"       , "START");
            		node.put("meta"       , meta);
            	}
            	           	
            	Map<String, Object> meta = (Map<String, Object>)node.get("meta");
				meta.put("TASK_ORD_NO", nodes.indexOf(node));
    			if ("GROUP".equals(meta.get("kind")))
    			{
    				meta.put("TASK_ID", meta.get("TASK_GRP_ID"));
    				meta.put("EXECUTE_TASK_TP_CD" , "02");
    			}
    			else if ("FILE".equals(meta.get("kind")))
    			{
    				meta.put("TASK_ID", meta.get("MAP_INFO_ID"));
    				meta.put("EXECUTE_TASK_TP_CD" , "01");
    			}
    			else if ("PROC".equals(meta.get("kind")))
    			{
    				meta.put("TASK_ID", meta.get("PROC_ID"));
    				meta.put("EXECUTE_TASK_TP_CD" , "01"); 
    			}
    			else
    			{    				
    				meta.put("TASK_ID"            , "0");
    				meta.put("EXECUTE_TASK_TP_CD" , "01");
    			}            	
            	
                List<Map<String, Object>> results = edges.stream()
                                                    .filter(m -> node.get("id").equals(m.get("from")))
                                                    .collect(Collectors.toList());
                if (results == null || results.size() == 0)
                {
                    Map<String, Object> row = new HashMap<String, Object>();
            		row.put("TASK_ORD_NO"      , meta.get("TASK_ORD_NO"));
            		row.put("FOLLW_TASK_ORD_NO", -1);
            		row.put("TASK_GRP_ID"      , data.get("TASK_GRP_ID"));
            		row.put("TASK_ID"          , meta.get("TASK_ID"));
            		row.put("TASK_LVL"         , meta.get("TASK_ORD_NO"));            		
                    mapper.insertExecConnTask(row);
                }
                else
                {
                    for (Map<String, Object> edge : results)
                    {
                    	Map<String, Object> child = nodes.stream()
                     	                            .filter(m -> edge.get("to").equals(m.get("id")))
                                                    .findFirst().orElse(null);                	
                    	
                    	if (child == null)
                    	{
                    		break;
                    	}
                    	
                        Map<String, Object> row = new HashMap<String, Object>();
                		row.put("TASK_ORD_NO"      , meta.get("TASK_ORD_NO"));
                		row.put("FOLLW_TASK_ORD_NO", nodes.indexOf(child));
                		row.put("TASK_GRP_ID"      , data.get("TASK_GRP_ID"));
                		row.put("TASK_ID"          , meta.get("TASK_ID"));
                		row.put("TASK_LVL"         , meta.get("TASK_ORD_NO"));

                		if (child.get("meta") != null)
                		{
                			Map<String, Object> meta2 = (Map<String, Object>)child.get("meta");
                			if ("GROUP".equals(meta2.get("kind")))
                			{
                           		row.put("FOLLW_TASK_ID", meta2.get("TASK_GRP_ID"));
                			}
                			else if ("FILE".equals(meta2.get("kind")))
                			{
                           		row.put("FOLLW_TASK_ID", meta2.get("MAP_INFO_ID"));    
                			}
                			else if ("PROC".equals(meta2.get("kind")))
                			{
                           		row.put("FOLLW_TASK_ID", meta2.get("PROC_ID"));
                			}
                		}

                        mapper.insertExecConnTask(row);
                    }
                }

            }
        }

        return 1;
    }
}