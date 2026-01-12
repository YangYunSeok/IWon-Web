package com.godisweb.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface PushMsgMapper {

    int countPushList(@Param("username") String username);
    List<Map<String, Object>> selectPushMsgs(@Param("username") String username,
                                             @Param("offset") int offset,
                                             @Param("size") int size);
    void insertPushMsg(Map<String, Object> notification);
}
