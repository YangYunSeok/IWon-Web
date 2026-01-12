package com.godisweb.service.admin;

import java.util.*;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.godisweb.mapper.admin.ClssCodeMapper;

@Service
public class ClssCodeService {

    private final ClssCodeMapper mapper;

    public ClssCodeService(ClssCodeMapper mapper) {
        this.mapper = mapper;
    }

    /* =========================================================
     *  그룹 조회/저장 (ASIS 함수명 유지)
     * ========================================================= */

    /** 계층코드 그룹 조회
     */
    public List<Map<String, Object>> getClssCodeGroup(Map<String, Object> param) {
        return mapper.getClssCodeGroup(param);
    }

    /** 계층코드 그룹 저장
     */
    @Transactional
    public void saveClssCodeGroup(List<Map<String, Object>> rows) {
        if (rows == null) return;

        for (Map<String, Object> row : rows) {
            String state = String.valueOf(row.getOrDefault("ROW_STATE", "")).toUpperCase(Locale.ROOT);
            switch (state) {
                case "I":
                    mapper.addClssCodeGroup(row);
                    break;
                case "U":
                    mapper.updateClssCodeGroup(row);
                    break;
                case "D":
                    mapper.removeClssCodeGroup(row);
                    break;
                default:
                    // no-op
            }
        }
    }

    /* =========================================================
     *  코드 조회/저장
     * ========================================================= */

    /**계층코드 목록 조회
     *  파라미터: { GRP_CD_ID } 등
     */
    public List<Map<String, Object>> getClssCode(Map<String, Object> param) {
        return mapper.getClssCode(param);
    }

    /**계층코드 저장
     *  요청 rows 형식: [{...,"ROW_STATE":"I|U|D"}, ...]
     */
    @Transactional
    public void saveClssCode(List<Map<String, Object>> rows) {
        if (rows == null) return;

        for (Map<String, Object> row : rows) {
            String state = String.valueOf(row.getOrDefault("ROW_STATE", "")).toUpperCase(Locale.ROOT);
            switch (state) {
                case "I":
                    // 화면에서 넘겨준 상위 계층코드 Key대체
                    row.put("ORG_CLSS_CD_VAL", ("" + row.get("CLSS_CD_VAL")));
                    Optional<Map<String, Object>> op = rows.stream().filter(r -> r.containsKey("ORG_CLSS_CD_VAL")
                                                                                    && String.valueOf(r.get("ORG_CLSS_CD_VAL")).equals(String.valueOf(row.get("UP_CLSS_CD_VAL"))))
                                                                        .findFirst();
                    if (op.isPresent()) {
                        row.put("UP_CLSS_CD_VAL", op.get().get("CLSS_CD_VAL"));
                    }
                    mapper.insertClssCode(row);
                    break;
                case "U":
                    mapper.updateClssCode(row);
                    break;
                case "D":
                    mapper.removeClssCode(row);
                    break;
                default:
                    // no-op
            }
        }
    }
}
