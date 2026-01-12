package com.godisweb.controller.meta;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.godisweb.service.meta.WordService;

@RestController
@RequestMapping("/api/meta")
@CrossOrigin(origins = "*")
public class WordController {
    private final WordService wordService;
    public WordController(WordService service) { this.wordService = service; }

    @PostMapping("/getWordList")
    public List<Map<String, Object>> getWordList(@RequestBody Map<String, Object> param) {
        List<Map<String, Object>> wordList = wordService.getWordList(param);
        return wordList;
    }

    @PostMapping("/checkWordEngNmDuplicate")
    public Map<String, Object> checkWordEngNmDuplicate(@RequestBody Map<String, Object> param) {
        boolean isDuplicate = wordService.checkWordEngNmDuplicate(param);
        
        Map<String, Object> result = new HashMap<>();
        result.put("isDuplicate", isDuplicate);
        
        return result;
    }

    @PostMapping("/insertWord")
    public Map<String, Object> insertWord(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int insertCount = wordService.insertWord(param);
            result.put("success", true);
            result.put("message", "단어가 등록되었습니다.");
            result.put("count", insertCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "단어 등록 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    @PostMapping("/updateWord")
    public Map<String, Object> updateWord(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int updateCount = wordService.updateWord(param);
            result.put("success", true);
            result.put("message", "단어가 수정되었습니다.");
            result.put("count", updateCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "단어 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }

    @PostMapping("/deleteWord")
    public Map<String, Object> deleteWord(@RequestBody Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();
        try {
            int deleteCount = wordService.deleteWord(param);
            result.put("success", true);
            result.put("message", "단어가 삭제되었습니다.");
            result.put("count", deleteCount);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }
}