import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useGridApiRef } from '@mui/x-data-grid';
import { Box, Stack, Button, TextField, MenuItem, InputAdornment, IconButton } from '@mui/material';
import { SearchOutlined } from '@ant-design/icons';

// ========================= 사내 공통 컴포넌트/유틸 (ASIS 패턴 유지) =========================
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox';
import GSelectBox from '@/components/GSelectBox.jsx';
import { http } from '@/libs/TaskHttp';
import { changes } from '@/libs/Utils';
import GTitleIcon from '@/components/GTitleIcon';
import GButton from '@/components/GButton';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GDetailTitle from '@/components/GDetailTitle';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';

// ================================== 컴포넌트 ==================================
export default function GPCLOPRCD04S1() {
  // ---------- 검색 영역 ----------
  const [msgClssCd, setMsgClssCd] = useState('');      // 메세지분류
  const [msgContn, setMsgContn]   = useState('');      // 메세지 내용(한/영 검색)

  const gridApiRef = useGridApiRef();

  // ---------- 공통 코드 ----------
  const [codesMsgClssCd, setCodesMsgClssCd] = useState([]);  // MSG_CLSS_CD(분류)
  const [codesTrMsgTpCd, setCodesTrMsgTpCd] = useState([]);  // MSG_TP_CD(유형)
  const [codesMsgButnCd, setCodesMsgButnCd] = useState([]);  // MSG_BUTN_CD(버튼)

  // ---------- 그리드 상태 ----------
  const [dtMessageCode, setDtMessageCode] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const drvSelected = useMemo(
    () => dtMessageCode.find(r => r.id === selectedId) || null,
    [dtMessageCode, selectedId]
  );
  const [loading, setLoading]       = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isNew = !!drvSelected && drvSelected.ROW_STATE === 'I';
  const isExisting = !!drvSelected && !isNew;

  // ────────────────────── 서버 통신 ──────────────────────
  const InitializeControl = async () => {
    // 공통코드 로딩 순서 보장
    try {
      // 메세지분류
      const { table: clss } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'MSG_CLSS_CD' },
        { shape: 'datatable' }
      );
      setCodesMsgClssCd(Array.isArray(clss) ? clss : []);

      // 메세지유형
      const { table: tp } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'MSG_TP_CD' },
        { shape: 'datatable' }
      );
      setCodesTrMsgTpCd(Array.isArray(tp) ? tp : []);

      // 버튼코드
      const { table: btn } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'MSG_BUTN_CD' },
        { shape: 'datatable' }
      );
      setCodesMsgButnCd(Array.isArray(btn) ? btn : []);

      // 검색 콤보 기본값 세팅(없으면 첫 값)
      setMsgClssCd(prev => prev || clss?.[0]?.CD_VAL || '');
    } catch (e) {
      console.error('[공통코드] 조회 실패', e);
      GMessageBox.Show('MGW00001');
    }
  };

  const InitializeEvent = () => { /* ASIS 이벤트 → JSX 핸들러로 대체 */ };

  const OnFormLoaded = async () => {
    await InitializeControl(); // 코드 먼저
    InitializeEvent();
    await GetMessageCode();    // 조회 다음
  };

  useEffect(() => { OnFormLoaded(); }, []);

  // ========== Validation (ASIS ChkValidation 반영) ==========
  const ChkValidation = (rows) => {
    for (const row of rows) {
      if (row.ROW_STATE === 'D') continue;
      if (!row.MSG_CLSS_NM)   { GMessageBox.Show('MGW00019', 'Ok', '메세지분류'); return false; }
      if (!row.TR_MSG_TP_NM)  { GMessageBox.Show('MGW00019', 'Ok', '메세지유형'); return false; }
      if (!row.MSG_BUTN_NM)   { GMessageBox.Show('MGW00019', 'Ok', '버튼 유형'); return false; }
      if (!row.MSG_KOR_CONTN) { GMessageBox.Show('MGW00018', 'Ok', '한글메세지'); return false; }
      // MSG_ID 8자리 규칙(영문3 + 숫자5) – C# MGW01154 근거(필요 시 조정)
      if (row.MSG_ID && !(String(row.MSG_ID).length === 8)) { GMessageBox.Show('MGW01154'); return false; }
    }
    return true;
  };

  // ========== 변경 플래그 ==========
  const DataHasChanges = () => hasChanges;

  // ========== 조회 ==========
  const GetMessageCode = async () => {
    if (DataHasChanges()) {
      const r = await GMessageBox.Show('MGQ00015', 'YesNo', 'warning', 'Warning'); // 변경 무시 후 조회?
      // PSW Log 임시
      if (String(r).toLowerCase() !== 'yes') return;
      
    }

    setLoading(true);
    try {
      const param = { MSG_CLSS_CD: msgClssCd, MSG_CONTN: msgContn ?? '' };
      const { table } = await http.post('/message/getMessageCode', param, { shape: 'datatable' });

      const mapped = (table || []).map((r, i) => ({
        id: r.MSG_ID || `MSG${String(i).padStart(7, '0')}`,
        ROW_STATE: r.ROW_STATE || '',
        ...r,
      }));

      setDtMessageCode(mapped);
      setHasChanges(false);
    } catch (e) {
      console.error('[메세지코드] 조회 실패', e);
    } finally { setLoading(false); }
  };

  // ========== 저장 ==========
  const SaveMessageCode = async () => {
    const data = changes(dtMessageCode);
    if (data.length === 0) { GMessageBox.Show('MGI00014','Ok'); return; }
    if (!ChkValidation(data)) return;

    
    var insertCnt = data.filter(b => b.ROW_STATE == 'I').length;
    var updateCnt = data.filter(b => b.ROW_STATE == 'U').length;
    var deleteCnt = data.filter(b => b.ROW_STATE == 'D').length;
    // const r = await GMessageBox.Show('MGQ00002', 'YesNo'); // 저장하시겠습니까?
    const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
    
    if (String(r).toLowerCase() !== 'yes') return;

    try {
      await http.post('/message/savemessagecode', data, { shape: 'datarow' });
      setHasChanges(false);
      await GetMessageCode();
    } catch (e) { console.error('[메세지코드] 저장 실패', e); }
  };

  // ========== Cache Deploy ==========
  const BtnCacheDeploy_Click = async () => {
    // 필요 시 엔드포인트 연결
    // const r = await GMessageBox.Show('MGQ00066');
    // if (String(r).toLowerCase() !== 'yes') return;
    // await http.post('/admin/cachedeploy/messagecode', {}, { shape: 'json' });
  };

  // ========== 신규 행/편집 ==========
  const createNewRow = () => ({
    id: `NEW${Date.now()}`,
    ROW_STATE: 'I',
    MSG_ID: '',        // 접두(prefix)+번호(아래 setMsgId에서 계산)
    MSG_ID_NUM: '',
    MSG_CLSS_CD: msgClssCd || (codesMsgClssCd[0]?.CD_VAL || ''),
    MSG_CLSS_NM: codesMsgClssCd.find(c=>c.CD_VAL===msgClssCd)?.CD_VAL_NM || codesMsgClssCd[0]?.CD_VAL_NM || '',
    MSG_TP_CD:   '',
    TR_MSG_TP_NM: '',
    MSG_KOR_CONTN: '',
    MSG_ENG_CONTN: '',
    MSG_BUTN_CD: 'OK',
    MSG_BUTN_NM: 'OK',
    REG_ID: '', LST_ADJPRN_ID: '',
    REG_DDTM: dayjs().format('YYYYMMDDHHmmss'),
    LST_ADJ_DDTM: dayjs().format('YYYYMMDDHHmmss'),
  });

  const updateRow = (rowId, patch) => {
    setDtMessageCode(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const next = { ...r, ...patch };
      if (next.ROW_STATE !== 'I') next.ROW_STATE = 'U';
      return next;
    }));
    setHasChanges(true);
  };

  const onDeleteRow = (row) => {
    setDtMessageCode(prev => prev
      .map(r => (r.id===row.id) ? (r.ROW_STATE==='I'? null : { ...r, ROW_STATE:'D' }) : r)
      .filter(Boolean));
    setHasChanges(true);
  };

  // ========== MSG_ID 생성 (ASIS setMsgId/KeyUp 로직) ==========
  const calcPrefix = (row) => {
    const clss = codesMsgClssCd.find(c => c.CD_VAL === (row.MSG_CLSS_CD || msgClssCd));
    const type = codesTrMsgTpCd.find(c => c.CD_VAL === row.MSG_TP_CD);
    const p1 = clss?.CD_ADD_INFO_VAL1 || '';
    const p2 = type?.CD_ADD_INFO_VAL1 || '';
    return `${p1}${p2}`;
  };
  const setMsgId = (rowId) => {
    setDtMessageCode(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      if (r.ROW_STATE !== 'I') return r; // 신규행에서만 자동 조합
      const prefix = calcPrefix(r);
      const num = (r.MSG_ID_NUM||'').replace(/[^0-9]/g,'');
      const msgId = `${prefix}${num}`;
      return { ...r, MSG_ID: msgId };
    }));
  };

  const onAddRow = () => {
    const newRow = createNewRow();

    const rid = `NEW_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    newRow.__rid = rid;

    setDtMessageCode(prev => [newRow, ...prev]);
    setHasChanges(true);

    // ✅ 콜백식: 렌더/그리드 상태 반영된 뒤 apiRef로 스크롤+포커스
    const focusField = 'MSG_KOR_CONTN';

    const tryFocus = (triesLeft = 10) => {
      requestAnimationFrame(() => {
        const api = gridApiRef.current;
        if (!api) return;

        // rows가 아직 반영 전이면 재시도
        const allIds = api.getAllRowIds?.() || [];
        if (!allIds.includes(rid)) {
          if (triesLeft > 0) return tryFocus(triesLeft - 1);
          return;
        }

        // ✅ (prepend라면 보통 0번째. 그래도 안전하게 index 계산)
        const rowIndex =
          api.getRowIndexRelativeToVisibleRows?.(rid) ??
          allIds.indexOf(rid);

        // 스크롤
        api.scrollToIndexes?.({ rowIndex: Math.max(0, rowIndex), colIndex: 0 });

        // 셀 포커스
        api.setCellFocus?.(rid, focusField);
      });
    };

    tryFocus();

    // 선택/상세는 너 기존 로직이 row.id 기준이니까 그대로 유지하려면 아래처럼
    setSelectedId(newRow.id);
  };

  // ========== 컬럼 ==========
  const columns = useMemo(() => ([
    { headerName: '메세지분류', field: 'MSG_CLSS_NM',  headerAlign: 'center', width: 140, align: 'left', editable: false },
    { headerName: '메세지코드', field: 'MSG_ID',       headerAlign: 'center', width: 140, align: 'left', editable: false },
    { headerName: '메세지유형', field: 'TR_MSG_TP_NM', headerAlign: 'center', width: 140, align: 'left', editable: false },
    { headerName: '한글메세지', field: 'MSG_KOR_CONTN', flex: 1, minWidth: 260, align: 'left', editable: false },
    { headerName: '영문메세지', field: 'MSG_ENG_CONTN', flex: 1, minWidth: 260, align: 'left', editable: false },
    { headerName: '버튼유형',   field: 'MSG_BUTN_NM',  headerAlign: 'center', width: 120, align: 'center', editable: false },
  ]), []);

  // ========== 렌더 ==========
  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '메세지분류',
              content: (
                <GSelectBox 
                  items={codesMsgClssCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={msgClssCd}
                  onChange={(v) => setMsgClssCd(v)}
                />
              ),
            },
            {
              header: '메세지 내용',
              content: (
                <TextField
                  fullWidth
                  name="text"
                  value={msgContn}
                  onChange={(e) => setMsgContn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      GetMessageCode();
                    }
                  }}
                  placeholder="단어명 입력"
                />
              ),
            },
            {},
            {}
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={GetMessageCode} />
          ]}
        />
      </GSearchSection>

      {/* 상단: 시스템 메세지 그리드 */}
      <GContentBox flex={true}>
        <GDataGrid
          title={`시스템 메세지 Total (${dtMessageCode.length})`}
          rows={dtMessageCode}
          columns={columns}
          rowHeight={25}
          columnHeaderHeight={30}
          loading={loading}
          checkboxSelection
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          disableRowSelectionOnClick
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          onRowsChange={(rows)=>{ setDtMessageCode(rows); setHasChanges(true); }}
          onAddClick={onAddRow}
          apiRef={gridApiRef}
          onDeleteRow={onDeleteRow}
          onRevertClick={GetMessageCode}
          selectedItem={drvSelected}
          onRowClick={(params)=> setSelectedId(params.row.id)}
          onSelectedItemChange={(row)=> setSelectedId(row?.id)}
        />
        </GContentBox>

      <GContentBox flex={false}>
        <GButtonGroup>
          <GButton auth="CacheDeploy" label="Cache Deploy" onClick={BtnCacheDeploy_Click} />
          <GButton key="Save" auth="Save" label="Save" disabled={!hasChanges} onClick={SaveMessageCode} />
        </GButtonGroup>
      </GContentBox>

      {/* 하단: 메세지 상세 */}
      <GContentBox flex={false}>
        <GDetailTitle title="메세지 상세" />
        <Box sx={{ overflow: 'auto' }}>
          <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
            <GLayoutGroup orientation="horizontal">
              <GLayoutItem label="메세지분류" labelWidth={160}>
                <GSelectBox
                  items={codesMsgClssCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  value={drvSelected?.MSG_CLSS_CD || ''}
                  fieldName="MSG_CLSS_CD"
                  onFieldChange={(field, value) => {
                    if (!drvSelected) return;
                    const selected = codesMsgClssCd.find(c => c.CD_VAL === value);
                    updateRow(drvSelected.id, {
                      MSG_CLSS_CD: value,
                      MSG_CLSS_NM: selected?.CD_VAL_NM || ''
                    });
                    setTimeout(() => setMsgId(drvSelected.id), 0);
                  }}
                  disabled={isExisting}
                />
              </GLayoutItem>
              <GLayoutItem label="메세지유형" labelWidth={160}>
                <GSelectBox
                  items={codesTrMsgTpCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  value={drvSelected?.MSG_TP_CD || ''}
                  fieldName="MSG_TP_CD"
                  onFieldChange={(field, value) => {
                    if (!drvSelected) return;
                    const selected = codesTrMsgTpCd.find(c => c.CD_VAL === value);
                    updateRow(drvSelected.id, {
                      MSG_TP_CD: value,
                      TR_MSG_TP_NM: selected?.CD_VAL_NM || ''
                    });
                    setTimeout(() => setMsgId(drvSelected.id), 0);
                  }}
                  disabled={isExisting}
                />
              </GLayoutItem>
            </GLayoutGroup>

            <GLayoutGroup orientation="horizontal">
              <GLayoutItem label="메세지코드" labelWidth={160}> 
                <GTextField 
                  value={drvSelected?.MSG_ID || ''} 
                  readOnly={true} 
                />
              </GLayoutItem>
              <GLayoutItem label="메세지코드(직접입력)" labelWidth={160}>
                <GTextField
                  value={drvSelected?.MSG_ID_NUM ?? ''}
                  fieldName="MSG_ID_NUM"
                  onFieldChange={(field, value) => {
                    if (!drvSelected) return;
                    const onlyDigits = (value || '').replace(/\D/g, '').slice(0, 5);
                    updateRow(drvSelected.id, { MSG_ID_NUM: onlyDigits });
                    setTimeout(() => setMsgId(drvSelected.id), 0);
                  }}
                  readOnly={isExisting}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 5,
                  }}
                />
              </GLayoutItem>
            </GLayoutGroup>

            <GLayoutGroup orientation="horizontal">
              <GLayoutItem label="한글내용" labelWidth={160} height={60}>
                <GTextField 
                  value={drvSelected?.MSG_KOR_CONTN ?? ''}
                  fieldName="MSG_KOR_CONTN"
                  onFieldChange={(field, value) => drvSelected && updateRow(drvSelected.id, { MSG_KOR_CONTN: value })}
                  minRows={1}
                />
              </GLayoutItem>
              <GLayoutItem label="영문내용" labelWidth={160} height={60}>
                <GTextField 
                  value={drvSelected?.MSG_ENG_CONTN || ''}
                  fieldName="MSG_ENG_CONTN"
                  onFieldChange={(field, value) => drvSelected && updateRow(drvSelected.id, { MSG_ENG_CONTN: value })}
                  minRows={1}
                />
              </GLayoutItem>
            </GLayoutGroup>

            <GLayoutGroup orientation="horizontal">
              <GLayoutItem label="버튼코드" labelWidth={160}>
                <GSelectBox
                  items={codesMsgButnCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  value={drvSelected?.MSG_BUTN_CD || ''}
                  fieldName="MSG_BUTN_CD"
                  onFieldChange={(field, value) => {
                    if (!drvSelected) return;
                    const selected = codesMsgButnCd.find(c => c.CD_VAL === value);
                    updateRow(drvSelected.id, {
                      MSG_BUTN_CD: value,
                      MSG_BUTN_NM: selected?.CD_VAL_NM || ''
                    });
                  }}
                />
              </GLayoutItem>
              <GLayoutItem>
              </GLayoutItem>
            </GLayoutGroup>


            
          </GLayoutGroup>
        </Box>
      </GContentBox>
    </GPageContainer>
  );
}