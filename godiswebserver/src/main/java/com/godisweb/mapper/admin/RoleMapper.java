package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RoleMapper
{
	List<Map<String, Object>> selectRoles(Map<String, Object> param);
	List<Map<String, Object>> selectBtnList(Map<String, Object> param);
	List<Map<String, Object>> selectMenuButnAuth(Map<String, Object> param);
	List<Map<String, Object>> selectMenuList(Map<String, Object> param);
	List<Map<String, Object>> selectProgmButnMappList(Map<String, Object> param);
	List<Map<String, Object>> selectUsrRoleMapp(Map<String, Object> param);

    void addRoleMenuButn(Map<String, String> row);
    int getRoleMenuButn(Map<String, String> row);
    int insertRoleMenuBtn(Map<String, String> param);
    int deleteRoleMenuBtn(Map<String, String> param);

    int insertRole(Map<String, String> param);
    int updateRole(Map<String, String> param);
    int removeRoleAllBtnAuth(Map<String, String> param);
    int removeRoleMenuAuth(Map<String, String> param);
    int removeRoleDefin(Map<String, String> param);
}