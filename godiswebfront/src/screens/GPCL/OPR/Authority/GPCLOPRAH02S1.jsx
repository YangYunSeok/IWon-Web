import React, { useEffect, useMemo, useState, useRef } from 'react';
import { message } from 'antd';
import { Box, Checkbox, Stack, Button } from '@mui/material';
import GDataGrid from '@/components/GDataGrid';
import GSimpleTreeGrid from '@/components/GSimpleTreeGrid';
import GButton from '@/components/GButton';
import GTitleIcon from '@/components/GTitleIcon';
import { useGridApiRef } from '@mui/x-data-grid';
import { http } from '@/libs/TaskHttp';
import { useAuth } from '@/context/AuthContext';
import GPageContainer from '@/components/GPageContainer';
import GDetailTitle from '@/components/GDetailTitle';
import GButtonGroup from '@/components/GButtonGroup';
import GMessageBox from '@/components/GMessageBox.jsx';

/**
 * GSimpleTreeGrid - ROW_STATE 관리 기능이 포함된 트리 컴포넌트
 * @param {Array} rows - 트리 데이터 (id, UP_XXX_ID 구조)
 * @param {Function} onRowsChange - rows 변경 콜백
 * @param {string} idField - 고유 ID 필드명 (기본: 'id')
 * @param {string} parentIdField - 부모 ID 필드명 (기본: 'UP_ID')
 * @param {string} labelField - 표시할 라벨 필드명 (기본: 'label')
 * @param {string} columnLabel - 컬럼 라벨 표시 텍스트 (예: '사용자그룹명')
 * @param {Function} createNewRow - 새 행 템플릿 생성 함수
 * @param {Function} generateNewId - 새 ID 생성 함수
 * @param {boolean} enableRowState - ROW_STATE 기능 활성화 (기본: true)
 * @param {string} title - 타이틀
 * @param {boolean} showTitle - 타이틀 표시 여부
 * @param {Object} Buttons - 버튼 설정 {add, delete, revert, excel}
 * @param {number} height - 높이
 * @param {Object} selectedItem - 선택된 항목
 * @param {Function} onSelectedItemChange - 선택 변경 콜백
 * @param {Function} onHasChanges - 변경사항 콜백
 * @param {boolean} showIconMode - 폴더/화살표 아이콘 표시 모드 (기본: false)
 * @param {number} treeIndent - 트리 들여쓰기 간격 (기본: 24px)
 */
export default function GPCLOPRAH02S1() {

  //조회용 상태 값
  const [userGroup, setUserGroup] = useState([]);
  const [role, setRole] = useState([]);
  const [user, setUser] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  //front 이벤트 사용 값
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredRoleList, setFilteredRoleList] = useState([]);
  const [checkedRoleIds, setCheckedRoleIds] = useState([]);
  const [checkedAuthIds, setCheckedAuthIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  // 현재 화면 상태 (AS-IS: DtUserRoleMapping)
  const [userAuth, setUserAuth] = useState([]);
  // 최초 조회 상태 (AS-IS: DtOriginUserRoleMapping)
  const [originUserAuth, setOriginUserAuth] = useState([]);
  const apiRef = useGridApiRef();
  const apiRef2 = useGridApiRef();

  const [roleGridKey, setRoleGridKey] = useState(0);
  const [userAuthGridKey, setUserAuthGridKey] = useState(0);


  /* 데이터 조회 이벤트 정의 */
  /* 소속그룹, 역활*/
  const getUserGroup = async () => {
    try {
      const param = {};
      const getUserGroup = await http.get('/admin/getUserGroup', param);

      const userGroup = (getUserGroup.userGroup || []).map((group, idx) => ({
        id: group.USR_GRP_ID || String(idx), ...group, UP_USR_GRP_ID: group.UP_USR_GRP_ID || null
      }));

      setUserGroup(userGroup);
      setRole(getUserGroup.roleDefinition);
    } catch (e) {
      message.error("소속그룹 목록을 불러오지 못했습니다.");
    }
  };

  /* 사용자 */
  const getUser = async (usrGrpId) => {
    try {
      const param = { usrGrpId: usrGrpId }
      const getSelectUserInGroup = await http.get('/admin/getUser', { params: param });
      setUser(getSelectUserInGroup);

    } catch (e) {
      message.error("소속그룹의 사용자를 불러오지 못했습니다.");
    }


  };
  /* 사용자권한 */
  const getUserRoleMappingData = async (usrId) => {
    try {
      const param = { usrId: usrId };
      const getData = await http.get('/admin/getUserRoleMappingData', { params: param });
      setUserAuth(getData);
      setOriginUserAuth(getData.map(r => ({ ...r })));
      setIsEdit(false);
    } catch (e) {
      message.error("해당 사용자의 권한을 불러오지 못했습니다.");
    }
  };

  const handleUserGroup = (group) => {
    const proceed = () => {

      setSelectedGroup(group);
      getUser(group.USR_GRP_ID);

      setSelectedUser([]);
      setUser([]);
      setUserAuth([]);
    };
    if (isEdit) {
      if (window.confirm("변경사항이 있습니다. 저장하지 않고 재조회 하시겠습니까?")) {
        proceed();
      }
    } else {
      proceed();
    }

  };

  const handleUser = (params) => {
    if (selectedUser?.USR_ID === params.row.USR_ID) {
      return;
    }
    const proceed = () => {

      setSelectedUser(params.row);
      getUserRoleMappingData(params.row.USR_ID);
    };

    if (isEdit) {
      if (window.confirm("변경사항이 있습니다. 저장하지 않고 재조회 하시겠습니까?")) {
        proceed();
      }
    } else {
      proceed();
    }
  };

  const btnDelRole = () => {
    if (!apiRef2.current) return;

    const selectedRows = Array.from(
      apiRef2.current.getSelectedRows().values()
    );

    if (selectedRows.length === 0) return;

    setUserAuth(prev =>
      prev.filter(
        row => !selectedRows.some(r => r.ROLE_ID === row.ROLE_ID)
      )
    );

    setIsEdit(true);

    // ✅ 그리드 리마운트로 선택 초기화
    setUserAuthGridKey(prev => prev + 1);
  };

  const btnAddRole = () => {
    if (!apiRef.current || !selectedUser) return;

    const selectedRows = Array.from(
      apiRef.current.getSelectedRows().values()
    );

    if (selectedRows.length === 0) return;

    const assignedRoleIds = new Set(
      userAuth.map(r => r.ROLE_ID)
    );

    const addRoles = selectedRows.filter(
      role => !assignedRoleIds.has(role.ROLE_ID)
    );

    if (addRoles.length === 0) return;

    const newRows = addRoles.map(role => ({
      ...role,
      USR_ID: selectedUser.USR_ID,
      ROW_STATE: 'I',
    }));

    setUserAuth(prev => [...prev, ...newRows]);
    setIsEdit(true);

    // ✅ 그리드 리마운트로 선택 초기화
    setRoleGridKey(prev => prev + 1);
  };

  const btnRvtRole = () => {
    if (!selectedUser) return;

    if (!isEdit) {
      GMessageBox.Show('MGI00014', 'Ok');
      return;
    }

    const restored = originUserAuth.map(r => ({ ...r }));

    setUserAuth(restored);
    setCheckedAuthIds([]);
    setCheckedRoleIds([]);

    // ✅ 두 그리드 모두 리마운트
    setRoleGridKey(prev => prev + 1);
    setUserAuthGridKey(prev => prev + 1);

    setIsEdit(false);
  };

  useEffect(() => {
    getUserGroup();
  }, []);

  useEffect(() => {
    const assignedRoleIdList = new Set(userAuth.map(auth => auth.ROLE_ID));
    const filtered = role
      .filter(r => !assignedRoleIdList.has(r.ROLE_ID))
      .map(r => ({
        ...r,
        id: r.ROLE_ID
      }));

    setFilteredRoleList(filtered);
  }, [role, userAuth]);

  /* 역할정의 그리드 컬럼 정의 */
  const roleColumn = [
    { headerName: '역할', headerAlign: 'center', field: 'ROLE_NM', width: 300, align: 'left', editable: false },
    { headerName: '설명', headerAlign: 'center', field: 'ROLE_DSC', width: 250, align: 'left', editable: false, flex: 1 },
    // { headerName: '체크', headerAlign: 'center', field: 'CHECKED', hide: true ,flex: 1 }
  ]
  /* 사용자 그리드 컬럼 정의 */
  const userColumn = [
    { headerName: '사용자ID', headerAlign: 'center', field: 'USR_ID', width: 300, align: 'left', editable: false },
    { headerName: '사용자명', headerAlign: 'center', field: 'USR_NM', width: 200, align: 'left', editable: false, flex: 1 }
  ]

  /* 사용자권한 */
  const userAuthColumn = [
    { headerName: '사용자명', headerAlign: 'center', field: 'USR_ID', width: 200, align: 'left', editable: false },
    { headerName: '권한명', headerAlign: 'center', field: 'ROLE_NM', width: 200, align: 'left', editable: false },
    { headerName: '설명', headerAlign: 'center', field: 'ROLE_DSC', width: 400, align: 'left', editable: false, flex: 1 },
  ]

  // ==============================================================
  //                           저장로직 
  // ==============================================================

  const saveGroup = async () => {
    if (!selectedUser) {
      message.warning("사용자를 선택하세요.");
      return;
    }

    const originRoleIds = new Set(originUserAuth.map(r => r.ROLE_ID));
    const currentRoleIds = new Set(userAuth.map(r => r.ROLE_ID));

    // insert
    const insertList = userAuth
      .filter(r => !originRoleIds.has(r.ROLE_ID))
      .map(r => ({
        ...r,
        USR_ID: selectedUser.USR_ID,
        ROW_STATE: 'I'
      }));

    // delete
    const deleteList = originUserAuth
      .filter(r => !currentRoleIds.has(r.ROLE_ID))
      .map(r => ({
        ...r,
        USR_ID: selectedUser.USR_ID,
        ROW_STATE: 'D'
      }));

    // 4. 변경 없음
    if (insertList.length === 0 && deleteList.length === 0) {
      await GMessageBox.Show('MGI00001', 'Ok'); // MGI00014
      return;
    }


    // 5. 저장 여부 확인
    const confirmMsg = `추가 ${insertList.length}건 / 삭제 ${deleteList.length}건 저장하시겠습니까?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      // 6. 서버 호출
      await http.post('/admin/saveRoleMapping', {
        USR_ID: selectedUser.USR_ID,
        insertList,
        deleteList
      });

      message.success("저장되었습니다.");

      // 7. 다시 조회 (AS-IS: GetUserRoleMapping)
      await getUserRoleMappingData(selectedUser.USR_ID);

      // 8. origin 동기화
      setOriginUserAuth(userAuth.map(r => ({ ...r })));
      setIsEdit(false);

    } catch (e) {
      message.error("저장 중 오류가 발생했습니다.");
    }
  };

  // ==============================================================
  //                        그리드 UI 세팅
  // ==============================================================

  const titleSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1,
    py: 0.5,
    fontWeight: 600,
    color: '#333',
    flexShrink: 0,
  };

  const gridWrapSx = {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  };

  // ==============================================================
  //                          화면 구성
  // ==============================================================
  return (
    <GPageContainer>
      {/* ================= 상단 영역 ================= */}
      <Box
        sx={{
          flexShrink: 0,
          height: 340,                 // 상단은 고정
          display: 'flex',
          gap: 1,
          overflow: 'hidden',
          padding: '8px',
        }}
      >
        {/* 소속그룹 */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ ...titleSx, fontSize: '13px' }}>
            <GTitleIcon />
            소속그룹
          </Box>

          <Box sx={gridWrapSx}>
            <GSimpleTreeGrid
              title=""
              columnLabel="사용자그룹명"
              Buttons={{ add: false, delete: false, revert: false, excel: false }}
              rows={userGroup}
              parentIdField="UP_USR_GRP_ID"
              idField="USR_GRP_ID"
              labelField="USR_GRP_NM"
              showIconMode={false}
              treeIndent={24}
              sx={{ height: '100%' }}
              onSelectedItemChange={handleUserGroup}
              selectedItem={selectedGroup}
            />
          </Box>
        </Box>
        {/* 역할정의 */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <GDetailTitle title="역할정의" />

          <Box sx={gridWrapSx}>
            <GDataGrid
              key={roleGridKey}
              apiRef={apiRef}
              title=""
              Buttons={{ add: false, delete: false, revert: false, excel: false }}
              rows={filteredRoleList}
              columns={roleColumn}
              columnHeaderHeight={30}
              rowHeight={25}
              checkboxSelection
              disableRowSelectionOnClick
              onRowsChange={setRole}
              getRowId={(row) => row.ROLE_ID}
              onRowSelectionModelChange={(selectionModel) => {
                setCheckedRoleIds(Array.isArray(selectionModel) ? selectionModel : []);
              }}
              pagination={false}
              hideFooter
              enableRowState={true}
            />
          </Box>
          {/* 이동 버튼 */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ my: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }} >
              <GButton auth="Save" label="▼" onClick={btnAddRole} />
              <GButton auth="Save" label="Revert" onClick={btnRvtRole} iconOnly />
              <GButton auth="Save" label="▲" onClick={btnDelRole} />
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* ================= 하단 영역 ================= */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          gap: 1,
          overflow: 'hidden',
          padding: '8px',
        }}
      >
        {/* 사용자 */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <GDetailTitle title={`사용자 Total (${user.length})`} />

          <Box sx={gridWrapSx}>
            <GDataGrid
              title=""
              Buttons={{ add: false, delete: false, revert: false, excel: false }}
              rows={user}
              columns={userColumn}
              columnHeaderHeight={30}
              rowHeight={25}
              pagination={false}
              hideFooter
              enableRowState={true}
              onRowClick={handleUser}
            />
          </Box>
        </Box>

        {/* 사용자 권한 */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <GDetailTitle title="사용자권한" />

          <Box sx={gridWrapSx}>
            <GDataGrid
              key={userAuthGridKey}
              apiRef={apiRef2}
              title=""
              Buttons={{ add: false, delete: false, revert: false, excel: false }}
              rows={userAuth}
              getRowId={(row) => `${row.ROLE_ID}_${row.USR_ID}`}
              getRowHeight={({ row }) =>
                row?.ROW_STATE === 'D' ? 0 : 25
              }
              isRowSelectable={(params) =>
                params.row.ROW_STATE !== 'D'
              }
              columns={userAuthColumn}
              columnHeaderHeight={30}
              rowHeight={25}
              checkboxSelection
              disableRowSelectionOnClick
              onRowsChange={(newRow) => {
                setUserAuth(newRow);
                setIsEdit(true);
              }}
              onRowSelectionModelChange={(selectionModel) => {
                setCheckedRoleIds(Array.isArray(selectionModel) ? selectionModel : []);
              }}
              pagination={false}
              hideFooter
            />
          </Box>
          {/* 저장 버튼 */}
          <GButtonGroup>
            <GButton auth="Save" label="Save" onClick={saveGroup} />
          </GButtonGroup>
        </Box>
      </Box>
    </GPageContainer>
  );
}