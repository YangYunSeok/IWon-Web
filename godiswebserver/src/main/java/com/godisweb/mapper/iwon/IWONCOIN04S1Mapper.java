package com.godisweb.mapper.iwon;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface IWONCOIN04S1Mapper {

    List<Map<String, Object>> selectTransactions(Map<String, Object> params);

    int countTransactions(Map<String, Object> params);
}
