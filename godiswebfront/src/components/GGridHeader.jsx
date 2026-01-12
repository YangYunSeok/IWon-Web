//================================ import ===============================//
import * as React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

//================================ Header Badge ===============================//
function SparkBadge({ size = 18, color = '#1976d2' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
            <linearGradient id="gbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#42a5f5" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#gbg)" />
        <path d="M12 4.5l1.4 3.4 3.6.3-2.8 2.3.9 3.5-3.1-1.9-3.1 1.9.9-3.5-2.8-2.3 3.6-.3L12 4.5z"
            fill="white" opacity="0.9" />
        <path d="M5 9c2-3.2 6.5-4.6 10-3.3" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    );
}

function normalizeButtons(Buttons, legacyExcelDefault) {
  const defaults = { add:true, delete:true, revert:true, excel:legacyExcelDefault ?? true };
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

/* ===== 버튼 스타일 ===== */
const btnSxRed = {
  bgcolor: 'error.main',
  color: '#fff',
  borderRadius: 1,
  width: 25,
  height: 25,
  p: 0,
  minWidth: 0,
  '& .MuiSvgIcon-root': { fontSize: 14 },
  '&:hover': { bgcolor: 'error.dark' },
};
const btnSxExcel = {
  bgcolor: '#fff',
  color: '#0f8b3d',
  border: '1.5px solid #0f8b3d',
  borderRadius: 0,
  width: 25,
  height: 25,
  p: 0,
  minWidth: 0,
  '& .MuiSvgIcon-root': { fontSize: 14 },
  '&:hover': { bgcolor: '#f5fff8' },
};

/* ----- CSV Export (상태/내부키 제외) ----- */
const exportToCSV = () => {
    const data = dataForGrid;
    if (!data?.length || !mergedColumns?.length) return;
    const visibleCols = mergedColumns.filter(c =>
        !!c.field && c.hide !== true && c.field !== stateField && c.field !== INTERNAL_KEY
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

export default function GGridHeader({
    title,
    showTitle = true,
    titleIconColor,
    titleIcon,
    titleIconSize = 18,
    titleSx = {},
    Buttons, // [add, delete, revert, excel] | "1 1 1 0" | {add,delete,revert,excel}
    showTopButtons = true,       // 하위 호환
    showExcelButton = true,      // 하위 호환
    ...rest
}) {

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

    const btnFlags = React.useMemo(
        () => normalizeButtons(Buttons, showExcelButton),
        [Buttons, showExcelButton]
    );
    const flags = showTopButtons
        ? btnFlags
        : { add:false, delete:false, revert:false, excel:false };

    /* ----- 버튼 핸들러: 외부 콜백 우선, 없으면 기본 동작 ----- */
    const onAdd    = rest.onAddClick    || doAdd;
    const onDelete = rest.onDeleteClick || doDeleteMark;
    const onRevert = rest.onRevertClick || doRevert;

    const showTopBar =
        (showTitle && !!title) ||
        (flags.add || flags.delete || flags.revert || flags.excel);

    return (
        showTopBar && (
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:1, p:1, pt:0 }}>
                {showTitle && !!title ? (
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    <Box sx={{ display:'inline-flex', alignItems:'center' }}>
                    {titleIcon ? titleIcon : <SparkBadge size={titleIconSize} color={titleIconColor || '#1976d2'} />}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight:700, color:'text.primary', ...titleSx }}>
                    {title}
                    </Typography>
                </Box>
                ) : <span />}

                <Box sx={{ display:'flex', gap:0.5 }}>
                {flags.add && (
                    <Tooltip title="추가">
                    <IconButton size="small" onClick={onAdd} sx={btnSxRed}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                )}
                {flags.delete && (
                    <Tooltip title="삭제표시 / 해제 (I는 제거)">
                    <IconButton size="small" onClick={onDelete} sx={btnSxRed}>
                        <RemoveIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                )}
                {flags.revert && (
                    <Tooltip title="되돌리기">
                    <IconButton size="small" onClick={onRevert} sx={btnSxRed}>
                        <ReplayIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                )}
                {flags.excel && (
                    <Tooltip title="엑셀 다운로드 (CSV)">
                    <IconButton size="small" onClick={exportToCSV} sx={btnSxExcel}>
                        <FileDownloadOutlinedIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                )}
                </Box>
            </Box>
        )
    )
}

