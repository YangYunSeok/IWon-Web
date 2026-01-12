package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RoleGrantMapper
{
    List<Map<String, Object>> getUserGroup();

    List<Map<String, Object>> getRoleDefinition(Map<String, Object> param);

    List<Map<String, Object>> getUser(Map<String, Object> param);

    List<Map<String, Object>> getUserRoleMappingData(String usrId);

    int addUserRoleMapping(List<Map<String, Object>> list);
    
    int removeUserRoleMapping(List<Map<String, Object>> list);
    
}