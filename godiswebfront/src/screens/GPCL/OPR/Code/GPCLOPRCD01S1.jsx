import React, { useEffect, useState, useMemo } from 'react';
import { Card, Input, Space, message } from 'antd';
import { Box, TextField, Stack, Button } from '@mui/material';

import GDataGrid from '@/components/GDataGrid.jsx';
import GDateEditCell from '@/components/GDateEditCell.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GButton from '@/components/GButton';
// 서버호출/유틸
import { http } from '@/libs/TaskHttp';
import { changes, toValueOptions } from '@/libs/Utils';
import { cacheCode } from '@/libs/DataUtils';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRCD01S1() {
  // ===== Cache 코드 =====
  const [lstGrpTpCd, setLstGrpTpCd] = useState([]);

  // ===== 검색/그리드 상태 =====
  const [grpNm, setGrpNm] = useState('');
  const [grpTpCd, setGrpTpCd] = useState('');
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedGrpId, setSelectedGrpId] = useState(null);

  // ⭐ 원본 데이터 저장용 state 추가
  const [originalGroups, setOriginalGroups] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);

  // 저장 로딩
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  const rowYesMo = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No'  },
  ];

  // SearchHeader용 폼 상태
  const handleInitialize = () => { 
    console.log('Init'); 
    setGrpNm(''); 
    setGrpTpCd(''); 
  };

  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["GRP_TP_CD"];
      const result = await cacheCode(params);
      setLstGrpTpCd(result.GRP_TP_CD || []);
    })();
  }, []);

  // ===== 데이터 조회 =====
  const getGroups = async () => {
    console.log('공통코드 조회=====');
    try {
      const param = { GRP_NM : grpNm, GRP_TYPE_CD : grpTpCd };
      const { name, table } = await http.post('/admin/getgroups', param, { shape: 'datatable', showSpinner: true });
      setGroups(table);
      setOriginalGroups(table);

      console.log(table);
      if (table && table.length > 0) {
        setSelectedGrpId(table[0]);
      }

      console.log("-=======================================================================================");
      console.log("-=======================================================================================");
      console.log("-=======================================================================================");
      console.log(table);
      console.log("-=======================================================================================");
      console.log("-=======================================================================================");
    } catch (e) {
      console.error('[공통코드] 그룹 조회 실패', e);
      message.error('그룹 목록을 불러오지 못했습니다.');
    }
  };

  const getItems = async (param) => {
    if (!param) { 
      setItems([]); 
      setOriginalItems([]);
      return; 
    }
    try {
      const { name, table } = await http.post('/admin/getcodes', param, { shape: 'datatable', showSpinner: false });
      setItems(table);
      setOriginalItems(table);
    } catch (e) {
      console.error('[공통코드] 항목 조회 실패', e);
      message.error('공통코드 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => { getGroups(); }, []);
  useEffect(() => { getItems(selectedGrpId); }, [selectedGrpId]);

  // ⭐ Revert 핸들러 추가
  const handleGroupRevert = () => {
    setGroups(JSON.parse(JSON.stringify(originalGroups)));
  };

  const handleItemRevert = () => {
    setItems(JSON.parse(JSON.stringify(originalItems)));
  };

  // ⭐ 셀 편집 시작 핸들러 추가
  const handleGroupCellEditStart = (params, event) => {
    if (params.field === 'GRP_CD_ID' && params.row.ROW_STATE !== 'I') {
      event.defaultMuiPrevented = true;
    }
  };

  const handleItemCellEditStart = (params, event) => {
    if (params.field === 'CD_VAL' && params.row.ROW_STATE !== 'I') {
      event.defaultMuiPrevented = true;
    }
  };

  // ===== 저장 =====
  const saveGroup = async () => {
    const data = changes(groups);

    if (data.length === 0) {
      await GMessageBox.Show('MGI00001', 'Ok');
      return;
    }

    // ⭐ 그룹명 필드 검증 추가
    for (const row of data) {
      if (row.ROW_STATE === 'I' || row.ROW_STATE === 'U') {
        if (!row.GRP_NM || row.GRP_NM.trim() === '') {
          await GMessageBox.Show('MGW00018', 'Ok', '그룹명');
          return;
        }
      }
    }

    // ===== 그룹유형 필드 검증 =====
    const hasEmptyGrpTypeCd = data.some(row => !row.GRP_TYPE_CD || row.GRP_TYPE_CD.trim() === '');
    if (hasEmptyGrpTypeCd) {
      await GMessageBox.Show('MGW00019', 'Ok', '그룹유형');
      return;
    }

    const r = await GMessageBox.Show('MGQ00067', 'YesNo', '공통코드그룹');
    if (r === 'no') {
      return;
    }

    try {
      setSavingGroup(true);
      await http.post('/admin/savegroup', data, { shape: 'datarow' });
      message.success('공통코드그룹이 저장되었습니다.');
      getGroups();
    } catch (e) {
      console.error(e);
      message.error(e.message || '공통코드그룹 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingGroup(false);
    }
  };

  const saveCode = async () => {
    const data = changes(items);

    if (data.length === 0) {
      await GMessageBox.Show('MGI00001', 'Ok');
      return;
    }

    // ⭐ 공통코드명 필드 검증 추가
    for (const row of data) {
      if (row.ROW_STATE === 'I' || row.ROW_STATE === 'U') {
        if (!row.CD_VAL_NM || row.CD_VAL_NM.trim() === '') {
          await GMessageBox.Show('MGW00018', 'Ok', '공통코드명');
          return;
        }
      }
    }

    const r = await GMessageBox.Show('MGQ00067', 'YesNo', '공통코드');
    if (r === 'no') return;

    try {
      setSavingCode(true);

      // ✅ 각 코드행에 선택된 그룹ID 추가
      const dataWithGroup = data.map(row => ({
        ...row,
        GRP_CD_ID: selectedGrpId?.GRP_CD_ID,
      }));

      await http.post('/admin/savecode', dataWithGroup, { shape: 'datarow' });
      message.success('공통코드가 저장되었습니다.');

      getItems(selectedGrpId);
    } catch (e) {
      console.error(e);
      message.error(e.message || '공통코드 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingCode(false);
    }
  };

  // ===== 신규행 템플릿 =====
  const addGroupRow = () => ({
    ROW_STATE: 'I',
    GRP_CD_ID: `_NEW_${Date.now()}`,
    GRP_NM: '',
    GRP_CD_DSC: '',
    GRP_TYPE_CD: '',
    MEM_CREAT_OBJ_YN: 'Y',
    VALID_STRT_DD: '20240101',
    VALID_END_DD: '99991231',
  });

  const addItemRow = () => ({
    ROW_STATE: 'I',
    CD_VAL: `_NEW_${Date.now()}`,
    CD_VAL_NM: '',
    USE_YN: 'Y',
  });

  // ===== 컬럼 =====
  const groupColumns = [
    { headerName: '공통코드그룹'  , headerAlign: 'center', field: 'GRP_CD_ID'       , width: 200, align: 'left', editable: true },
    { headerName: '그룹명'        , headerAlign: 'center', field: 'GRP_NM'          , width: 300, align: 'left', editable: true },
    { headerName: '설명'          , headerAlign: 'center', field: 'GRP_CD_DSC'      , width: 400, align: 'left', editable: true },
    { headerName: '그룹유형'      , headerAlign: 'center', field: 'GRP_TYPE_CD'     , type:'singleSelect', width: 120, align: 'left', editable: true, valueOptions: toValueOptions(lstGrpTpCd, 'CD_VAL', 'CD_VAL_NM') },
    { headerName: 'Cache대상'     , headerAlign: 'center', field: 'MEM_CREAT_OBJ_YN', type:'singleSelect', width: 110, align: 'center', editable: true, valueOptions: rowYesMo },
    { headerName: '적용일'        , headerAlign: 'center', field: 'VALID_STRT_DD'   , width: 120, align: 'center', editable: true, displayAsYmd: true, renderEditCell:(p)=><GDateEditCell {...p} /> },
    { headerName: '만료일'        , headerAlign: 'center', field: 'VALID_END_DD'    , width: 120, align: 'center', editable: true, displayAsYmd: true, renderEditCell:(p)=><GDateEditCell {...p} /> },
  ];

  const itemColumns = [
    { headerName: '공통코드'      , headerAlign: 'center', field: 'CD_VAL'          , width: 120, align: 'left', editable: true },
    { headerName: '공통코드명'    , headerAlign: 'center', field: 'CD_VAL_NM'       , width: 160, align: 'left', editable: true },
    { headerName: '공통코드영문명', headerAlign: 'center', field: 'CD_VAL_ENG_NM'   , width: 180, align: 'left', editable: true },
    { headerName: '설명'          , headerAlign: 'center', field: 'CD_VAL_DSC'      , flex: 1, align: 'left', editable: true },
    { headerName: '상위코드명'    , headerAlign: 'center', field: 'UP_CD_VAL_NM'    , width: 140, align: 'left', editable: true },
    { headerName: '정렬순서'      , headerAlign: 'center', field: 'SORT_ORD'        , width: 100, align: 'right', editable: true },
    { headerName: '추가문자1'     , headerAlign: 'center', field: 'CD_ADD_INFO_VAL1', width: 120, align: 'left', editable: true },
    { headerName: '추가문자2'     , headerAlign: 'center', field: 'CD_ADD_INFO_VAL2', width: 120, align: 'left', editable: true },
    { headerName: '추가문자3'     , headerAlign: 'center', field: 'CD_ADD_INFO_VAL3', width: 120, align: 'left', editable: true },
    { headerName: '추가숫자1'     , headerAlign: 'center', field: 'CD_ADD_INFO_NO1' , width: 100, align: 'right', editable: true },
    { headerName: '추가숫자2'     , headerAlign: 'center', field: 'CD_ADD_INFO_NO2' , width: 100, align: 'right', editable: true },
    { headerName: '추가숫자3'     , headerAlign: 'center', field: 'CD_ADD_INFO_NO3' , width: 100, align: 'right', editable: true },
    { headerName: '사용여부'      , headerAlign: 'center', field: 'USE_YN'          , type:'singleSelect', width: 110, align: 'center', editable: true, valueOptions: rowYesMo },
  ];

  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '공통코드명',
              content: (
                <TextField
                  fullWidth
                  name="text"
                  value={grpNm}
                  onChange={(e) => setGrpNm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      getGroups();
                    }
                  }}
                  placeholder="공통코드명 입력"
                />
              ),
            },
            {
              header: '그룹유형',
              content: (
                <GSelectBox 
                  items={lstGrpTpCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={grpTpCd}
                  onChange={(v) => setGrpTpCd(v)}
                />
              ),
            },
            {},
            {}
          ]}
          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={getGroups} />,
          ]}
        />
      </GSearchSection>

      {/* 상단: 공통코드그룹 */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid
          title="공통코드그룹"
          rows={groups}
          columns={groupColumns}
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          columnHeaderHeight={30}
          rowHeight={25}
          checkboxSelection
          height={345}
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          disableRowSelectionOnClick
          onRowsChange={setGroups}
          onRevertClick={handleGroupRevert}
          onCellEditStart={handleGroupCellEditStart} // ⭐ 추가
          onRowClick={(params) => {
            setSelectedGrpId(params.row);
            getItems(params.row);
          }}
          createNewRow={addGroupRow}
        />
        <GButtonGroup>
          <GButton key="save" auth="Save" label="Save" onClick={saveGroup} />
        </GButtonGroup>
      </GContentBox>

      {/* 하단: 공통코드 */}
      <GContentBox flex={true}>
        <GDataGrid
          title="공통코드"
          rows={items}
          columns={itemColumns}
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          columnHeaderHeight={30}
          rowHeight={25}
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          checkboxSelection
          onRowsChange={setItems}
          onRevertClick={handleItemRevert}
          onCellEditStart={handleItemCellEditStart} // ⭐ 추가
          disableRowSelectionOnClick
          createNewRow={addItemRow}
        />
        <GButtonGroup>
          <GButton key="save" auth="Save" label="Save" onClick={saveCode} />
        </GButtonGroup>
      </GContentBox>
    </GPageContainer>
  );
}