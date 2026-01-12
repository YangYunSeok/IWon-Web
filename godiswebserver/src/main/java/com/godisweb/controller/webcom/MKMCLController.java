package com.godisweb.controller.webcom;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.godisweb.service.webcom.MKMCLService;

@RestController
@RequestMapping("/api/mkm")
@CrossOrigin
public class MKMCLController {
	
	private final MKMCLService mkmclservice;
	
	public MKMCLController(MKMCLService service) {
		this.mkmclservice = service;
	}
	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName getMKMCL01Holy
	 * @return     Map<String, Object>
	 *             휴일정보를 조회한다.
	 */	

	@PostMapping("/getmkmcl01")
	public Map<String, Object> getMKMCL01Holy(@RequestBody Map<String, Object> param) {
	    return mkmclservice.getMkmCL01Holy(param);
	}

	
	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveHolyDate
	 * @return     Map<String, Object>
	 *             휴일정보 저장 결과(I/U 건수)를 반환한다.
	 */
	@PostMapping(value = "/saveholydate", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveHolyDate(@RequestBody List<Map<String, Object>> param) {
	    return mkmclservice.saveHolyDate(param);
	}


	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName getBizDate
	 * @return     List<Map<String, Object>>
	 *             기준일,영업일을 조회한다.
	 */
	@PostMapping("/getbizdate")
	public List<Map<String, Object>> getBizDate(@RequestBody Map<String, Object> param) {
		List<Map<String, Object>> bizDate = mkmclservice.getBizDate(param);
		return bizDate;
	}	

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName saveBizDate
	 * @return     Map<String, Object>
	 *             영업일 저장 결과(I/U/D 건수)를 반환한다.
	 */
	@PostMapping(value = "/savebizdate", consumes = MediaType.APPLICATION_JSON_VALUE)
	public Map<String, Object> saveBizDate(@RequestBody List<Map<String, Object>> param) {
	    return mkmclservice.saveBizDate(param);
	}

	/**
	 * @author     김진솔
	 * @since      2025. 11. 04
	 * @MethodName getHolidayList
	 * @return     List<Map<String, Object>>
	 *             기준일,영업일을 조회한다.
	 */
	@PostMapping("/getholidaylist")
	public List<Map<String, Object>> getHolidayList(@RequestBody Map<String, Object> param) {
		List<Map<String, Object>> holidaylist = mkmclservice.getHolidayList(param);
		return holidaylist;
	}		


}
