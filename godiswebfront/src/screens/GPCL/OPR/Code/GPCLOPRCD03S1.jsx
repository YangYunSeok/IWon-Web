import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Stack, TextField } from '@mui/material';
import dayjs from 'dayjs';

// 사내 공통 컴포넌트 (GPCLOPRCD01S1 / GPCLOPRUS01S1와 동일 계열 가정)
import GDataGrid from '@/components/GDataGrid.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GCodePicker from '@/components/GCodePicker';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GDateEditCell from '@/components/GDateEditCell.jsx';
import GSimpleTreeGrid from '@/components/GSimpleTreeGrid';
import GMessageBox from '@/components/GMessageBox';
import { http } from '@/libs/TaskHttp';
import { changes } from '@/libs/Utils';
import { cacheCode } from '@/libs/DataUtils';
import GButton from '@/components/GButton';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GDetailTitle from '@/components/GDetailTitle';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRCD03S1() {
  // ================== 상태 정의 ==================
  // 상단 검색어(그룹코드명)
  const [grpNm, setGrpNm] = useState('');
  const [cbGrpCode, setGrpCode] = useState([]);
  const codesReqRef = useRef(0); // 최신 요청 식별자


  // 그룹 그리드
  const [clssGroups, setClssGroups] = useState([]); // DtClssCodeGroup
  const [drvSelectedClssCodeGroup, setDrvSelectedClssCodeGroup] = useState(null); // DrvSelectedClssCodeGroup
  const [hasGroupChanges, setHasGroupChanges] = useState(false);

  // 트리 + 상세
  const [clssCodes, setClssCodes] = useState([]); // DtClssCode (tree rows)
  const [drvSelectedClssCode, setDrvSelectedClssCode] = useState(null); // DrvSelectedClssCode
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [hasCodeChanges, setHasCodeChanges] = useState(false);

  // 재조회 경고 플래그(C# _bSearchFlag)
  const [bSearchFlag, setBSearchFlag] = useState(true);

  // 코드 선택 팝업 관련 상태
  const [openCodePickerPopup, setOpenCodePickerPopup] = useState(false);
  const [codeList, setCodeList] = useState([]);

  // ================== ASIS 함수명 ==================
  const InitializeControl = () => {};
  const InitializeEvent = () => {};
  const initializeData = () => { GetClssCodGroupData(); };

  useEffect(() => {
    InitializeControl();
    InitializeEvent();
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!drvSelectedClssCodeGroup?.CLSS_GRP_CD_ID) {
        setClssCodes([]);
        setDrvSelectedClssCode(null);
        return;
    }
    // 최신 그룹 기준으로 트리 조회
    GetClssCodeData(drvSelectedClssCodeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drvSelectedClssCodeGroup]);

  // ================== 공통 유틸(ASIS chkValidation 대응) ==================
  const ymdOk = (v) => /^(\d{8})$/.test(String(v||''));
  const toNum = (v) => Number(String(v||'').replace(/[^0-9]/g,''));


  const handleDrvSelectedClssCode = (selectedRow) => {
    
    
    setDrvSelectedClssCode(selectedRow)
    getCboCache(selectedRow.GRP_CD_ID);
  };
  
  const getCboCache = (vGrp) => {
    (async () => {
      const params = [vGrp];
      const result = await cacheCode(params);
      result[vGrp].unshift({CD_VAL : '__SELECT__', CD_VAL_NM : '----select----', GRP_CD_ID : vGrp})
      await setGrpCode(result[vGrp] || []);
    })();

  };
  /**
   * @param {('G'|'C')} type  - G: 계층그룹코드, C: 계층코드
   * @param {Array<object>} rows - 변경 데이터 테이블(changes 결과)
   * @returns {Promise<boolean>} 통과 여부
   */
  const chkValidation = async (type, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return true;

    if (type === 'G') {
      for (const row of rows) {
        if (row.ROW_STATE === 'D') continue;

        // 1) 필수값: CLSS_GRP_CD_ID
        if (!row.CLSS_GRP_CD_ID || String(row.CLSS_GRP_CD_ID).trim() === '') {
          await GMessageBox.Show('MGW00018', "그룹코드ID"); // {0}을(를) 입력하세요. (그룹코드ID)
          
          return false;
        }

        // 2) 필수값: VALID_STRT_DD / VALID_END_DD
        if (!row.VALID_STRT_DD || !ymdOk(row.VALID_STRT_DD)) {
          await GMessageBox.Show('MGW00018', "적용일"); // 적용일
          
          return false;
        }
        if (!row.VALID_END_DD || !ymdOk(row.VALID_END_DD)) {
          await GMessageBox.Show('MGW00018', "만료일"); // 만료일
          
          return false;
        }

        // 3) 중복체크: CLSS_GRP_CD_ID
        const dupeCnt = (clssGroups||[])
          .concat(rows.filter(r=>r!==row))
          .filter(r => r.CLSS_GRP_CD_ID === row.CLSS_GRP_CD_ID && r.ROW_STATE !== 'D').length;
        if (dupeCnt > 1) {
          await GMessageBox.Show('MGW00024'); // 중복된 값 존재
          
          return false;
        }

        // 4) 날짜 범위 검사: start <= end
        if (toNum(row.VALID_STRT_DD) > toNum(row.VALID_END_DD)) {
          // Util.CheckTurnAroundFromToDate == false 대응
          await GMessageBox.Show('MGW00018'); // 날짜 범위 오류 메시지 테이블에 맞춰 교체 필요
          
          return false;
        }
      }
    } else if (type === 'C') {
      // 선택 그룹이 신규이면 우선 저장 요구
      if (drvSelectedClssCodeGroup?.ROW_STATE === 'I') {
        await GMessageBox.Show('MGN00020', 'Ok', "계층코드그룹"); // 먼저 저장해 주세요.
        return false;
      }

      for (const row of rows) {
        if (row.ROW_STATE === 'D') continue;
        // 1) 필수값: GRP_CD_ID
        if (!row.GRP_CD_ID || String(row.GRP_CD_ID).trim() === '') {
          await GMessageBox.Show('MGW00019',"Ok", "사용공통코드"); // 선택하세요
          
          return false;
        }
        // 2) 필수값: CD_VAL (또는 연결 공통코드 값)
        if (!row.CD_VAL || String(row.CD_VAL).trim() === '' || String(row.CD_VAL).trim() === '__SELECT__') {
          await GMessageBox.Show('MGW00019',"Ok", "연결코드");
          
          return false;
        }
      }
    }

    return true;
  };

  // ================== 조회 ==================
  const DataHasChanges = () => (hasGroupChanges || hasCodeChanges);

  const GetClssCodGroupData = async () => {
    // C#: MGQ00015 (변경데이터 존재 시 재조회 여부)
    if (bSearchFlag && DataHasChanges()) {
      const r = await GMessageBox.Show('MGQ00015', 'YesNo', 'warning', 'Warning');
      if (r === 'no') return;
    }

    try {
      const param = { CLSS_GRP_CD_DSC: grpNm ?? '' };
      // 실제 라우트로 교체 필요
      const { table } = await http.post('/admin/getclsscodegroup', param, { shape: 'datatable' });
      setClssGroups(table ?? []);
      setHasGroupChanges(false);

      if ((table ?? []).length > 0) {
        setDrvSelectedClssCodeGroup(table[0]);
        await GetClssCodeData(table[0]);
      } else {
        setDrvSelectedClssCodeGroup(null);
        setClssCodes([]);
        setDrvSelectedClssCode(null);
      }
    } catch (e) {
      console.error('[계층코드그룹] 조회 실패', e);
    } finally {
    }
  };

  const GetClssCodeData = async (grpRow = drvSelectedClssCodeGroup) => {
    if (!grpRow || !grpRow.CLSS_GRP_CD_ID) {
        setClssCodes([]);
        setDrvSelectedClssCode(null);
        return;
    }

    try {
        setLoadingCodes(true);
        const myReqId = ++codesReqRef.current; // 내 요청 번호
        const param = { CLSS_GRP_CD_ID: grpRow.CLSS_GRP_CD_ID };
        const { table } = await http.post('/admin/getclsscode', param, { shape: 'datatable' });

        // 뒤늦게 온 이전 요청이면 무시 (비동기 경쟁 방지)
        if (myReqId !== codesReqRef.current) return;

        // 트리 요구 키 보정
        const mapped = (table || []).map((r, i) => {
            // 루트 노드는 parentIdField를 null/undefined로 맞춰주자
            const parent = (r.UP_CLSS_CD_VAL && r.UP_CLSS_CD_VAL.trim() !== '') ? r.UP_CLSS_CD_VAL : null;

            return {
                id: r.CLSS_CD_VAL || `CLSS${String(i).padStart(7, '0')}`,
                ...r,
                // 👇 GRP_NM이 비어 있으면 CD_VAL_NM을 라벨로 사용 (없으면 코드값)
                GRP_NM: r.GRP_NM && String(r.GRP_NM).trim() !== '' 
                        ? r.GRP_NM 
                        : (r.CD_VAL_NM && String(r.CD_VAL_NM).trim() !== '' 
                            ? r.CD_VAL_NM 
                            : (r.CLSS_CD_VAL || '')),
                UP_CLSS_CD_VAL: parent,
            };
        });
        

        setClssCodes(mapped);
        setHasCodeChanges(false);

        // ✅ 선택 유지 로직
        if (drvSelectedClssCode) {
          const keep = mapped.find((x) => x.CLSS_CD_VAL === drvSelectedClssCode.CLSS_CD_VAL);
          setDrvSelectedClssCode(keep || mapped[0] || null);
        } else {
          setDrvSelectedClssCode(mapped[0] || null);
        }
    } catch (e) {
        console.error('[계층코드] 조회 실패', e);
    } finally {
        setLoadingCodes(false);
    }
  };

  // ================== 저장 ==================
  const SaveClssCodeGroup = async () => {
    const data = changes(clssGroups);
    if (data.length === 0) {
      await GMessageBox.Show('MGE00890', 'Ok', 'warning', 'Information');
      return;
    }

    
    if (!(await chkValidation('G', data))) return;

    const r = await GMessageBox.Show('MGE00890', 'YesNo', 'warning', 'Warning');
    if (r === 'no') return;

    try {
      await http.post('/admin/saveclsscodegroup', data, { shape: 'datarow' });
      setHasGroupChanges(false);
      await GetClssCodGroupData();
    } catch (e) {
      console.error('[계층코드그룹] 저장 실패', e);
    }
  };

  const SaveClssCode = async () => {
    const data = changes(clssCodes);
    if (data.length === 0) {
      await GMessageBox.Show('MGI00014', 'Ok', 'warning', 'Information');
      return;
    }

    if (!(await chkValidation('C', data))) return;


    var insertCnt = data.filter(b => b.ROW_STATE == 'I').length;
    var updateCnt = data.filter(b => b.ROW_STATE == 'U').length;
    var deleteCnt = data.filter(b => b.ROW_STATE == 'D').length;
    
    const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
    if (r === 'no') return;

    try {
      await http.post('/admin/saveclsscode', data, { shape: 'datarow' });
      setHasCodeChanges(false);
      await GetClssCodeData();
    } catch (e) {
      console.error('[계층코드] 저장 실패', e);
    }
  };

  // ================== Cache Deploy ==================
  const BtnCacheDeploy_Click = async () => {
    const r = await GMessageBox.Show('MGQ00066', 'YesNo', 'warning', 'Warning');
    if (r === 'no') return;
    try {
      await http.post('/admin/cachedeploy/classcode', {}, { shape: 'json' });
    } catch (e) {
      console.error('[CacheDeploy] 실패', e);
    }
  };

  // ================== 신규 행 템플릿 ==================
  const createNewGroupRow = () => ({
    ROW_STATE: 'I',
    CLSS_GRP_CD_ID: '',
    CLSS_GRP_CD_DSC: '',
    MEM_CREAT_OBJ_YN: 'Y',
    VALID_STRT_DD: dayjs().format('YYYYMMDD'),
    VALID_END_DD: '99991231',
  });

  const nextClssCodeVal = () => {
    const max = clssCodes.reduce((m, r) => {
      const n = Number((r.CLSS_CD_VAL || '').replace(/^CLSS/, '')) || 0;
      return Math.max(m, n);
    }, 0);
    return `CLSS${String(max + 1).padStart(7, '0')}`;
  };

  const createNewClssRow = (parent) => {
    var newClssCd = nextClssCodeVal();
    
    return {
    id: newClssCd, 
    ROW_STATE: 'I',
    CLSS_GRP_CD_ID: drvSelectedClssCodeGroup?.CLSS_GRP_CD_ID || '',
    CLSS_CD_VAL: newClssCd,
    UP_CLSS_CD_VAL: parent?.CLSS_CD_VAL || null,
    GRP_CD_ID: '',
    GRP_NM: '',
    CD_VAL: '',
    CD_VAL_NM: 'New' + newClssCd,
  };
}

const generateNewClssId = () => {
    var newClssCd = nextClssCodeVal();
    return newClssCd;
}

  // ================== 삭제 재귀 (ASIS DeleteClssCdList) ==================
  const DeleteClssCdList = (node) => {
    if (!node) return;
    const children = clssCodes.filter(r => r.UP_CLSS_CD_VAL === node.CLSS_CD_VAL);
    children.forEach(DeleteClssCdList);

    setClssCodes(prev => prev
      .map(r => {
        if (r.CLSS_CD_VAL !== node.CLSS_CD_VAL) return r;
        if (r.ROW_STATE === 'I') return null; // 신규는 물리 삭제
        return { ...r, ROW_STATE: 'D' };      // 기존은 D 처리
      })
      .filter(Boolean)
    );
    setHasCodeChanges(true);
  };

  // ================== 컬럼 ==================
  const groupColumns = useMemo(() => ([
    { headerName: '그룹코드ID', headerAlign: 'center', field: 'CLSS_GRP_CD_ID', width: 160, align: 'left', editable: true },
    { headerName: '설명',       headerAlign: 'center', field: 'CLSS_GRP_CD_DSC', flex: 1, align: 'left', editable: true },
    { headerName: '메모리생성대상', headerAlign: 'center', field: 'MEM_CREAT_OBJ_YN', width: 120, align: 'center', editable: true, type: 'singleSelect', valueOptions:[{value:'Y',label:'Yes'},{value:'N',label:'No'}]},
    { headerName: '적용일',     headerAlign: 'center', field: 'VALID_STRT_DD', width: 120, align: 'center', editable: true, displayAsYmd:true, renderEditCell:(p)=><GDateEditCell {...p} /> },
    { headerName: '만료일',     headerAlign: 'center', field: 'VALID_END_DD',  width: 120, align: 'center', editable: true, displayAsYmd:true, renderEditCell:(p)=><GDateEditCell {...p} /> },
  ]), []);

  // ================== 이벤트 ==================
  const handleSelectGroup = async (row) => {
    if (drvSelectedClssCodeGroup?.CLSS_GRP_CD_ID === row?.CLSS_GRP_CD_ID) return;

    if (DataHasChanges()) {
      const ok = window.confirm('변경된 데이터가 존재합니다! 무시하고 조회 하겠습니까?');
      if (!ok) return;
    }

    setDrvSelectedClssCodeGroup(row);
    await GetClssCodeData(row);
  };

  const updateSelectedClssCode = (patch) => {
    if (!drvSelectedClssCode) return;
    const next = {
      ...drvSelectedClssCode,
      ...patch,
      ROW_STATE: drvSelectedClssCode.ROW_STATE === 'I' ? 'I' : 'U',
    };
    setDrvSelectedClssCode(next);
    setClssCodes(prev => prev.map(r => (r.id === next.id ? next : r)));
    setHasCodeChanges(true);
  };



  // ================== 렌더 ==================
  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '그룹코드명',
              content: (
                <TextField
                  fullWidth
                  name="text"
                  value={grpNm}
                  onChange={(e) => setGrpNm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      GetClssCodGroupData();
                    }
                  }}
                  placeholder="그룹코드명 입력"
                />
              ),
            },
            {},
            {},
            {}
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={GetClssCodGroupData} />,
          ]}
        />
      </GSearchSection>

      {/* 상단: 계층코드그룹 그리드 */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid
          title="계층코드그룹"
          rows={clssGroups}
          columns={groupColumns}
          height={260}
          columnHeaderHeight={30}
          checkboxSelection
          rowHeight={25}
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          disableRowSelectionOnClick
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          createNewRow={createNewGroupRow}
          onRowsChange={(rows)=>{ setClssGroups(rows); setHasGroupChanges(true); }}
          onRowClick={(params)=>handleSelectGroup(params.row)}
          onRevertClick={GetClssCodGroupData}
        />
        <GButtonGroup>
          <GButton key="save" auth="Save" label="Save" onClick={SaveClssCodeGroup} disabled={!hasGroupChanges}/>
        </GButtonGroup>
      </GContentBox>

      {/* 하단: 트리 + 상세 */}
      <GContentBox flex={true}>
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          {/* 좌측: 계층코드 트리 */}
          <Box sx={{ flex: 5, minHeight: 0, overflow: 'hidden' }}>
            <GSimpleTreeGrid
              title="계층코드"
              rows={clssCodes}
              onRowsChange={(rows)=>{ setClssCodes(rows); setHasCodeChanges(true); }}
              idField="CLSS_CD_VAL"
              parentIdField="UP_CLSS_CD_VAL"
              labelField="CD_VAL_NM"
              selectedItem={drvSelectedClssCode}
              onSelectedItemChange={handleDrvSelectedClssCode}
              createNewRow={createNewClssRow}
              generateNewId={generateNewClssId}
              onDeleteRow={DeleteClssCdList}
              Buttons={{ add:true, delete:true, revert:true, excel:false }}
              onRevertClick={()=> drvSelectedClssCodeGroup && GetClssCodeData(drvSelectedClssCodeGroup)}
              sx={{ height: '100%' }}
              loading={loadingCodes}
            />
          </Box>

          {/* 우측: 계층코드 상세 */}
          <Stack flex={5} sx={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <GDetailTitle title="계층코드 상세" />

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
                <GLayoutItem label="그룹코드" labelWidth={160}>
                  <GTextField 
                    value={drvSelectedClssCode?.CLSS_GRP_CD_ID || drvSelectedClssCodeGroup?.CLSS_GRP_CD_ID || ''} 
                    isReadOnly={true} 
                  />
                </GLayoutItem>
                <GLayoutItem label="부모코드" labelWidth={160}>
                  <GTextField 
                    value={drvSelectedClssCode?.UP_CLSS_CD_VAL || ''} 
                    fieldName="UP_CLSS_CD_VAL"
                    onFieldChange={(field, value) => updateSelectedClssCode({ UP_CLSS_CD_VAL: value })} 
                  />
                </GLayoutItem>
                <GLayoutItem label="계층코드" labelWidth={160}>
                  <GTextField 
                    value={drvSelectedClssCode?.CLSS_CD_VAL || ''} 
                    isReadOnly={true} 
                  />
                </GLayoutItem>
                <GCodePicker
                  label="사용공통코드(그룹유형)"
                  valueVar = '코드ID'           // GPopup에서 가져다 쓸 Value
                  displayVar = '코드명'         // GPopup에서 가져다 쓸 display
                  value={drvSelectedClssCode?.CD_VAL || ''}
                  labelWidth={160}
                  display={drvSelectedClssCode?.GRP_NM || ''} 
                  onChange={(val, row) => {
                    updateSelectedClssCode({
                      GRP_CD_ID: val,
                      GRP_NM: row?.코드명 || '',
                      CD_VAL : '__SELECT__',
                      CD_VAL_NM : ''
                    });

                    // 사용공통코드 값 변경 시, 연결코드 콤보 박스를 재조회 한다.
                    getCboCache(val);
                  }}
                  cacheKey="SEARCH_COMMOMCODEGRP"     // GCodePicker의 서버단 쿼리 중 하나로, 별개의 쿼리가 필요할 시 직접 추가할 것.
                />

                <GLayoutItem label="연결코드" labelWidth={160}>
                  <GSelectBox
                    items={cbGrpCode}
                    valueKey="CD_VAL"
                    labelKey="CD_VAL_NM"
                    // 불러온 연결코드의 item이 존재하면 값을 Set한다. 안하면 warning 뜸.
                    value={cbGrpCode.some(v => String(v.CD_VAL) == drvSelectedClssCode?.CD_VAL) ? drvSelectedClssCode?.CD_VAL || '' : ''}
                    fieldName="CD_VAL_NM"
                    onChange={(val, row) => {
                      if (!drvSelectedClssCode) return;
                      updateSelectedClssCode({
                        CD_VAL: val,
                        CD_VAL_NM: row?.CD_VAL_NM ?? '',
                      });
                    }}
                  />
                </GLayoutItem>
              </GLayoutGroup>
            </Box>

            <GButtonGroup>
              <GButton auth="CacheDeploy" label="Cache Deploy" onClick={BtnCacheDeploy_Click} />
              <GButton key="Save" auth="Save" label="Save" disabled={!hasCodeChanges} onClick={SaveClssCode} />
            </GButtonGroup>
          </Stack>
        </Stack>
      </GContentBox>

    </GPageContainer>
  );
}