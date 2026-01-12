package com.godisweb.service.meta;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.godisweb.mapper.meta.WordMapper;

@Service
public class WordService {
    private final WordMapper mapper;
    
    public WordService(WordMapper mapper) { 
        this.mapper = mapper; 
    }
    
    public List<Map<String, Object>> getWordList(Map<String, Object> param) {
        return mapper.getWordList(param);
    }
    
    public boolean checkWordEngNmDuplicate(Map<String, Object> param) {
        int count = mapper.checkWordEngNmDuplicate(param);
        return count > 0;
    }
    
    // 단어 사용 여부 확인
    public List<Map<String, Object>> checkWordUsedInTerm(Map<String, Object> param) {
        return mapper.checkWordUsedInTerm(param);
    }
    
    public int insertWord(Map<String, Object> param) {
        return mapper.insertWord(param);
    }
    
    public int updateWord(Map<String, Object> param) {
        return mapper.updateWord(param);
    }
    
    public int deleteWord(Map<String, Object> param) {
        // 삭제 전 사용 여부 확인
        List<Map<String, Object>> usedTerms = mapper.checkWordUsedInTerm(param);
        if (usedTerms != null && !usedTerms.isEmpty()) {
            // 사용 중인 용어가 있으면 예외 발생
            StringBuilder termNames = new StringBuilder();
            for (int i = 0; i < Math.min(usedTerms.size(), 3); i++) {
                if (i > 0) termNames.append(", ");
                termNames.append(usedTerms.get(i).get("TERM_KOR_NM"));
            }
            if (usedTerms.size() > 3) {
                termNames.append(" 외 ").append(usedTerms.size() - 3).append("건");
            }
            
            throw new RuntimeException("해당 단어는 용어에서 사용 중이므로 삭제할 수 없습니다.");
        }
        
        return mapper.deleteWord(param);
    }
}