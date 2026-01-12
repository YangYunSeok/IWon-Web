import React, { useEffect, useState } from 'react';
import { Stack, Box, Button } from '@mui/material';
import dayjs from 'dayjs';
import GSelectBox from '@/components/GSelectBox';
import GButton from '@/components/GButton';
import GDataGrid from '@/components/GDataGrid.jsx';
import GSimpleTreeGrid from '@/components/GSimpleTreeGrid';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GTitleIcon from '@/components/GTitleIcon';
import GDatePicker from '@/components/GDatePicker';
import { http } from '@/libs/TaskHttp';
import { changes } from '@/libs/Utils';
import { useAuth } from '@/context/AuthContext.jsx';
import { cacheCode } from '@/libs/DataUtils';
import GMessageBox from '@/components/GMessageBox';
import GPageContainer from '@/components/GPageContainer';
import GDetailTitle from '@/components/GDetailTitle';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRUS01S1() {
	const { user } = useAuth();
	// ==============================================================
	//                        변수 정의
	// ==============================================================
	const [groups, setGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [loadingGroups, setLoadingGroups] = useState(false);

	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [loadingUsers, setLoadingUsers] = useState(false);

	const [savingGroup, setSavingGroup] = useState(false);
	const [savingUser, setSavingUser] = useState(false);
	const [hasGroupChanges, setHasGroupChanges] = useState(false);
	const [hasUserChanges, setHasUserChanges] = useState(false);
	const [nextGroupId, setNextGroupId] = useState(1);

	// 사용자상태 코드 목록
	const [lstUsrStatCd, setLstUsrStatCd] = useState([]);

	// ==============================================================
	//                        데이터 조회 처리
	// ==============================================================
	useEffect(() => {
		(async () => {
			const params = ["USR_STAT_CD"];
			const result = await cacheCode(params);
			setLstUsrStatCd(result?.USR_STAT_CD || []);
		})();
	}, []);

	// 수정: lstUsrStatCd 의존성 제거, 컴포넌트 마운트 시 바로 실행
	useEffect(() => {
		getGroups();
	}, []);

	const getGroups = async () => {
		try {
			setLoadingGroups(true);
			const param = {};
			const { table } = await http.post('/admin/getusergroups', param, { shape: 'datatable', showSpinner: true });

			const mapped = table.map((g, idx) => ({
				id: g.USR_GRP_ID || String(idx),
				...g,
				UP_USR_GRP_ID: g.UP_USR_GRP_ID || null
			}));

			setGroups(mapped);

			const maxId = mapped.reduce((max, group) => {
				const match = group.USR_GRP_ID?.match(/^USRG(\d+)$/);
				if (match) {
					const numericId = parseInt(match[1], 10);
					return Math.max(max, numericId);
				}
				return max;
			}, 0);

			setNextGroupId(maxId + 1);

			if (selectedGroup) {
				const restoredGroup = mapped.find(g => g.USR_GRP_ID === selectedGroup.USR_GRP_ID);
				if (restoredGroup) {
					setSelectedGroup(restoredGroup);
					getUsers(restoredGroup.USR_GRP_ID);
				} else if (mapped.length > 0) {
					setSelectedGroup(mapped[0]);
					getUsers(mapped[0].USR_GRP_ID);
				}
			} else if (mapped.length > 0) {
				setSelectedGroup(mapped[0]);
				getUsers(mapped[0].USR_GRP_ID);
			}
		} catch (e) {
			console.error('[소속그룹] 조회 실패', e);
		} finally {
			setLoadingGroups(false);
		}
	};

	const getUsers = async (usrGrpId) => {
		if (!usrGrpId) {
			setUsers([]);
			return;
		}

		try {
			setLoadingUsers(true);
			const param = { USR_GRP_ID: usrGrpId };
			const { table } = await http.post('/admin/getuser', param, { shape: 'datatable', showSpinner: true });

			const mapped = table.map((u, idx) => ({
				id: u.USR_ID || String(idx),
				...u
			}));
			setUsers(mapped);

			if (mapped.length > 0) {
				setSelectedUser(mapped[0]);
			} else {
				setSelectedUser(null);
			}
		} catch (e) {
			console.error('[사용자] 조회 실패', e);
		} finally {
			setLoadingUsers(false);
		}
	};

	// ==============================================================
	//                        데이터 저장 처리
	// ==============================================================
	const saveGroup = async () => {
		if (!hasGroupChanges) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}
	
		const changedGroups = groups.filter(g => g.ROW_STATE);
	
		if (changedGroups.length === 0) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}
	
		const insertCnt = changedGroups.filter(g => g.ROW_STATE === 'I').length;
		const updateCnt = changedGroups.filter(g => g.ROW_STATE === 'U').length;
		const deleteCnt = changedGroups.filter(g => g.ROW_STATE === 'D').length;
	
		const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
		if (r === 'no') {
			return;
		}
	
		try {
			setSavingGroup(true);
			const response = await http.post('/admin/saveusergroups', changedGroups, { shape: 'json' });
			await GMessageBox.Show('MGI00352', 'Ok');
			await getGroups();
			setHasGroupChanges(false);
		} catch (e) {
			console.error('[그룹 저장 실패]', e);
			await GMessageBox.Show('저장 중 오류가 발생했습니다', 'Ok');
		} finally {
			setSavingGroup(false);
		}
	};

	const saveUser = async () => {
		const changedData = changes(users);
	
		if (changedData.length === 0) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}
	
		const newUsers = changedData.filter(u => u.ROW_STATE === 'I');
	
		for (const newUser of newUsers) {
			if (!newUser.USR_ID || newUser.USR_ID.trim() === '') {
				await GMessageBox.Show('MGW00018', 'Ok','사용자 ID');
				return;
			}
	
			try {
				const response = await http.post('/admin/checkDuplicateUserId', {
					USR_ID: newUser.USR_ID
				});
	
				if (!response.success) {
					await GMessageBox.Show('중복체크 중 오류가 발생했습니다', 'Ok');
					return;
				}
	
				if (response.isDuplicate) {
					await GMessageBox.Show('MGI00111', 'Ok');
					return;
				}
			} catch (e) {
				console.error('[중복 체크 실패]', e);
				await GMessageBox.Show('중복체크 중 오류가 발생했습니다', 'Ok');
				return;
			}
		}
	
		const insertCnt = changedData.filter(u => u.ROW_STATE === 'I').length;
		const updateCnt = changedData.filter(u => u.ROW_STATE === 'U').length;
		const deleteCnt = changedData.filter(u => u.ROW_STATE === 'D').length;
	
		const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
		if (r === 'no') {
			return;
		}
	
		try {
			setSavingUser(true);
			const response = await http.post('/admin/saveuser', changedData, { shape: 'json' });
			await GMessageBox.Show('MGI00352', 'Ok');
			if (selectedGroup) {
				getUsers(selectedGroup.USR_GRP_ID);
			}
			setHasUserChanges(false);
		} catch (e) {
			console.error('[사용자 저장 실패]', e);
			await GMessageBox.Show('저장 중 오류가 발생했습니다', 'Ok');
		} finally {
			setSavingUser(false);
		}
	};

	const resetPassword = async () => {
		if (!selectedUser) return;
	
	
		// 'YesNo' 타입을 사용하여 확인/취소 버튼 표시(선택한 사용자의 비밀번호를 초기화 하시겠습니까?)
		const result = await GMessageBox.Show(
			`${selectedUser.USR_NM || selectedUser.USR_ID}의 비밀번호를 초기화하시겠습니까?`, 
			'YesNo'
		);
		
		// 사용자가 'Yes' 버튼을 클릭한 경우에만 실행함
		if (result === 'yes') {
			try {
				const param = [{ USR_ID: selectedUser.USR_ID, LST_ADJPRN_ID: 'ADMIN' }];
				const response = await http.post('/admin/saveuserpw', param, { shape: 'json' });
				await GMessageBox.Show('MGI00028', 'Ok');
				if (selectedGroup) {
					getUsers(selectedGroup.USR_GRP_ID);
				}
			} catch (e) {
				console.error('[비밀번호 초기화 실패]', e);
				await GMessageBox.Show('비밀번호 초기화 중 오류가 발생했습니다', 'Ok');
			}
		}
	};

	// ==============================================================
	//                        이벤트 정의
	// ==============================================================
	const handleGroupSelect = (group) => {
		if (selectedGroup?.USR_GRP_ID === group.USR_GRP_ID) return;
		setSelectedGroup(group);
		getUsers(group.USR_GRP_ID);
	};

	const handleUserSelect = (user) => {
		setSelectedUser(user);
	};

	const handleGroupRowsChange = (newRows) => {
		setGroups(newRows);
		if (newRows.length > groups.length) {
			const newGroup = newRows[newRows.length - 1];
			setSelectedGroup(newGroup);
			setUsers([]);
		}
	};

	const handleUserRowsChange = (newRows) => {
		setUsers(newRows);
		if (newRows.length > users.length) {
			const newUsers = newRows.filter(u =>
				u.ROW_STATE === 'I' && !users.find(existing => existing.id === u.id)
			);
			if (newUsers.length > 0) {
				setSelectedUser(newUsers[newUsers.length - 1]);
			}
		}
		setHasUserChanges(true);
	};

	const handleUserRevert = () => {
		if (selectedGroup) {
			getUsers(selectedGroup.USR_GRP_ID);
			setHasUserChanges(false);
		}
	};

	const handleUserRowClick = (params) => {
		handleUserSelect(params.row);
	};

	const handleGroupRevert = () => {
		getGroups();
		setHasGroupChanges(false);
	};

	const handleGroupFieldChange = (field, value) => {
		const updatedGroup = {
			...selectedGroup,
			[field]: value,
			ROW_STATE: selectedGroup.ROW_STATE === 'I' ? 'I' : 'U'
		};
		setSelectedGroup(updatedGroup);
		setGroups(groups.map(g =>
			g.USR_GRP_ID === selectedGroup.USR_GRP_ID ? updatedGroup : g
		));
		setHasGroupChanges(true);
	};

	const handleUserFieldChange = (field, value) => {
		const updatedUser = {
			...selectedUser,
			[field]: value,
			ROW_STATE: selectedUser.ROW_STATE === 'I' ? 'I' : 'U'
		};
		setSelectedUser(updatedUser);
		setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
		setHasUserChanges(true);
	};

	// YYYYMMDD → YYYY-MM-DD 변환 헬퍼 함수
	const formatDateForDisplay = (dateStr) => {
		if (!dateStr || dateStr.length !== 8) return '';
		return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
	};

	const handleStartDateChange = async (dateStr) => {
		if (!selectedUser || !dateStr) return;
		
		// YYYY-MM-DD 형식을 YYYYMMDD로 변환
		const formattedDate = dateStr.replace(/-/g, '');
		
		if (selectedUser.VALID_END_DD && formattedDate > selectedUser.VALID_END_DD) {
			await GMessageBox.Show('MGI00031', 'Ok');
			return;
		}

		const updatedUser = {
			...selectedUser,
			VALID_STRT_DD: formattedDate,
			ROW_STATE: selectedUser.ROW_STATE === 'I' ? 'I' : 'U'
		};
		setSelectedUser(updatedUser);
		setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
		setHasUserChanges(true);
	};

	const handleEndDateChange = async (dateStr) => {
		if (!selectedUser || !dateStr) return;
		
		// YYYY-MM-DD 형식을 YYYYMMDD로 변환
		const formattedDate = dateStr.replace(/-/g, '');
		
		if (selectedUser.VALID_STRT_DD && formattedDate < selectedUser.VALID_STRT_DD) {
			await GMessageBox.Show('만료일은 적용일보다 이전일 수 없습니다', 'Ok');
			return;
		}

		const updatedUser = {
			...selectedUser,
			VALID_END_DD: formattedDate,
			ROW_STATE: selectedUser.ROW_STATE === 'I' ? 'I' : 'U'
		};
		setSelectedUser(updatedUser);
		setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
		setHasUserChanges(true);
	};

	// ==============================================================
	//                        필드 정의
	// ==============================================================
	const createNewUserRow = () => {
		const today = dayjs().format('YYYYMMDD');
		const tempId = `temp_${Date.now()}`;
		return {
			id: tempId,
			USR_ID: '',
			USR_NM: '',
			USR_GRP_ID: selectedGroup?.USR_GRP_ID || '',
			USR_GRP_NM: selectedGroup?.USR_GRP_NM || '',
			JOBTITL_NM: '',
			USR_STAT_CD: 'N',
			VALID_STRT_DD: today,
			VALID_END_DD: '99991231',
			PW_ERR_CNT: 0,
			ROW_STATE: 'I'
		};
	};

	const createNewGroupRow = (parentGroup) => {
		const newGroupId = `USRG${String(nextGroupId).padStart(6, '0')}`;
		setNextGroupId(prev => prev + 1);
		return {
			USR_GRP_ID: newGroupId,
			USR_GRP_NM: '새 그룹',
			UP_USR_GRP_ID: parentGroup?.USR_GRP_ID || null,
			ROW_STATE: 'I'
		};
	};

	const generateNewGroupId = () => {
		const newGroupId = `USRG${String(nextGroupId).padStart(6, '0')}`;
		setNextGroupId(prev => prev + 1);
		return newGroupId;
	};

	// ==============================================================
	//                        그리드 컬럼 정의
	// ==============================================================
	const userColumns = [
		{ headerName: 'ID', headerAlign: 'center', field: 'USR_ID', width: 150, editable: false, align: 'left' },
		{ headerName: '이름', headerAlign: 'center', field: 'USR_NM', width: 150, editable: false, align: 'left' },
		{ headerName: '직위', headerAlign: 'center', field: 'JOBTITL_NM', flex: 1, editable: false, align: 'left' }
	];

	// ==============================================================
	//                          화면 구성
	// ==============================================================
	return (
		<GPageContainer>
			{/* 상단: 소속그룹 영역 */}
			<GContentBox flex={false} marginBottom="8px">
				<Stack direction="row" spacing={2} height={345}>
					{/* 왼쪽: 그룹 트리 그리드 */}
					<Box sx={{ flex: 4, overflow: 'hidden' }}>
						<GSimpleTreeGrid
							rows={groups}
							onRowsChange={handleGroupRowsChange}
							idField="USR_GRP_ID"
							parentIdField="UP_USR_GRP_ID"
							labelField="USR_GRP_NM"
							columnLabel="사용자그룹명"
							createNewRow={createNewGroupRow}
							generateNewId={generateNewGroupId}
							title="소속그룹"
							selectedItem={selectedGroup}
							onSelectedItemChange={handleGroupSelect}
							onHasChanges={setHasGroupChanges}
							Buttons={{ add: true, delete: true, revert: true, excel: false }}
							onRevertClick={handleGroupRevert}
							sx={{ height: '100%' }}
						/>
					</Box>

					{/* 오른쪽: 그룹 정보 입력 패널 */}
					<Stack flex={6}>
						<GDetailTitle title="사용자 그룹 정보" />

						{/* 입력 폼 영역 */}
						<Box sx={{ flex: 1, overflow: 'auto' }}>
							<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
								<GLayoutItem label="그룹ID">
									<GTextField 
										value={selectedGroup?.USR_GRP_ID || ''} 
										readOnly={true} 
									/>
								</GLayoutItem>

								<GLayoutItem label="그룹명">
									<GTextField 
										value={selectedGroup?.USR_GRP_NM || ''} 
										fieldName="USR_GRP_NM"
										onFieldChange={handleGroupFieldChange}
										required={true}
									/>
								</GLayoutItem>
							</GLayoutGroup>
						</Box>

						<GButtonGroup>
							<GButton auth="Save" label="Save" onClick={saveGroup} />
						</GButtonGroup>
					</Stack>
				</Stack>
			</GContentBox>

			{/* 하단: 사용자 영역 */}
			<GContentBox flex={true}>
				<Box sx={{ 
					flex: 1, 
					minHeight: 0, 
					display: 'flex', 
					gap: 2,
					overflow: 'hidden'
				}}>
					<Stack direction="row" spacing={2} sx={{ flex: 1, width: '100%' }}>
						{/* 왼쪽: 사용자 그리드 */}
						<Box sx={{ 
							flex: 4, 
							minHeight: 0, 
							display: 'flex', 
							flexDirection: 'column',
							overflow: 'hidden'
						}}>
							<GDataGrid
								title={`사용자 Total (${users.length})`}
								showTitle={true}
								rows={users}
								columns={userColumns}
								onRowsChange={handleUserRowsChange}
								Buttons={{ add: true, delete: true, revert: true, excel: false }}
								createNewRow={createNewUserRow}
								onRevertClick={handleUserRevert}
								columnHeaderHeight={30}
								rowHeight={25}
								checkboxSelection
								disableRowSelectionOnClick
								pagination={false}
								hideFooter
								onRowClick={handleUserRowClick}
								enableRowState={true}
								localeText={{
									noRowsLabel: '',
								}}
							/>
						</Box>

						{/* 오른쪽: 사용자 정보 입력 패널 */}
						<Box sx={{ 
							flex: 6, 
							minHeight: 0, 
							display: 'flex', 
							flexDirection: 'column',
							overflow: 'hidden'
						}}>
							<GDetailTitle title="사용자 정보" />

							{/* 입력 폼 영역 */}
							<Box sx={{ flex: 1, overflow: 'auto' }}>
								<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="ID">
											<GTextField 
												value={selectedUser?.USR_ID || ''} 
												fieldName="USR_ID"
												onFieldChange={handleUserFieldChange}
												readOnly={selectedUser?.ROW_STATE !== 'I'}
												required={selectedUser?.ROW_STATE == 'I'}
											/>
										</GLayoutItem>
										<GLayoutItem label="사용자명">
											<GTextField 
												value={selectedUser?.USR_NM || ''} 
												fieldName="USR_NM"
												onFieldChange={handleUserFieldChange}
												required={true}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="소속그룹">
											<GSelectBox
												items={groups}
												valueKey="USR_GRP_ID"
												labelKey="USR_GRP_NM"
												value={selectedUser?.USR_GRP_ID || ''}
												fieldName="USR_GRP_ID"
												onFieldChange={handleUserFieldChange}
											/>
										</GLayoutItem>
										<GLayoutItem label="직위">
											<GTextField 
												value={selectedUser?.JOBTITL_NM || ''} 
												fieldName="JOBTITL_NM"
												onFieldChange={handleUserFieldChange}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="사용자상태">
											<GSelectBox
												items={lstUsrStatCd}
												valueKey="CD_VAL"
												labelKey="CD_VAL_NM"
												value={selectedUser?.USR_STAT_CD || ''}
												fieldName="USR_STAT_CD"
												onFieldChange={handleUserFieldChange}
											/>
										</GLayoutItem>
										<GLayoutItem label="로그인실패횟수">
											<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
												<GTextField 
													value={selectedUser?.PW_ERR_CNT || 0} 
													readOnly={true}
													sx={{ flex: 1 }}
												/>
												<GButton
													variant="contained"
													size="small"
													onClick={resetPassword}
													disabled={!selectedUser}
													label="RESET PASSWORD"
												>
												</GButton>
											</Box>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="적용일">
											<GDatePicker
												value={formatDateForDisplay(selectedUser?.VALID_STRT_DD || '')}
												onChange={handleStartDateChange}
												format="YYYY-MM-DD"
												disabled={!selectedUser || selectedUser?.USR_STAT_CD !== 'N'}
												showCalendarIcon={true}
												allowClear={false}
												height={30}
												placeholder=""
											/>
										</GLayoutItem>
										<GLayoutItem label="만료일">
											<GDatePicker
												value={formatDateForDisplay(selectedUser?.VALID_END_DD || '')}
												onChange={handleEndDateChange}
												format="YYYY-MM-DD"
												disabled={!selectedUser || selectedUser?.USR_STAT_CD === 'E'}
												showCalendarIcon={true}
												allowClear={false}
												height={30}
												placeholder=""
											/>
										</GLayoutItem>
									</GLayoutGroup>
								</GLayoutGroup>
							</Box>

							{/* 하단 버튼 영역 */}
							<GButtonGroup>
								<GButton auth="Save" label="Save" onClick={saveUser} />
							</GButtonGroup>
						</Box>
					</Stack>
				</Box>
			</GContentBox>
		</GPageContainer>
	);
}