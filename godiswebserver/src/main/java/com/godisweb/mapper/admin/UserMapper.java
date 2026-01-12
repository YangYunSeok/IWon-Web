package com.godisweb.mapper.admin;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
	List<Map<String, Object>> selectUserGroups(Map<String, Object> param);

	int insertGroupInfo(Map<String, Object> row);

	int updateGroupInfo(Map<String, Object> row);

	int deleteGroupinfo(Map<String, Object> row);

	List<Map<String, Object>> selectUser(Map<String, Object> param);

	int insertUserInfo(Map<String, Object> row);

	int insertUserLogin(Map<String, Object> row);

	int updateUserInfo(Map<String, Object> row);

	int updateUserLogin(Map<String, Object> row);

	int deleteUserInfo(Map<String, Object> row);

	int deleteUserLogin(Map<String, Object> row);

	int updateUserPw(Map<String, Object> row);

	/**
	 * 사용자 ID로 사용자 정보 조회
	 */
	Map<String, Object> selectUserById(String userId);

	/**
	 * 사용자 ID 개수 조회 (중복 체크용, 대소문자 구분 없이)
	 */
	int countUserById(String userId);
}