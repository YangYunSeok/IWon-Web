package com.godisweb.controller.admin;

import org.springframework.web.bind.annotation.*;

import com.godisweb.service.admin.MsgCodeService;

import java.util.*;

@RestController
@RequestMapping("/api/message")
@CrossOrigin(origins = "*")
public class MsgCodeController
{

	private final MsgCodeService msgCodeService;
	
	public MsgCodeController(MsgCodeService msgCodeService) {
        this.msgCodeService = msgCodeService;
    }

	/**
	 * 메세지 코드 조회
	 */
	@PostMapping(value = "/getMessageCode") 
	public List<Map<String, Object>> getMessageCode(@RequestBody Map<String, Object> param) {
		List<Map<String, Object>> rtnLiMap = msgCodeService.getMessageCode(param);
        return rtnLiMap;
	}

	/**
	 * 변경된 내용을 저장한다
	 */
	@RequestMapping(value = "/savemessagecode", method = RequestMethod.POST)
	public Map<String, Object> saveMessageCode(@RequestBody List<Map<String, Object>> rows) {
		try {
			msgCodeService.saveMessageCode(rows);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return Map.of("ok", true);
	}
}
