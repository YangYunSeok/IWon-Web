package com.godisweb.service.meta;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.godisweb.mapper.meta.TermMapper;
import com.godisweb.mapper.meta.WordMapper;
//import com.godisweb.mapper.meta.DomainMapper;

@Service
public class TermService {
    private final TermMapper termMapper;
    //private final DomainMapper domainMapper;
    
    public TermService(TermMapper termMapper, WordMapper wordMapper
    		//, DomainMapper domainMapper
    		) {
        this.termMapper = termMapper;
        //this.domainMapper = domainMapper;
    }

    public List<Map<String, Object>> getTermList(Map<String, Object> param) {
        return termMapper.getTermList(param);
    }

    public Map<String, Object> getTermDetail(Map<String, Object> param) {
        Map<String, Object> termDetail = termMapper.getTermDetail(param);
        
        // 용어를 구성하는 단어 목록 조회
        List<Map<String, Object>> wordList = termMapper.getTermWordList(param);
        
        // 단어 목록이 비어있거나 불완전한 경우, 용어영문명으로 재구성
        if (wordList == null || wordList.isEmpty()) {
            String termEngNm = (String) termDetail.get("TERM_ENG_NM");
            if (termEngNm != null && !termEngNm.isEmpty()) {
                wordList = reconstructWordListFromEngNm(termEngNm);
            }
        }
        
        termDetail.put("WORD_LIST", wordList);
        
        return termDetail;
    }

    /**
     * 용어영문명으로부터 단어 목록 재구성
     */
    private List<Map<String, Object>> reconstructWordListFromEngNm(String termEngNm) {
        List<Map<String, Object>> wordList = new ArrayList<>();
        
        // 용어영문명을 _로 분리
        String[] engWords = termEngNm.split("_");
        
        for (int i = 0; i < engWords.length; i++) {
            String engWord = engWords[i];
            boolean isLastWord = (i == engWords.length - 1);
            
            // 마지막 단어는 GW, 나머지는 BW
            String wordSecCd = isLastWord ? "GW" : "BW";
            
            Map<String, Object> searchParam = new HashMap<>();
            searchParam.put("WORD_ENG_NM", engWord);
            searchParam.put("WORD_SEC_CD", wordSecCd);
            
            Map<String, Object> word = termMapper.getWordByEngNm(searchParam);
            
            if (word != null) {
                wordList.add(word);
            } else {
                // 단어를 찾지 못한 경우 - 빈 단어 정보 생성
                Map<String, Object> emptyWord = new HashMap<>();
                emptyWord.put("WORD_ENG_NM", engWord);
                emptyWord.put("WORD_SEC_CD", wordSecCd);
                emptyWord.put("WORD_KOR_NM", "");
                emptyWord.put("WORD_EXISTS", false);
                wordList.add(emptyWord);
            }
        }
        
        return wordList;
    }

    /**
     * 용어 추천: 용어명을 여러 방식으로 분해하여 추천 목록 반환
     */
    public List<Map<String, Object>> suggestTermWords(Map<String, Object> param) {
        String termKorNm = (String) param.get("TERM_KOR_NM");
        
        // 용어를 분해한 여러 조합 생성
        List<Map<String, Object>> suggestions = generateTermCombinations(termKorNm);
        
        return suggestions;
    }

    /**
     * 용어를 여러 방식으로 분해하여 조합 생성
     */
    private List<Map<String, Object>> generateTermCombinations(String termKorNm) {
        List<Map<String, Object>> combinations = new ArrayList<>();
        
        // 모든 등록된 단어 목록 조회
        List<Map<String, Object>> allWords = termMapper.getAllWords();
        
        // 모든 등록된 한글 단어명 집합 생성 (분해 로직에서는 WORD_SEC_CD는 무시)
        Set<String> wordKorSet = new HashSet<>();
        for (Map<String, Object> word : allWords) {
            Object korNmObj = word.get("WORD_KOR_NM");
            if (korNmObj instanceof String) {
                String korNm = (String) korNmObj;
                if (korNm != null && !korNm.isEmpty()) {
                    wordKorSet.add(korNm);
                }
            }
        }
        
        // 새 분해 규칙으로 텍스트 조합 생성
        List<List<String>> splitCombinations = splitTermByDictionary(termKorNm, wordKorSet);
        
        // 각 조합을 추천 항목으로 변환
        for (List<String> segments : splitCombinations) {
            Map<String, Object> suggestion = new HashMap<>();
            
            // 조합된 단어명은 원본 용어와 동일 (segments를 합치면 termKorNm과 같아야 함)
            suggestion.put("TERM_COMBINATION", termKorNm);
            
            // 세그먼트를 실제 단어 정보(등록/미등록, BW/GW 등)로 변환
            List<Map<String, Object>> wordList = buildWordListFromSegments(segments, allWords);
            suggestion.put("WORD_LIST", wordList);
            
            combinations.add(suggestion);
        }
        
        return combinations;
    }
    
    /**
     * 사전에 등록된 단어 집합을 기준으로 용어를 분해한다.
     * - 시작 위치에 등록 단어가 있으면 그 단어 단위로 분기
     * - 시작 위치에 등록 단어가 없으면, 다음 등록 단어 시작 전까지(또는 끝까지)를
     *   하나의 미등록 단어로 묶는다.
     */
    private List<List<String>> splitTermByDictionary(String termKorNm, Set<String> wordKorSet) {
        Map<Integer, List<List<String>>> memo = new HashMap<>();
        return splitFromIndex(termKorNm, 0, wordKorSet, memo);
    }
    
    private List<List<String>> splitFromIndex(String text, int start, Set<String> wordKorSet,
                                             Map<Integer, List<List<String>>> memo) {
        int len = text.length();
        
        if (start == len) {
            List<List<String>> base = new ArrayList<>();
            base.add(new ArrayList<>());
            return base;
        }
        
        if (memo.containsKey(start)) {
            return memo.get(start);
        }
        
        List<List<String>> results = new ArrayList<>();
        
        // 1) 현재 위치에서 시작하는 등록 단어 찾기
        List<String> dictWordsAtStart = findDictWordsAt(text, start, wordKorSet);
        
        if (!dictWordsAtStart.isEmpty()) {
            // 등록 단어가 있으면, 그 단어 단위로만 분기 (미등록 단어로 한 글자씩 쪼개지 않음)
            for (String word : dictWordsAtStart) {
                int nextStart = start + word.length();
                List<List<String>> tails = splitFromIndex(text, nextStart, wordKorSet, memo);
                for (List<String> tail : tails) {
                    List<String> combination = new ArrayList<>();
                    combination.add(word);
                    combination.addAll(tail);
                    results.add(combination);
                }
            }
        } else {
            // 2) 현재 위치에서 시작하는 등록 단어가 없으면,
            //    다음 등록 단어 시작 전까지를 하나의 미등록 단어로 묶는다.
            int nextDictPos = findNextDictionaryStart(text, start, wordKorSet);
            int endOfUnmatched = (nextDictPos == -1) ? len : nextDictPos;
            
            // 안전장치: 최소 한 글자는 진행되도록 보장
            if (endOfUnmatched <= start) {
                endOfUnmatched = Math.min(start + 1, len);
            }
            
            String unmatched = text.substring(start, endOfUnmatched);
            List<List<String>> tails = splitFromIndex(text, endOfUnmatched, wordKorSet, memo);
            
            if (tails.isEmpty()) {
                List<String> combination = new ArrayList<>();
                combination.add(unmatched);
                results.add(combination);
            } else {
                for (List<String> tail : tails) {
                    List<String> combination = new ArrayList<>();
                    combination.add(unmatched);
                    combination.addAll(tail);
                    results.add(combination);
                }
            }
        }
        
        memo.put(start, results);
        return results;
    }
    
    /**
     * text의 start 위치에서 시작하는 사전 등록 단어 목록 조회
     */
    private List<String> findDictWordsAt(String text, int start, Set<String> wordKorSet) {
        List<String> result = new ArrayList<>();
        int len = text.length();
        
        for (String dictWord : wordKorSet) {
            int wLen = dictWord.length();
            if (wLen <= 0 || start + wLen > len) {
                continue;
            }
            if (text.startsWith(dictWord, start)) {
                result.add(dictWord);
            }
        }
        
        return result;
    }
    
    /**
     * text의 start 이후에서 처음으로 사전 등록 단어가 시작되는 인덱스 조회
     * 없으면 -1 반환
     */
    private int findNextDictionaryStart(String text, int start, Set<String> wordKorSet) {
        int len = text.length();
        
        for (int i = start + 1; i < len; i++) {
            int remaining = len - i;
            for (String dictWord : wordKorSet) {
                int wLen = dictWord.length();
                if (wLen <= 0 || wLen > remaining) {
                    continue;
                }
                if (text.startsWith(dictWord, i)) {
                    return i;
                }
            }
        }
        
        return -1;
    }
    
    /**
     * 분해된 세그먼트 문자열 목록을 실제 WORD_LIST 구조로 변환
     * - 마지막 세그먼트는 GW, 나머지는 BW로 WORD_SEC_CD 설정
     * - 사전에 등록된 단어가 있으면 WORD_EXISTS=true, 없으면 미등록 단어로 생성
     */
    private List<Map<String, Object>> buildWordListFromSegments(List<String> segments, List<Map<String, Object>> allWords) {
        List<Map<String, Object>> wordList = new ArrayList<>();
        int size = segments.size();
        
        for (int i = 0; i < size; i++) {
            String segment = segments.get(i);
            boolean isLast = (i == size - 1);
            Map<String, Object> wordInfo = buildWordInfo(segment, isLast, allWords);
            wordList.add(wordInfo);
        }
        
        return wordList;
    }
    
    /**
     * 세그먼트 하나에 대한 단어 정보 생성
     * - 사전에서 WORD_KOR_NM 기준으로만 매칭 (BW/GW 구분 없이)
     * - 매칭 실패 시 미등록 단어로 생성 (위치는 BW/GW 기본값만 부여)
     */
    private Map<String, Object> buildWordInfo(String wordKorNm, boolean isLastWord, List<Map<String, Object>> allWords) {
        List<Map<String, Object>> candidates = new ArrayList<>();
        for (Map<String, Object> word : allWords) {
            Object korObj = word.get("WORD_KOR_NM");
            
            if (wordKorNm.equals(korObj)) {
                candidates.add(word);
            }
        }
        
        if (!candidates.isEmpty()) {
            Map<String, Object> base = new HashMap<>(candidates.get(0));
            base.put("WORD_EXISTS", true);
            
            boolean hasHomonym = candidates.size() > 1;
            base.put("HAS_HOMONYM", hasHomonym);
            
            return base;
        }
        
        // 사전에 없는 경우 미등록 단어 생성
        String defaultWordSecCd = isLastWord ? "GW" : "BW";
        
        Map<String, Object> unregisteredWord = new HashMap<>();
        unregisteredWord.put("WORD_KOR_NM", wordKorNm);
        unregisteredWord.put("WORD_ENG_NM", "");
        unregisteredWord.put("WORD_SEC_CD", defaultWordSecCd);
        unregisteredWord.put("WORD_EXISTS", false);
        unregisteredWord.put("HAS_HOMONYM", false);
        
        return unregisteredWord;
    }

    /**
     * 동음이의어 목록 조회
     */
    public List<Map<String, Object>> getHomonymWords(Map<String, Object> param) {
        return termMapper.getHomonymWords(param);
    }

    public List<Map<String, Object>> getDomainList(Map<String, Object> param) {
        return termMapper.getDomainList(param);
    }

    public Map<String, Object> getDomainDetail(Map<String, Object> param) {
        return termMapper.getDomainDetail(param);
    }


    public boolean checkTermEngNmDuplicate(Map<String, Object> param) {
        int count = termMapper.checkTermEngNmDuplicate(param);
        return count > 0;
    }

    public int insertTerm(Map<String, Object> param) throws Exception {
        // 1. 용어영문명 중복 체크
        if (checkTermEngNmDuplicate(param)) {
            throw new RuntimeException("이미 존재하는 용어영문명입니다.");
        }
        
        // 2. 용어영문명 유효성 체크 (단어 조합 확인)
        validateTermEngNmWithWords(param);
        
        // 3. 단어 구성 체크 (기본단어 + 분류단어)
        validateWordComposition(param);
        
        // 마지막 용어번호 조회
        int lastNo = termMapper.getLastTermNo();
        param.put("TERM_NO", lastNo);
        // 용어 등록
        int result = termMapper.insertTerm(param);
        
        // 용어-단어 매핑 등록
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wordList = (List<Map<String, Object>>) param.get("WORD_LIST");
        if (wordList != null && !wordList.isEmpty()) {
            for (int i = 0; i < wordList.size(); i++) {
                Map<String, Object> word = wordList.get(i);
                Map<String, Object> mappingParam = new HashMap<>();
                mappingParam.put("TERM_NO", lastNo);
                mappingParam.put("WORD_NO", word.get("WORD_NO"));
                mappingParam.put("SORT_ORD", i + 1);
                termMapper.insertTermWordMapping(mappingParam);
            }
        }
        
        return result;
    }

    public int updateTerm(Map<String, Object> param) throws Exception {
        // 1. 용어영문명 중복 체크 (자기 자신 제외)
        Map<String, Object> dupCheckParam = new HashMap<>();
        dupCheckParam.put("TERM_ENG_NM", param.get("TERM_ENG_NM"));
        dupCheckParam.put("TERM_NO", param.get("TERM_NO"));
        
        int dupCount = termMapper.checkTermEngNmDuplicateExceptSelf(dupCheckParam);
        if (dupCount > 0) {
            throw new RuntimeException("이미 존재하는 용어영문명입니다.");
        }
        
        // 2. 용어영문명 유효성 체크 (단어 조합 확인)
        validateTermEngNmWithWords(param);
        
        // 3. 단어 구성 체크 (기본단어 + 분류단어)
        validateWordComposition(param);
        
        // 기존 용어-단어 매핑 삭제
        termMapper.deleteTermWordMapping(param);
        
        // 용어 수정
        int result = termMapper.updateTerm(param);
        
        // 새로운 용어-단어 매핑 등록
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wordList = (List<Map<String, Object>>) param.get("WORD_LIST");
        if (wordList != null && !wordList.isEmpty()) {
            for (int i = 0; i < wordList.size(); i++) {
                Map<String, Object> word = wordList.get(i);
                Map<String, Object> mappingParam = new HashMap<>();
                mappingParam.put("TERM_NO", param.get("TERM_NO"));
                mappingParam.put("WORD_NO", word.get("WORD_NO"));
                mappingParam.put("SORT_ORD", i + 1);
                termMapper.insertTermWordMapping(mappingParam);
            }
        }
        
        return result;
    }

    public int deleteTerm(Map<String, Object> param) {
        // 용어-단어 매핑 삭제
        termMapper.deleteTermWordMapping(param);
        
        // 용어 삭제
        return termMapper.deleteTerm(param);
    }
    
    /**
     * 용어영문명과 단어 조합 유효성 검증
     */
    private void validateTermEngNmWithWords(Map<String, Object> param) {
        String termEngNm = (String) param.get("TERM_ENG_NM");
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wordList = (List<Map<String, Object>>) param.get("WORD_LIST");
        
        if (termEngNm == null || termEngNm.isEmpty()) {
            throw new RuntimeException("용어영문명이 없습니다.");
        }
        
        if (wordList == null || wordList.isEmpty()) {
            throw new RuntimeException("단어 구성 정보가 없습니다.");
        }
        
        // 용어영문명을 _로 분리
        String[] engWords = termEngNm.split("_");
        
        // 단어 개수 일치 확인
        if (engWords.length != wordList.size()) {
            throw new RuntimeException("용어영문명과 단어 구성이 일치하지 않습니다.");
        }
        
        // 각 단어의 영문명 일치 확인
        for (int i = 0; i < engWords.length; i++) {
            String engWord = engWords[i];
            String wordEngNm = (String) wordList.get(i).get("WORD_ENG_NM");
            
            if (!engWord.equals(wordEngNm)) {
                throw new RuntimeException("용어영문명과 단어 영문명이 일치하지 않습니다. (위치: " + (i+1) + ")");
            }
        }
        
        // 각 단어가 실제 등록된 단어인지 확인
        for (int i = 0; i < wordList.size(); i++) {
            Map<String, Object> word = wordList.get(i);
            Object wordNo = word.get("WORD_NO");
            
            if (wordNo == null) {
                throw new RuntimeException("등록되지 않은 단어가 포함되어 있습니다. (위치: " + (i+1) + ")");
            }
            
            // DB에서 해당 단어 정보 조회하여 검증
            Map<String, Object> dbWord = termMapper.getWordByNo(word);
            if (dbWord == null) {
                throw new RuntimeException("유효하지 않은 단어가 포함되어 있습니다. (위치: " + (i+1) + ")");
            }
        }
    }

    /**
     * 단어 구성 검증
     * - 마지막 단어는 반드시 분류단어(GW)여야 함
     *   (마지막이 아닌 위치에는 BW/GW 어떤 단어든 올 수 있음)
     */
    private void validateWordComposition(Map<String, Object> param) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wordList = (List<Map<String, Object>>) param.get("WORD_LIST");
        
        if (wordList == null || wordList.isEmpty()) {
            throw new RuntimeException("단어 구성 정보가 없습니다.");
        }
        
        // 마지막 단어는 분류단어(GW)여야 함
        Map<String, Object> lastWord = wordList.get(wordList.size() - 1);
        String lastWordSecCd = (String) lastWord.get("WORD_SEC_CD");
        
        if (!"GW".equals(lastWordSecCd)) {
            throw new RuntimeException("마지막 단어는 분류단어(GW)여야 합니다.");
        }
    }
}