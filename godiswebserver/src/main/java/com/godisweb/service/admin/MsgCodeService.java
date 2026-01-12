package com.godisweb.service.admin;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.godisweb.mapper.admin.MsgCodeMapper;

@Service
public class MsgCodeService {
    private final MsgCodeMapper mapper;

    public MsgCodeService(MsgCodeMapper mapper) {
        this.mapper = mapper;
    } 
    
    public List<Map<String, Object>> getMessageCode(Map<String, Object> param) {
		return mapper.getMessageCode(param);
	}

	/**
	 * 변경된 내용을 저장한다
	 */
    @Transactional
    public void saveMessageCode(List<Map<String, Object>> rows) throws Exception{
		if (rows == null) return;

        for (Map<String, Object> row : rows) {
            
            int iPkCnt = mapper.getPkCnt(row);
            String row_state = String.valueOf(row.getOrDefault("ROW_STATE", "")).toUpperCase(Locale.ROOT);

            if ("I".equals(row_state)) {
                // 메세지코드(PK) 중복체크
                if(iPkCnt > 0) {
                    //throw new GpclBizException("MGW00023", new String[] { "메세지코드" });
                    throw new Exception();
                }
                
                // 최초 신규 등록인 경우 데이터 생성
                mapper.addMessageCode(row);
            } else if ("U".equals(row_state)) {
                // 삭제할 경우 데이터가 삭제되지 않고 활성화여부만 비활성화로 변경
                mapper.updateMessageCode(row);
            } // END UPDATEFLAG
            else if ("D".equals(row_state)) {
                // 삭제할 경우 데이터가 삭제되지 않고 활성화여부만 비활성화로 변경
                mapper.removeMessageCode(row);
            }
        }
        // if (addCnt > 0 || updateCnt > 0)
        // {
            // 등록된 캐시 삭제.
            //GpclCache.clear(CacheCodeConstants.MESSAGE_CODE_LIST);
        // }

        // Map<String, Object> result = new LinkedHashMap<String, Object>();

        // result.put("I", addCnt);
        // result.put("U", updateCnt);
        // result.put("D", removeCnt);

        // return result;
		// else {
		// 	throw new Exception(null);
		// }

    }
}
