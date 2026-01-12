package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserConnectStatusMapper {

    List<Map<String, Object>> getUserConnectStatus(Map<String, Object> param);

    List<Map<String, Object>> getUserConnectDetail(Map<String, Object> param);

    List<Map<String, Object>> getUserConnectStatusDetail(Map<String, Object> param);

    List<Map<String, Object>> getUserGroupPopup(Map<String, Object> param);
}
