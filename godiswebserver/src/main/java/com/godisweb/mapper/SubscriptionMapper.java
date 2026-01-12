package com.godisweb.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * MyBatis mapper interface for the Subscription entity. This interface defines
 * the SQL operations that will be performed against the underlying database.
 */
@Mapper
public interface SubscriptionMapper {
    // The SQL for this method is defined in the external XML mapper (SubscriptionMapper.xml)
    List<Map<String, Object>> selectSubscriptions(Map<String, Object> param);
}