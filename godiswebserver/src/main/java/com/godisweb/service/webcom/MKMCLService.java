package com.godisweb.service.webcom;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.godisweb.mapper.MKMCLMapper;
import com.godisweb.mapper.admin.UserMapper;

@Service
public class MKMCLService {
	private final MKMCLMapper mkmclmapper;

	public MKMCLService(MKMCLMapper mapper) {
		this.mkmclmapper = mapper;
	}

	public Map<String, Object> getMkmCL01Holy(Map<String, Object> param) {

	    if (param == null) {
	        throw new IllegalArgumentException("파라미터가 없습니다.");
	    }

	    // C# Dataset → Map<String, Object>
	    Map<String, Object> result = new LinkedHashMap<>();

	    // C# DataTable → List<Map<String, Object>>
	    List<Map<String, Object>> dtHoly = mkmclmapper.selectMKMCL01Holy(param);
	    List<Map<String, Object>> dtStandard = mkmclmapper.selectMKMCL01Stdr(param);

	    // DataSet의 addDataTable → Map.put 으로 대응
	    result.put("dtHoly", dtHoly);
	    result.put("dtStandard", dtStandard);

	    return result;
	}



	@Transactional
	public Map<String, Object> saveHolyDate(List<Map<String, Object>> param) {

	    int ins = 0;
	    int upd = 0;
	    int del=0;

	    Map<String, Object> result = new LinkedHashMap<>();

	    if (param != null) {

	    	 System.out.println("영업일 메인 쿼리시작");
	        // ============================================================
	        // 1. 사전 중복 검사
	        //  기존에 영업일자가 있는지 체크  
	        // ============================================================
	        for (Map<String, Object> row : param) {
	            if (isDuplicate(row)) {

	                String basDd = String.valueOf(row.get("BAS_DD"));

	                // yyyyMMdd → yyyy-MM-dd 형식으로 변환
	                LocalDate date = LocalDate.parse(basDd, DateTimeFormatter.BASIC_ISO_DATE);
	                String formatted = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

	                throw new IllegalArgumentException("기준일자 " + formatted + "는 이미 존재합니다.");
	            }
	        }

	        // ============================================================
	        // 2. 기존 INSERT / UPDATE 로직 그대로 유지
	        // ============================================================
	        for (Map<String, Object> row : param) {

	            if ("I".equals(row.get("ROW_STATE"))) {
	                ins += mkmclmapper.insertHolyDate(row);
	                System.out.println("영업일 메인 insert");

	            } else if ("U".equals(row.get("ROW_STATE"))) {
	                upd += mkmclmapper.updateHolyDate(row);
	                System.out.println("영업일 메인 update");
	            } else if("D".equals(row.get("ROW_STATE"))) {
	            	del+=mkmclmapper.deleteHolyDate(row);
	            	 System.out.println("영업일 메인 delete");
	            }
	        }
	    }

	    // ============================================================
	    // 3. return 값 그대로 보냄
	    // ============================================================
	    result.put("I", ins);
	    result.put("U", upd);
	    result.put("D",del);

	    return result;
	}



	private boolean isDuplicate(Map<String, Object> row) {

	    // 1. INSERT가 아니면 중복 검사할 필요 없음
	    if (!"I".equals(String.valueOf(row.get("ROW_STATE")))) {
	        return false;
	    }

	    // 2. DB 전체 휴일 조회 (param 필요하므로 emptyMap 전달)
	    List<Map<String, Object>> holyList = 
	            mkmclmapper.selectHolyDateAll(Collections.emptyMap());

	    String basDd = String.valueOf(row.get("BAS_DD"));

	    // 3. BAS_DD 기준으로 중복 검사
	    for (Map<String, Object> existing : holyList) {
	        if (basDd.equals(String.valueOf(existing.get("BAS_DD")))) {
	            return true;
	        }
	    }

	    return false;
	}
	
	
	public List<Map<String, Object>> getBizDate(Map<String, Object> param) {
		List<Map<String, Object>> bizDate = mkmclmapper.selectBizDate(param);
		return bizDate;
	}	

	
	@Transactional
	public Map<String, Object> saveBizDate(List<Map<String, Object>> param) {

	    int ins = 0;
	    int upd = 0;
	    int del = 0;

	    Map<String, Object> result = new LinkedHashMap<>();

	    if (param != null) {

	        System.out.println("영업일 저장 쿼리 시작");
	        
	        // ============================================================
	        // 1. 사전 중복 검사
	        //    기존에 기준일자가 있는지 체크
	        // ============================================================
	        for (Map<String, Object> row : param) {
	            // INSERT일 때만 중복 체크
	            if ("I".equals(row.get("ROW_STATE"))) {
	                List<Map<String, Object>> exists = mkmclmapper.selectBizDate(row);
	                
	                if (exists != null && !exists.isEmpty()) {
	                    String basDd = String.valueOf(row.get("BAS_DD"));

	                    // yyyyMMdd → yyyy-MM-dd 형식으로 변환
	                    LocalDate date = LocalDate.parse(basDd, DateTimeFormatter.BASIC_ISO_DATE);
	                    String formatted = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

	                    throw new IllegalArgumentException("기준일자 " + formatted + "는 이미 존재합니다.");
	                }
	            }
	        }

	        // ============================================================
	        // 2. INSERT / UPDATE / DELETE 로직
	        // ============================================================
	        for (Map<String, Object> row : param) {

	            if ("I".equals(row.get("ROW_STATE"))) {
	                ins += mkmclmapper.insertBizDate(row);
	                System.out.println("영업일 insert");

	            } else if ("U".equals(row.get("ROW_STATE"))) {
	                upd += mkmclmapper.updateBizDate(row);
	                System.out.println("영업일 update");
	                
	            }
	        }
	    }

	    // ============================================================
	    // 3. return 값 반환
	    // ============================================================
	    result.put("I", ins);
	    result.put("U", upd);

	    return result;
	}
 
	public List<Map<String, Object>> getHolidayList(Map<String, Object> param) {
		List<Map<String, Object>> bizDate = mkmclmapper.selectHolidayList(param);
		return bizDate;
	}	
	
}
