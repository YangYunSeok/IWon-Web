package com.godisweb.service.iwon;

import com.godisweb.mapper.iwon.EmployeeWalletMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmployeeWalletService {

    private final EmployeeWalletMapper employeeWalletMapper;

    public EmployeeWalletService(EmployeeWalletMapper employeeWalletMapper) {
        this.employeeWalletMapper = employeeWalletMapper;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWalletList(Map<String, Object> params) {
        return employeeWalletMapper.selectWalletList(params);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWalletDetail(String id) {
        return employeeWalletMapper.selectWalletDetail(id);
    }

    @Transactional
    public Map<String, Object> updateWallet(String id, Map<String, Object> body) {
        int updated = employeeWalletMapper.updateWallet(id, body);
        Map<String, Object> result = new HashMap<>();
        result.put("success", updated > 0);
        result.put("count", updated);
        return result;
    }
}
