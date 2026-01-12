package com.godisweb.mapper.admin;

import java.util.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MessageMapper {

	@Select("""
	        SELECT 
	            MSG_ID AS msgId,
	            MSG_CLSS_CD AS msgClssCd,
	            MSG_KOR_CONTN AS msgKorContn,
	            MSG_ENG_CONTN AS msgEngContn,
	            MSG_BUTN_CD AS msgButnCd,
	            MSG_TP_CD AS msgTpCd
	        FROM GPCL_MSG_CD
	        """)
	List<Map<String, Object>> selectAllMessages();
	
	@Select("""
		    SELECT MSG_ID AS msgId,
		           MSG_CLSS_CD AS msgClssCd,
		           MSG_KOR_CONTN AS msgKorContn,
		           MSG_ENG_CONTN AS msgEngContn,
		           MSG_BUTN_CD AS msgButnCd,
		           MSG_TP_CD AS msgTpCd
		    FROM GPCL_MSG_CD
		    WHERE MSG_ID = #{msgId}
		""")
	Map<String, Object> selectMessage(String msgId);
}
