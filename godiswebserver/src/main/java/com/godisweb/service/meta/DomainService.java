package com.godisweb.service.meta;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.godisweb.mapper.meta.DomainMapper;

@Service
public class DomainService {
    private final DomainMapper mapper;
    public DomainService(DomainMapper mapper) { this.mapper = mapper; }

    public List<Map<String, Object>> getDomainList(Map<String, Object> param) {
        List<Map<String, Object>> domainList = mapper.getDomainList(param);
        return domainList;
    }

    public boolean checkDomainEngNmDuplicate(Map<String, Object> param) {
        int count = mapper.checkDomainEngNmDuplicate(param);
        return count > 0;
    }

    public int insertDomain(Map<String, Object> param) {
        return mapper.insertDomain(param);
    }

    public int updateDomain(Map<String, Object> param) {
        return mapper.updateDomain(param);
    }

    public int deleteDomain(Map<String, Object> param) {
        return mapper.deleteDomain(param);
    }
}