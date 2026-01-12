import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, message } from 'antd';
import { Box, Checkbox, Stack, Button } from '@mui/material';

import GDataGrid from '@/components/GDataGrid.jsx';
import GDataTreeGrid from '@/components/GDataTreeGrid.jsx';
import GButton from '@/components/GButton';
import GPageContainer from '@/components/GPageContainer';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';

// 서버호출
import { http } from '@/libs/TaskHttp';

/**
 * GPCLOPRAH01S1 - 역할 정의 & 메뉴/버튼 권한
 */
export default function GPCLOPRAH01S1() {
  const [roles, setRoles] = useState([]);
  const [menu, setMenu] = useState([]);
  const [btns, setBtns] = useState([]);
  const [btnMap, setBtnMapp] = useState([]);
  const [menuButnAuth, setMenuButnAuth] = useState([]);

  const [selectedRoleId, setSelectedRoleId] = useState(null);

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);

  const [savingRole, setSavingRole] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);

  const [roleInitList, setRoleInitList] = useState(false);  
  const [menuBtnAuthInitList, setMenuBtnAuthInitList] = useState(false);
  const initialMenuButnAuth = useRef([]);

  // -------------------------------------------------- //
  // 역할 목록 조회
  // -------------------------------------------------- //
  const getRoles = async () => {
    try {
      setLoadingRoles(true);
      const param = {};
      const { table } = await http.post('/admin/getroles', param, { shape: 'datatable' });

      setRoles(table);
      setRoleInitList(table);
      if (table.length > 0) {
        handleRoleSelect(table[0].ROLE_ID);
      }
    } catch (e) {
      console.error('[역할정의] 역할 조회 실패', e);
      message.error('역할 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingRoles(false);
    }
  };
  useEffect(() => { getRoles(); }, []);

  // 메뉴/버튼/권한 조회
  const getMenuButnAuth = async (roleId) => {
    try {
      setLoadingMenus(true);

      const param = { ROLE_ID: roleId };
      const { tables } = await http.post('/admin/getMenuButnAuth', param, { shape: 'dataset' });

      setMenuButnAuth(tables.DtMenuButnAuth);
      setMenuBtnAuthInitList(tables);
      initialMenuButnAuth.current = tables.DtMenuButnAuth; //원본 데이터 저장(상태 비교용)

      setBtns(tables.DtBtn);
      setMenu(tables.DtMenu);
      setBtnMapp(tables.DtProgmButnMappList);
    } catch (e) {
      console.error('[메뉴/버튼/권한] 권한 조회 실패', e);
      message.error('권한 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingMenus(false);
    }
  };

  // -------------------------------------------------- //
  // 저장
  // -------------------------------------------------- //
  const saveRole = async () => {

    const inserts = roles.filter(r => r.ROW_STATE === 'I').map( r=> {
      const { ROW_STATE, __rid, ...rest } = r;
      return rest;
    });

    const updates = roles.filter(r => r.ROW_STATE === 'U').map( r=> {
      const { ROW_STATE, __rid, ...rest } = r;
      return rest;
    });

    const deletes = roles.filter(r => r.ROW_STATE === 'D').map( r=> {
      const { ROW_STATE, __rid, ...rest } = r;
      return rest;
    });

    const payload = { inserts, updates, deletes };
    const empty = (!payload.inserts?.length && !payload.updates?.length && !payload.deletes?.length);
    if (empty) {
      message.info('변경된 내역이 없습니다.');
      return;
    }

    try {
      if(!chkValidation(payload)) return;
      setSavingRole(true);
      const res = await fetch('/api/admin/saveRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('역할 저장 실패');
      await res.json().catch(() => ({}));
      message.success('역할이 저장되었습니다.');
      getRoles();
    } catch (e) {
      console.error(e);
      message.error(e.message || '역할 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingRole(false);
    }
  };

  const saveMenu = async () => {
    const originalAuths = initialMenuButnAuth.current;
    const currentAuths = menuButnAuth;

    //각 권한 항목을 고유한 문자열 키로 변환하는 헬퍼 함수
    const toKey = (auth) => `${auth.MENU_ID}|${auth.BUTN_ID}`;

    const originalKeys = new Set(originalAuths.map(toKey));
    const currentKeys = new Set(currentAuths.map(toKey));
    const inserts = currentAuths.filter(auth => !originalKeys.has(toKey(auth)));
    const deletes = originalAuths.filter(auth => !currentKeys.has(toKey(auth)));
    const payload = {
      inserts,
      updates: [],
      deletes,
      ROLE_ID: selectedRoleId,
    };

    const empty = (!payload.inserts?.length && !payload.updates?.length && !payload.deletes?.length);
    if (empty) {
      message.info('변경된 내역이 없습니다.');
      return;
    }

    try {
      setSavingMenu(true);
      const res = await fetch('/api/admin/saveRoleMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('메뉴/버튼 권한 저장 실패');
      initialMenuButnAuth.current = currentAuths;


      await res.json().catch(() => ({}));
      message.success('메뉴/버튼 권한이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      message.error(e.message || '메뉴/버튼 권한 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingMenu(false);
    }
  };

  // -------------------------------------------------- //
  // 이벤트
  // -------------------------------------------------- //

  const chkValidation = (payload) => {
    return Object.values(payload)
                  .filter(Array.isArray)
                  .flat()
                  .every(item => {
                    const code = item.USR_TP_CD;
                    if (code === undefined || code === null) return false;
                    if (!/^[0-9]+$/.test(code)){
                      message.error('사용자유형 :' + code + " 는 숫자만 가능합니다."); return false;
                    }
                    if (String(code).length != 2){
                      message.error('사용자유형 :' + code + " 는 2자리만 가능합니다."); return false;
                    } 
                    return true;
                  });
  };

  const handleRoleSelect = (roleId) => {
    if (roleId && roleId !== selectedRoleId) {
      setSelectedRoleId(roleId);
      getMenuButnAuth(roleId);
    }
  };

  const handleAllToggle = (menuId, progId, checked) => {
    // Recursive helper to get all descendant menu items from the flat list
    const getDescendants = (parentId, flatList) => {
        const children = flatList.filter(item => item.UP_MENU_ID === parentId);
        return children.concat(children.flatMap(child => getDescendants(child.MENU_ID, flatList)));
    };

    // Find the clicked menu item
    const currentItem = menu.find(item => item.MENU_ID === menuId);
    if (!currentItem) return;

    // Get all descendant items
    const descendants = getDescendants(menuId, menu);
    const itemsToUpdate = [currentItem, ...descendants];

    // Create a set of all permissions to toggle for efficient lookup
    const permissionsToUpdate = new Set();
    itemsToUpdate.forEach(item => {
        const definedBtns = progBtnMap[item.PROGM_ID] || [];
        definedBtns.forEach(btnId => {
            permissionsToUpdate.add(`${item.MENU_ID}|${btnId}`);
        });
    });

    setMenuButnAuth(prevAuths => {
        if (checked) {
            // Add all missing permissions
            const newAuthsToAdd = [];
            const existingAuthKeys = new Set(prevAuths.map(auth => `${auth.MENU_ID}|${auth.BUTN_ID}`));
            permissionsToUpdate.forEach(permKey => {
                if (!existingAuthKeys.has(permKey)) {
                    const [mId, bId] = permKey.split('|');
                    newAuthsToAdd.push({ MENU_ID: mId, BUTN_ID: bId });
                }
            });
            return [...prevAuths, ...newAuthsToAdd];
        } else {
            // Remove all specified permissions
            return prevAuths.filter(auth => {
                const authKey = `${auth.MENU_ID}|${auth.BUTN_ID}`;
                return !permissionsToUpdate.has(authKey);
            });
        }
    });
  };

  const togglePermission = (menuId, btnId, checked) => {
    setMenuButnAuth((prev) => {
      const exists = prev.some((auth) => auth.MENU_ID === menuId && auth.BUTN_ID === btnId);
      if (checked && !exists) {
        return [...prev, { MENU_ID: menuId, BUTN_ID: btnId }];
      } else if (!checked && exists) {
        return prev.filter((auth) => !(auth.MENU_ID === menuId && auth.BUTN_ID === btnId));
      }
      return prev;
    });
  };

  const doRevert = (gridId) => {
    if (gridId == "GDataGrid") {
      setRoles(roleInitList);
    } else {
      setMenuButnAuth(menuBtnAuthInitList.DtMenuButnAuth)
    }
  };

  // -------------------------------------------------- //
  // 컬럼 정의
  // -------------------------------------------------- //
  const roleColumns = [
    { headerName: '사용자유형', field: 'USR_TP_CD', headerAlign: 'center', width: 110, align: 'center', editable: true },
    { headerName: '역할명', field: 'ROLE_NM', headerAlign: 'center', width: 180, align: 'left', editable: true },
    { headerName: '역할 영문명', field: 'ROLE_ENG_NM', headerAlign: 'center', width: 220, align: 'left', editable: true },
    { headerName: '설명', field: 'ROLE_DSC', headerAlign: 'center', width: 360, align: 'left', editable: true },
    { headerName: '영문설명', field: 'ROLE_ENG_DSC', headerAlign: 'center', width: 360, align: 'left', editable: true },
  ];

  const PermissionCheckbox = React.memo(({ checked, onChange, disabled }) => (
    <Checkbox
      checked={!!checked}
      onChange={onChange}
      disabled={disabled}
      size="small"
      sx={{ p: 0 }}
    />
  ));

  const ALL_COL_WIDTH = 70;
  const MENU_COL_WIDTH = 260;

  // 버튼 이름 길이에 따라 폭 가변
  const getBtnColWidth = (btnId) => {
    const len = (btnId || '').length;

    if (btnId === 'Download' || btnId === 'SeniorConfirm' || btnId === 'UnConfirmUndo') {
      return 140;
    }

    if (len <= 6) return 80;
    if (len <= 10) return 120;
    return 150;
  };

  // PROGM_ID -> [BUTN_ID...]
  const progBtnMap = useMemo(() => {
    const map = {};
    btnMap.forEach((item) => {
      if (!map[item.PROGM_ID]) map[item.PROGM_ID] = [];
      map[item.PROGM_ID].push(item.BUTN_ID);
    });
    return map;
  }, [btnMap]);

  const btnColWidths = useMemo(
    () => btns.map((b) => getBtnColWidth(b.BUTN_ID)),
    [btns],
  );

  const fixedColumns = [
    {
      headerName: 'Menu',
      field: 'MENU_NM',
      width: MENU_COL_WIDTH,
      headerAlign: 'left',
      align: 'left',
      editable: false,
    },
    {
      headerName: 'All',
      field: 'ALL',
      width: ALL_COL_WIDTH,
      headerAlign: 'center',
      align: 'center',
      editable: false,
      renderCell: ({ row, value }) => {
        const hasDefinedBtns = (progBtnMap[row.PROGM_ID] || []).length > 0;

        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              flexGrow: 1,
            }}
          >
            <PermissionCheckbox
              checked={value}
              // disabled={!hasDefinedBtns}
              onChange={(e) => handleAllToggle(row.MENU_ID, row.PROGM_ID, e.target.checked)}
            />
          </Box>
        );
      },
    },
  ];

  const btnColumns = btns.map((btn, idx) => ({
    field: btn.BUTN_ID,
    headerName: btn.BUTN_ID,
    width: btnColWidths[idx],
    headerAlign: 'center',
    align: 'center',
    editable: false,
    renderCell: ({ row, value }) => {
      const isLeafNode = !row.children || row.children.length === 0;
      const isButtonDefinedForMenu = (progBtnMap[row.PROGM_ID] || []).includes(btn.BUTN_ID);

      if (isLeafNode && isButtonDefinedForMenu) {
        return (
            <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  flexGrow: 1,
                }}
            >
              <Checkbox
                  checked={!!value}
                  size="small"
                  sx={{p: 0}}
                  onChange={(e) => togglePermission(row.MENU_ID, btn.BUTN_ID, e.target.checked)}
              />
            </Box>
        );
      }
      return null;
    },
  }));

  const finalColumns = [...fixedColumns, ...btnColumns];

  const totalGridWidth = useMemo(() => {
    const btnWidthSum = btnColWidths.reduce((sum, w) => sum + w, 0);
    const treeIconWidth = 50;
    return MENU_COL_WIDTH + ALL_COL_WIDTH + btnWidthSum + treeIconWidth;
  }, [btnColWidths]);

  // -------------------------------------------------- //
  // 트리 데이터 가공
  // -------------------------------------------------- //
  const buildTree = (flatList) => {
    const map = {};
    const roots = [];

    flatList.forEach((item) => {
      map[item.MENU_ID] = { ...item, children: [] };
    });

    flatList.forEach((item) => {
      const parentId = item.UP_MENU_ID;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[item.MENU_ID]);
      } else {
        roots.push(map[item.MENU_ID]);
      }
    });

    return roots;
  };

  const treeRows = useMemo(() => {
    const enriched = menu.map((menuRow) => {
      const row = {
        MENU_ID: menuRow.MENU_ID,
        MENU_NM: menuRow.MENU_NM,
        DEPTH: menuRow.LEVEL,
        UP_MENU_ID: menuRow.UP_MENU_ID,
        PROGM_ID: menuRow.PROGM_ID,
        ALL: false,
      };

      const definedBtns = progBtnMap[menuRow.PROGM_ID] || [];

      definedBtns.forEach((btnId) => {
        const isChecked = menuButnAuth.some(
          (auth) => auth.MENU_ID === menuRow.MENU_ID && auth.BUTN_ID === btnId,
        );
        row[btnId] = isChecked;
      });

      row.ALL = definedBtns.length > 0 && definedBtns.every((btnId) => row[btnId]);

      return row;
    });

    const propagated = propagateAllCheck(enriched);
    return buildTree(propagated);
  }, [menu, menuButnAuth, progBtnMap]);

  function propagateAllCheck(rows) {
    const rowMap = Object.fromEntries(rows.map((row) => [row.MENU_ID, row]));

    let changed = true;
    while (changed) {
      changed = false;

      rows.forEach((row) => {
        if (!row.UP_MENU_ID) return;

        const parent = rowMap[row.UP_MENU_ID];
        if (!parent) return;

        const siblings = rows.filter((r) => r.UP_MENU_ID === parent.MENU_ID);
        const allChildrenChecked = siblings.every((r) => r.ALL);

        if (parent.ALL !== allChildrenChecked) {
          parent.ALL = allChildrenChecked;
          changed = true;
        }
      });
    }

    return rows;
  }

  // -------------------------------------------------- //
  // 렌더링
  // -------------------------------------------------- //
  return (
    <GPageContainer>
      {/* 상단: 역할 정의 */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid
          title="역할 정의"
          rows={roles}
          columns={roleColumns}
          getRowId={(row) => row.ROLE_ID}
          columnHeaderHeight={30}
          rowHeight={25}
          checkboxSelection
          disableRowSelectionOnClick
          pagination={false}
          hideFooter
          height={140}
          onRowClick={(params) => {
            handleRoleSelect(params.row.ROLE_ID);
          }}
          onRowSelectionModelChange={(ids) => {
            const roleId = ids[0];
            if (roleId) handleRoleSelect(roleId);
          }}
          onRowsChange={setRoles}
          Buttons={{ add: true, delete: true, revert: true, excel: false }}
          onRevertClick={() => doRevert("GDataGrid")}
        />
        <GButtonGroup>
          <GButton auth="Save" label="Save" onClick={saveRole} disabled={savingRole}/>
        </GButtonGroup>
      </GContentBox>
      {/* 하단: 메뉴/버튼/권한 */}
      <GContentBox flex={true}>
        <GDataTreeGrid
          title="메뉴버튼/권한"
          rows={treeRows}
          columns={finalColumns}
          getRowId={(row) => row.MENU_ID}
          initiallyExpandAll={true}
          checkboxSelection={false}
          disableRowSelectionOnClick
          columnHeaderHeight={30}
          rowHeight={25}
          pagination={false}
          hideFooter
          Buttons={{ add: false, delete: false, revert: true, excel: true }}
          onRevertClick={() => doRevert("GDataTreeGrid")}
        />
      </GContentBox>
      <GContentBox flex={false}>
        <GButtonGroup>
          <GButton auth="Save" label="Save" onClick={saveMenu} disabled={savingMenu}/>
        </GButtonGroup>
      </GContentBox>
    </GPageContainer>
  );
}
