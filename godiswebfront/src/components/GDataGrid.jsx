// GDataGrid.jsx — 상태(I/U/D) + (+/–/되돌리기/엑셀) + __rid 내부키 + 날짜표시 자동 포맷
import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GTitleIcon from '@/components/GTitleIcon.jsx';

const INTERNAL_KEY = '__rid';     // 내부 고정 키
const STATE_FIELD  = 'ROW_STATE'; // I/U/D 기본값

/* ===== 날짜 표시 유틸: Date | "YYYYMMDD" | "YYYY-MM-DD" -> "YYYY-MM-DD" ===== */
function ymdDashed(v) {
  if (v == null) return '';
  // Date 객체
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v);
  // 이미 하이픈 들어있으면 숫자만 추출해 재조립
  const digits = s.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  }
  return s;
}

/* ===== 컴포넌트 ===== */
export default function GDataGrid({
  /* 타이틀 */
  title,
  showTitle = true,
  titleSx,
  titleIcon,
  titleIconSize = 16,
  titleIconColor,

  /* 레이아웃 */
  height = "100%",

  /* 버튼(한 속성) — 배열/문자열/객체 지원 */
  Buttons, // [add, delete, revert, excel] | "1 1 1 0" | {add,delete,revert,excel}

  /* 상태 컬럼/편집 제어 */
  enableRowState = true,       // 상태컬럼 활성화 (기본 on)
  stateField = STATE_FIELD,    // 'I' | 'U' | 'D' 저장 필드명

  /** 새 행 템플릿(선택) — 제공하면 내부 기본값에 병합됩니다 */
  createNewRow,                // () => partialRow
  /** rows 변경 콜백(선택/컨트롤드) */
  onRowsChange,

  /* CSV */
  excelFileName = 'export.csv',

  /* 기존 DataGrid props */
  rows,
  columns = [],
  ...rest
}) {

  const theme = useTheme();

  /* ----- 버튼 플래그 정규화 ----- */
  const flags = React.useMemo(
  () => normalizeButtons(Buttons),
  [Buttons]
  );

  /* ----- __rid 생성/주입 유틸 ----- */
  const genRid = React.useCallback(
    (prefix='RID') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    []
  );

  const ensureRid = React.useCallback((row, i=0, prefix='ROW') => {
    if (!row) return row;
    if (row[INTERNAL_KEY]) return row;
    return { ...row, [INTERNAL_KEY]: genRid(prefix) };
  }, [genRid]);

  const ensureRidArray = React.useCallback((arr, prefix='ROW') =>
    (Array.isArray(arr) ? arr : []).map((r, i) => ensureRid(r, i, prefix)), [ensureRid]);

  /* ----- 로컬 rows 상태 (언컨트롤드 fallback) + __rid 주입 ----- */
  const [localRaw, setLocalRaw] = React.useState(() => ensureRidArray(rows ?? [], 'INIT'));
  React.useEffect(() => { if (rows) setLocalRaw(ensureRidArray(rows, 'PROP')); }, [rows, ensureRidArray]);

  // 항상 __rid가 있는 배열만 DataGrid에 넣음
  const dataForGrid = React.useMemo(() => ensureRidArray(localRaw, 'GRID'), [localRaw, ensureRidArray]);

  const setRowsSafe = (updater) => {
    const next = typeof updater === 'function' ? updater(dataForGrid) : updater;
    const withRid = ensureRidArray(next, 'SET');
    if (onRowsChange) onRowsChange(withRid);
    else setLocalRaw(withRid);
  };

  /* ----- 선택 모델 저장(반드시 __rid 기준) ----- */
  const selectionRef = React.useRef([]);
  const toArray = (m) => Array.isArray(m) ? m : Array.from((m && m.ids) || []);
	const handleSelectionV6 = (m) => {
	  let ids = [];
	  
	  if (Array.isArray(m)) {
	    ids = m;
	  } else if (m && typeof m === 'object') {
	    // 전체 선택: {type: 'exclude', ids: Set(0)}
	    if (m.type === 'exclude' && m.ids instanceof Set && m.ids.size === 0) {
	      ids = dataForGrid.map(r => r[INTERNAL_KEY]);
	    }
	    // 일부 선택: Set이나 {ids: Set}
	    else if (m instanceof Set) {
	      ids = Array.from(m);
	    } else if (m.ids instanceof Set) {
	      ids = Array.from(m.ids);
	    }
	  }
	  
	  console.log('✨ 최종 선택된 IDs:', ids);
	  selectionRef.current = ids;
	  rest.onRowSelectionModelChange?.(m);
	};
  const handleSelectionV5 = (m) => {
    selectionRef.current = toArray(m);
    rest.onSelectionModelChange?.(m);
  };

  /* ----- 새 행 추가 / 삭제표시 / 되돌리기 ----- */
  const clearSelection = () => {
    selectionRef.current = [];
    rest.onRowSelectionModelChange?.([]);
    rest.onSelectionModelChange?.([]);
  };

  const doAdd = () => {
    const base = { [INTERNAL_KEY]: genRid('NEW'), [stateField]: 'I' };
    const extra = (typeof createNewRow === 'function') ? (createNewRow() || {}) : {};
    const newRow = { ...base, ...extra, [INTERNAL_KEY]: base[INTERNAL_KEY], [stateField]: 'I' };
    setRowsSafe(prev => [newRow, ...prev]);
    clearSelection();
  };

  const doDeleteMark = () => {
    const ids = selectionRef.current; // __rid 배열
    if (!ids?.length) return;

    setRowsSafe(prev => prev.flatMap(r => {
      if (!ids.includes(r[INTERNAL_KEY])) return [r];
      const curState = r[stateField];
      if (curState === 'I') return [];           // 새로 추가된(I) 것은 완전 제거
      return [{ ...r, [stateField]: 'D' }];      // 그 외는 D로 표시
    }));
    clearSelection();
  };

  const doRevert = () => {
    const ids = selectionRef.current; // __rid 배열
    if (!ids?.length) return;
    setRowsSafe(prev => prev.map(r => {
      if (!ids.includes(r[INTERNAL_KEY])) return r;
      if (r[stateField] === 'I') return null; // I: 추가 취소 = 제거
      if (r[stateField] === 'U' || r[stateField] === 'D') {
        const { [stateField]: _, ...restRow } = r;
        return restRow; // 상태 되돌리기
      }
      return r;
    }).filter(Boolean));
    clearSelection();
  };

  /* ----- 편집 시 U 표시(processRowUpdate) + 즉시 rows 반영 ----- */
  const processRowUpdate = (incomingNewRow, oldRow) => {
    if (oldRow?.[stateField] === 'D') return oldRow; // D는 편집 불가

    let nextRow = incomingNewRow;
    if (enableRowState) {
      if (oldRow?.[stateField] !== 'I' && hasRowChanged(incomingNewRow, oldRow)) {
        nextRow = { ...incomingNewRow, [stateField]: 'U' };
      }
    }

    setRowsSafe(prev =>
      prev.map(r => (r[INTERNAL_KEY] === nextRow[INTERNAL_KEY] ? nextRow : r))
    );
    return nextRow;
  };

  /* ----- 상태 컬럼 구성 ----- */
  const statusCol = enableRowState ? [{
    field: stateField,
    headerName: '',
    width: 36,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (p) => <StateBadge value={p.value} />,
  }] : [];

  /* ----- 컬럼 병합 + 날짜 표시 자동 포맷터 주입 ----- */
const mergedColumns = React.useMemo(() => {
    const hasStateField = columns.some(c => c.field === stateField);
    const base = hasStateField ? columns : [...statusCol, ...columns];

    const withFormatters = base.map(col => {
      const wantsYmd = col.displayAsYmd === true || col.type === 'date';

      if (!wantsYmd) return col;

      // 보기 모드에서 항상 YYYY-MM-DD로 그리기 (값이 'YYYYMMDD'거나 Date여도 안전)
      const renderCell =
        typeof col.renderCell === 'function'
          ? col.renderCell
          : (params) => {
              const raw =
                params?.value ??
                (params?.row ? params.row[col.field] : undefined);
              const text = ymdDashed(raw);
              return <span>{text}</span>;
            };

      // CSV/내부값 포맷을 위한 valueFormatter (있으면 존중)
      const valueFormatter =
        typeof col.valueFormatter === 'function'
          ? col.valueFormatter
          : ({ value, row }) => ymdDashed(value ?? row?.[col.field]);

      // ⚠️ MUI의 date 내부 파서와 충돌 피하려면 type은 문자열로 두는 게 안전
      const safeType = col.displayAsYmd ? 'string' : col.type;

      return { ...col, type: safeType, renderCell, valueFormatter };
    });

    return withFormatters;
  }, [columns, stateField]);

  /* ----- hide: true인 컬럼들을 columnVisibilityModel에 추가 ----- */
  const columnVisibilityModel = React.useMemo(() => {
    const hiddenCols = {};
    mergedColumns.forEach(col => {
      if (col.hide === true && col.field) {
        hiddenCols[col.field] = false;
      }
    });
    return hiddenCols;
  }, [mergedColumns]);

  /* ----- CSV Export (상태/내부키 제외, hide 컬럼은 포함) ----- */
  const exportToCSV = () => {
    const data = dataForGrid;
    if (!data?.length || !mergedColumns?.length) return;
    // 엑셀 다운로드 시에는 hide: true인 컬럼도 포함 (화면에서는 숨겨져 있지만 엑셀에는 포함)
    // excelHidden: true로 명시적으로 설정된 컬럼만 제외
    const visibleCols = mergedColumns.filter(c =>
      !!c.field && c.excelHidden !== true && c.field !== stateField && c.field !== INTERNAL_KEY
    );

    const header = visibleCols.map(c => safeCSV(c.headerName ?? c.field)).join(',');
    const body = data.map(r => visibleCols.map(c => safeCSV(readValue(r, c))).join(','));
    const csv = ['\uFEFF' + header, ...body].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = excelFileName.endsWith('.csv') ? excelFileName : `${excelFileName}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ----- 버튼 핸들러: 외부 콜백 우선, 없으면 기본 동작 ----- */
  const onAdd    = rest.onAddClick    || doAdd;
  const onDelete = rest.onDeleteClick || doDeleteMark;
  const onRevert = rest.onRevertClick || doRevert;

  /* ----- 렌더 ----- */
  const showTopBar =
    (showTitle && !!title) ||
    (flags.add || flags.delete || flags.revert || flags.excel);

  return (
    <Box sx={{ width:'100%', height:Number.isFinite(height)?height:height, display:'flex', flexDirection:'column' }}>
      {showTopBar && (
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:1, p:1, pt:0 }}>
          {showTitle && !!title ? (
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Box sx={{ display:'inline-flex', alignItems:'center' }}>
                {titleIcon ? titleIcon : <GTitleIcon size={titleIconSize} color={titleIconColor || '#1976d2'} />}
              </Box>
              <Typography variant="subtitle1" sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary, ...titleSx }}>
                {title}
              </Typography>
            </Box>
          ) : <span />}

          <Box sx={{ display:'flex', gap:0.5 }}>
            {flags.add && (
              <Tooltip title="추가">
                <IconButton size="small" onClick={onAdd} sx={getBtnSxRed(theme)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {flags.delete && (
              <Tooltip title="삭제표시 / 해제 (I는 제거)">
                <IconButton size="small" onClick={onDelete} sx={getBtnSxRed(theme)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {flags.revert && (
              <Tooltip title="되돌리기">
                <IconButton size="small" onClick={onRevert} sx={getBtnSxRed(theme)}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {flags.excel && (
              <Tooltip title="엑셀 다운로드 (CSV)">
                <IconButton size="small" onClick={exportToCSV} sx={getBtnSxExcel(theme)}>
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ flex:1, minHeight:0 }}>
         <DataGrid
          {...rest}
          getRowId={(row) => row[INTERNAL_KEY]}
          rows={dataForGrid}
          columns={mergedColumns}
          columnVisibilityModel={columnVisibilityModel}
          autoHeight={false}
          processRowUpdate={processRowUpdate}
          isCellEditable={(params) => params.row?.[stateField] !== 'D'}
          getRowClassName={(params) => rowClassName(params.row?.[stateField])}
          onRowSelectionModelChange={handleSelectionV6}
          onSelectionModelChange={handleSelectionV5}
          experimentalFeatures={{ newEditingApi: true }}
          sx={{
            ...(rest.sx || {}),

            // 헤더 영역 컨테이너
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.dataGrid.headerBg,
              color: theme.palette.dataGrid.headerText,
            },

            // 각 헤더 셀(실제 배경은 여기서 다시 칠해져서 이걸 꼭 덮어야 함)
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeader--moving': {
              backgroundColor: theme.palette.dataGrid.headerBg,
              color: theme.palette.dataGrid.headerText,
            },

            // 헤더 텍스트
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              color: theme.palette.dataGrid.headerText,
            },

            // 스크롤바 스타일
            '& ::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '& ::-webkit-scrollbar-thumb': {
              borderRadius: '4px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(0, 0, 0, 0.3)',
              },
            },
            '& ::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        />
      </Box>

    </Box>
  );
}

/* ===== 상태 뱃지 표시 ===== */
function StateBadge({ value }) {
  if (value === 'I') return <BadgeDot bg="#2e7d32" label="I" title="Inserted" />;
  if (value === 'U') return <BadgeDot bg="#ef6c00" label="U" title="Updated" />;
  if (value === 'D') return <BadgeDot bg="#c62828" label="D" title="Deleted" />;
  return null;
}
function BadgeDot({ bg, label, title }) {
  return (
    <span title={title} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:20, height:20, borderRadius:6, background:bg, color:'#fff',
      fontSize:11, fontWeight:700, lineHeight:'20px'
    }}>{label}</span>
  );
}

/* ===== 유틸 ===== */
function hasRowChanged(a, b) {
  const omit = new Set([ STATE_FIELD, INTERNAL_KEY ]);
  const ka = Object.keys(a || {}).filter(k => !omit.has(k));
  const kb = Object.keys(b || {}).filter(k => !omit.has(k));
  if (ka.length !== kb.length) return true;
  for (const k of ka) {
    if (a[k] instanceof Date && b[k] instanceof Date) {
      if (a[k].getTime() !== b[k].getTime()) return true;
    } else if (a[k] !== b[k]) return true;
  }
  return false;
}
function safeCSV(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
function readValue(row, col) {
  // valueGetter가 있으면 먼저 시도
  if (typeof col.valueGetter === 'function') {
    try { 
      const result = col.valueGetter({ row, field: col.field, value: row[col.field] });
      // valueGetter가 값을 반환했으면 그대로 사용
      if (result != null && result !== '') {
        return result;
      }
    } catch (e) {
      // 에러 발생 시 로그 출력 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.warn('valueGetter error for field', col.field, e);
      }
    }
  }
  // valueGetter가 없거나 실패한 경우 원본 값 가져오기
  const val = row[col.field];
  // valueFormatter가 있으면 적용
  if (typeof col.valueFormatter === 'function') {
    try { 
      const formatted = col.valueFormatter({ value: val, row, field: col.field });
      // valueFormatter가 값을 반환했으면 사용
      if (formatted != null && formatted !== '') {
        return formatted;
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('valueFormatter error for field', col.field, e);
      }
    }
  }
  // valueOptions가 있는 경우 코드값을 코드명으로 변환
  if (col.valueOptions && Array.isArray(col.valueOptions) && val != null) {
    const option = col.valueOptions.find(opt => opt.value === val);
    if (option && option.label) {
      return option.label;
    }
  }
  return val;
}
function normalizeButtons(Buttons) {
  const defaults = { 
    add: false,     // true → false
    delete: false,  // true → false
    revert: false,  // true → false
    excel: false    // true → false
  };
  if (Buttons == null) return defaults;
  if (Array.isArray(Buttons)) {
    const [a,d,r,e] = Buttons;
    return { add:a ?? true, delete:d ?? true, revert:r ?? true, excel:e ?? (legacyExcelDefault ?? true) };
  }
  if (typeof Buttons === 'string') {
    const [a,d,r,e] = Buttons.trim().split(/\s+/).map(t => /^(true|1|y|yes)$/i.test(t));
    return { add:a ?? true, delete:d ?? true, revert:r ?? true, excel:e ?? (legacyExcelDefault ?? true) };
  }
  if (typeof Buttons === 'object') {
    return {
      add: Buttons.add ?? true,
      delete: Buttons.delete ?? true,
      revert: Buttons.revert ?? true,
      excel: Buttons.excel ?? (legacyExcelDefault ?? true)
    };
  }
  return defaults;
}
function rowClassName(state) {
  if (state === 'I') return 'row-state-I';
  if (state === 'U') return 'row-state-U';
  if (state === 'D') return 'row-state-D';
  return '';
}

/* ===== 버튼 스타일 ===== */
const getBtnSxRed = (theme) => ({
  bgcolor: 'error.main',
  color: theme.palette.error.contrastText || '#fff',
  borderRadius: 1,
  width: 25,
  height: 25,
  p: 0,
  minWidth: 0,
  '& .MuiSvgIcon-root': { fontSize: 14 },
  '&:hover': { bgcolor: 'error.dark' },
});
const getBtnSxExcel = (theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.mode === 'dark' ? '#4caf50' : '#0f8b3d',
  border: `1.5px solid ${theme.palette.mode === 'dark' ? '#4caf50' : '#0f8b3d'}`,
  borderRadius: 0,
  width: 25,
  height: 25,
  p: 0,
  minWidth: 0,
  '& .MuiSvgIcon-root': { fontSize: 14 },
  '&:hover': { 
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(76, 175, 80, 0.1)' 
      : '#f5fff8' 
  },
});
