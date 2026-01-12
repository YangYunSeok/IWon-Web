import React, { useState, useMemo, useEffect } from "react";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Typography, IconButton, Menu, MenuItem, Checkbox, Tooltip } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from "@mui/material/styles";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GTitleIcon from '@/components/GTitleIcon.jsx';

function safeCSV(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function readValue(row, col) {
  if (typeof col.valueGetter === 'function') {
    try { return col.valueGetter({ row, field: col.field, value: row[col.field] }); } catch { }
  }
  const val = row[col.field];
  if (typeof col.valueFormatter === 'function') {
    try { return col.valueFormatter({ value: val, row, field: col.field }); } catch { }
  }
  return val;
}

function normalizeButtons(Buttons, legacyExcelDefault) {
  const defaults = { add: true, delete: true, revert: true, excel: legacyExcelDefault ?? true };
  if (Buttons == null) return defaults;
  if (Array.isArray(Buttons)) {
    const [a, d, r, e] = Buttons;
    return { add: a ?? true, delete: d ?? true, revert: r ?? true, excel: e ?? (legacyExcelDefault ?? true) };
  }
  if (typeof Buttons === 'string') {
    const [a, d, r, e] = Buttons.trim().split(/\s+/).map(t => /^(true|1|y|yes)$/i.test(t));
    return { add: a ?? true, delete: d ?? true, revert: r ?? true, excel: e ?? (legacyExcelDefault ?? true) };
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

const INTERNAL_KEY = '__rid';     // 내부 고정 키
const STATE_FIELD = 'ROW_STATE'; // I/U/D 기본값

export default function GDataTreeGrid({
  rows = [],
  columns = [],
  columnGroupingModel = [],
  getRowId = (row) => row.id,
  columnHeaderHeight = 50,
  rowHeight = 28,
  title,
  showTitle = true,
  titleIcon,
  titleIconSize = 16,
  titleIconColor,
  titleSx,
  initiallyExpandAll = false,
  height = "100%",
  showTopButtons = true,       // 하위 호환
  Buttons, // [add, delete, revert, excel] | "1 1 1 0" | {add,delete,revert,excel}
  showExcelButton = true,      // 하위 호환
  checkboxSelection,
  stateField = STATE_FIELD,    // 'I' | 'U' | 'D' 저장 필드명
  enableRowState = true,       // 상태컬럼 활성화 (기본 on)
  excelFileName = 'export.csv',
  treeIndent = 24,
  ...rest
}) {
  const theme = useTheme();

  /* ----- 버튼 플래그 정규화 ----- */
  const btnFlags = React.useMemo(
    () => normalizeButtons(Buttons, showExcelButton),
    [Buttons, showExcelButton]
  );

  const flags = showTopButtons ? btnFlags : { add: false, delete: false, revert: false, excel: false };

  const [expandedItems, setExpandedItems] = useState([]);
  const [sortModel, setSortModel] = useState({ field: null, sort: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState(
    () => columns.filter(col => !col.hide).map(col => col.field)
  );
  const [columnWidths, setColumnWidths] = useState(() =>
    columns.map(col => (typeof col.width === "number" ? col.width : 150))
  );

  /* ----- 렌더 ----- */
  const showTopBar =
    (showTitle && !!title) ||
    (flags.add || flags.delete || flags.revert || flags.excel);

  /* ----- 선택 모델 저장(반드시 __rid 기준) ----- */
  const [selectedItems, setSelectedItems] = useState([]);
  const selectionRef = React.useRef([]);
  const toArray = (m) => Array.isArray(m) ? m : Array.from((m && m.ids) || []);

  const handleSelectionV6 = (event, ids) => {
    selectionRef.current = toArray(ids);        // m은 getRowId 결과(__rid) 집합
    console.log(selectionRef.current);
    setSelectedItems(ids)
    rest.onRowSelectionModelChange?.(ids);
  };

  /* ----- __rid 생성/주입 유틸 ----- */
  const genRid = React.useCallback(
    (prefix = 'RID') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const ensureRid = React.useCallback((row, i = 0, prefix = 'ROW') => {
    if (!row) return row;
    if (row[INTERNAL_KEY]) return row;
    return { ...row, [INTERNAL_KEY]: genRid(prefix) };
  }, [genRid]);

  const ensureRidArray = React.useCallback((arr, prefix = 'ROW') =>
    (Array.isArray(arr) ? arr : []).map((r, i) => ensureRid(r, i, prefix)), [ensureRid]);

  /* ----- 로컬 rows 상태 (언컨트롤드 fallback) + __rid 주입 ----- */
  const [localRaw, setLocalRaw] = React.useState(() => ensureRidArray(rows ?? [], 'INIT'));
  React.useEffect(() => { if (rows) setLocalRaw(ensureRidArray(rows, 'PROP')); }, [rows, ensureRidArray]);

  // 항상 __rid가 있는 배열만 DataGrid에 넣음
  const dataForGrid = React.useMemo(() => ensureRidArray(localRaw, 'GRID'), [localRaw, ensureRidArray]);

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
    console.log("======");
    console.log(ids);
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

  /* ----- CSV Export (상태/내부키 제외) ----- */
  const exportToCSV = () => {
    // rows는 화면에 표시되는 트리 구조
    const tree = rows;

    if (!tree?.length || !mergedColumns?.length) return;

    /** 1) 트리 -> 평탄화 */
    const flattenTree = (nodes, depth = 0, list = []) => {
      nodes.forEach((node) => {
        list.push({ ...node, __depth: depth });
        if (node.children?.length) {
          flattenTree(node.children, depth + 1, list);
        }
      });
      return list;
    };

    const flatRows = flattenTree(tree);

    /** 2) 현재 표시 중인 컬럼만 */
    const visibleCols = mergedColumns.filter(
      (c) =>
        !!c.field &&
        c.hide !== true &&
        visibleColumns.includes(c.field) &&
        c.field !== INTERNAL_KEY &&
        c.field !== stateField
    );

    /** 3) CSV Header */
    const header = visibleCols
      .map((c, index) => safeCSV(c.headerName ?? c.field))
      .join(",");

    /** 4) CSV Body */
    const body = flatRows.map((row) => {
      return visibleCols
        .map((col, idx) => {
          let val = readValue(row, col);
          if (typeof val === "boolean") val = val ? "TRUE" : "";
          // 첫 번째 컬럼에 depth indent 적용
          if (idx === 0) {
            const indent = "    ".repeat(row.__depth);
            val = indent + (val ?? "");
          }

          return safeCSV(val);
        })
        .join(",");
    });

    /** 5) 다운로드 */
    const csv = ["\uFEFF" + header, ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = excelFileName.endsWith(".csv")
      ? excelFileName
      : `${excelFileName}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const renderGroupHeaders = () => {
    if (!columnGroupingModel || columnGroupingModel.length === 0) return null;

    const visibleCols = columns.filter(col => visibleColumns.includes(col.field));

    return (
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1001,
          backgroundColor: theme.palette.dataGrid?.headerBg || theme.palette.background.paper,
          paddingLeft: `calc(33px + ${theme.spacing(1)})`,
          paddingRight: theme.spacing(1),
          minWidth: `${gridTemplateWidth}px`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative', // 🔥 absolute 자식을 위한 relative
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: `${columnHeaderHeight * 1.25}px`,
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {visibleCols.map((col, idx) => {
            const colIdx = columns.findIndex(c => c.field === col.field);
            const colWidth = (columnWidths[colIdx] ?? 150);

            const belongsToGroup = columnGroupingModel.find(g =>
              g.children.some(c => c.field === col.field)
            );

            if (!belongsToGroup) {
              return <Box key={col.field} sx={{ width: `${colWidth}px` }} />; // 빈 공간
            }

            const groupChildren = belongsToGroup.children.filter(c => visibleColumns.includes(c.field));
            const isFirstInGroup = groupChildren[0]?.field === col.field;

            if (!isFirstInGroup) return null;

            let groupWidth = 0;
            groupChildren.forEach(child => {
              const childColIdx = columns.findIndex(c => c.field === child.field);
              groupWidth += (columnWidths[childColIdx] ?? 150) + 1.5;
            });

            return (
              <Box
                key={belongsToGroup.groupId}
                sx={{
                  width: `${groupWidth - 1.5}px`,
                  height: '100%',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: theme.typography.body2.fontSize,
                  color: theme.palette.dataGrid?.headerText || theme.palette.text.primary,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {belongsToGroup.groupId}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            height: `${columnHeaderHeight * 2}px`,
            pointerEvents: 'none',
          }}
        >
          {visibleCols.map((col) => {
            const colIdx = columns.findIndex(c => c.field === col.field);
            const colWidth = (columnWidths[colIdx] ?? 150);

            const belongsToGroup = columnGroupingModel.find(g =>
              g.children.some(c => c.field === col.field)
            );

            if (!belongsToGroup) {
              return (
                <Box
                  key={col.field}
                  sx={{
                    width: `${colWidth}px`,
                    height: '100%',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: theme.typography.body2.fontSize,
                    color: theme.palette.dataGrid?.headerText || theme.palette.text.primary,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.palette.dataGrid?.headerBg || theme.palette.background.paper,
                    pointerEvents: 'auto',
                  }}
                >
                  {col.headerName || col.field}
                </Box>
              );
            }

            return <Box key={col.field} sx={{ width: `${colWidth}px` }} />;
          })}
        </Box>
      </Box>
    );
  };

  /* ----- 버튼 핸들러: 외부 콜백 우선, 없으면 기본 동작 ----- */
  const onAdd = rest.onAddClick || doAdd;
  const onDelete = rest.onDeleteClick || doDeleteMark;
  const onRevert = rest.onRevertClick || doRevert;

  /* ✅ columns 가 바뀔 때(버튼 컬럼 동적 추가 등) visibleColumns/columnWidths 동기화 */
  useEffect(() => {
    // 보이는 컬럼 목록 재계산 (hide 아닌 것들 모두 표시)
    const nextVisible = columns.filter(col => !col.hide).map(col => col.field);
    setVisibleColumns(nextVisible);

    // columnWidths 길이도 columns 길이에 맞게 보정
    setColumnWidths(prev => {
      if (prev.length === columns.length) return prev;
      return columns.map((col, idx) => {
        if (typeof col.width === "number") return col.width;
        return prev[idx] ?? 150;
      });
    });
  }, [columns]);

  const gridTemplate = useMemo(() => {
    return columns
      .filter(col => visibleColumns.includes(col.field))
      .map((col) => {
        const idx = columns.findIndex(c => c.field === col.field);
        const w = columnWidths[idx] ?? (typeof col.width === "number" ? col.width : 150);
        return `${w}px`;
      })
      .join(" ");
  }, [columnWidths, visibleColumns, columns]);

  const gridTemplateWidth = useMemo(() => {
    return columns
      .filter(col => visibleColumns.includes(col.field))
      .reduce((sum, col) => {
        const idx = columns.findIndex(c => c.field === col.field);
        const w = columnWidths[idx] ?? (typeof col.width === "number" ? col.width : 150);
        return sum + w + 1.5;
      }, 0);
  }, [columnWidths, visibleColumns, columns]);

  const allItemIds = useMemo(() => {
    const collectIds = (nodes) => {
      let ids = [];
      nodes.forEach((node) => {
        ids.push(getRowId(node));
        if (node.children?.length) {
          ids = ids.concat(collectIds(node.children));
        }
      });
      return ids;
    };
    return collectIds(rows);
  }, [rows, getRowId]);

  const [isInitialised, setIsInitialised] = useState(false);
  useEffect(() => {
    if (initiallyExpandAll && !isInitialised && allItemIds.length > 0) {
      setExpandedItems(allItemIds);
      setIsInitialised(true);
    }
  }, [initiallyExpandAll, allItemIds, isInitialised]);

  const sortedRows = useMemo(() => {
    if (!sortModel.field) return rows;
    const compare = (a, b) => {
      const valA = a[sortModel.field];
      const valB = b[sortModel.field];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return sortModel.sort === 'asc' ? -1 : 1;
      if (valA > valB) return sortModel.sort === 'asc' ? 1 : -1;
      return 0;
    };
    return [...rows].sort(compare);
  }, [rows, sortModel]);

  const handleColumnClick = (field) => {
    setSortModel(prev => {
      if (prev.field === field) {
        return { field, sort: prev.sort === 'asc' ? 'desc' : 'asc' };
      }
      return { field, sort: 'asc' };
    });
  };

  const handleMouseDown = (e, index) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[index];

    const handleMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[index] = Math.max(50, startWidth + diff);
        return newWidths;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const [menuAnchorEls, setMenuAnchorEls] = useState({});
  const handleMenuOpen = (event, field) => {
    setMenuAnchorEls(prev => ({ ...prev, [field]: event.currentTarget }));
  };
  const handleMenuClose = (field) => {
    setMenuAnchorEls(prev => ({ ...prev, [field]: null }));
  };

  const toggleColumnVisibility = (field) => {
    setVisibleColumns(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      }
      return [...prev, field];
    });
  };

  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => {
      const rowId = getRowId(node);
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = expandedItems.includes(rowId);

      return (
        <TreeItem
          key={rowId}
          itemId={rowId}
          label={
            <Box
              display="grid"
              gridTemplateColumns={gridTemplate}
              alignItems="center"
              onClick={(event) => event.stopPropagation()}
              sx={{
                paddingX: 1,
                height: rowHeight,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: 'transparent', // 선택 상태는 MuiTreeItem-content에서 처리
                width: '100%',
              }}
            >
              {columns.filter(col => visibleColumns.includes(col.field)).map((col, i) => {
                const value = node[col.field];
                const isFirstCol = i === 0;
                return (
                  <Box
                    key={col.field}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: "100%",
                      overflow: "hidden",
                      width: isFirstCol ? "auto" : "100%",
                    }}
                  >
                    {isFirstCol && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          ml: `${depth * treeIndent}px`,
                          mr: 0.5,
                        }}
                      >
                        {hasChildren ? (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedItems((prev) =>
                                prev.includes(rowId)
                                  ? prev.filter((id) => id !== rowId)
                                  : [...prev, rowId]
                              );
                            }}
                            sx={{ p: 0, width: 20, height: 20 }}
                          >
                            {isExpanded ? (
                              <ExpandMoreIcon fontSize="small" />
                            ) : (
                              <ChevronRightIcon fontSize="small" />
                            )}
                          </IconButton>
                        ) : (
                          // 자식이 없는 경우 자리만 맞추기
                          <Box sx={{ width: 20, height: 20 }} />
                        )}
                      </Box>
                    )}
                    {col.renderCell ? col.renderCell({ row: node, value }) : (
                      <Typography variant="body2">{value}</Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          }
        >
          {hasChildren ? renderTree(node.children, depth + 1) : null}
        </TreeItem>
      );
    });

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ===== 타이틀 ===== */}
      {showTopBar && (
        <Box sx={{ position: "sticky", top: 0, zIndex: 900, backgroundColor: theme.palette.background.paper, paddingY: 0.5 }} >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1, pt: 0 }}>
            {showTitle && title ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {titleIcon ? titleIcon : <GTitleIcon size={titleIconSize} color={titleIconColor || '#1976d2'} />}
                </Box>
                <Typography variant="subtitle1" sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontFamily: theme.typography.fontFamily,
                  ...titleSx
                }}
                >
                  {title}
                </Typography>
              </Box>
            ) : <span />
            }
            <Box sx={{ display: 'flex', gap: 0.5 }}>
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
        </Box>
      )}

      {/* ===== 헤더 ===== */}
      <Box sx={{
        overflowX: "auto",
        overflowY: "auto",
        backgroundColor: theme.palette.background.paper,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
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
      }}>
        {renderGroupHeaders()}
        <Box
          display="grid"
          gridTemplateColumns={gridTemplate}
          height={columnHeaderHeight}
          alignItems="center"
          fontWeight="bold"
          borderBottom="1px solid #ccc"
          // paddingX={1}
          sx={{
            position: "sticky",
            top: columnGroupingModel?.length > 0 ? columnHeaderHeight * 1.3 : 0,
            zIndex: 1000,
            backgroundColor: theme.palette.dataGrid.headerBg,
            color: theme.palette.dataGrid.headerText,
            paddingLeft: `calc(33px + ${theme.spacing(1)})`,
            paddingRight: theme.spacing(1),
            boxSizing: 'border-box',
            minWidth: `${gridTemplateWidth}px`,
          }}
        >
          {columns.filter(col => visibleColumns.includes(col.field)).map((col) => {
            const colIndex = columns.findIndex(c => c.field === col.field);

            const groupedFields = columnGroupingModel?.flatMap(g => g.children.map(c => c.field)) || [];
            const isGrouped = groupedFields.includes(col.field);

            // 그룹되지 않은 컬럼은 2층에서 숨김 (1층에서 이미 전체 높이로 표시됨)
            if (columnGroupingModel?.length > 0 && !isGrouped) {
              return <Box key={col.field} sx={{ visibility: 'hidden' }} />; // 👈 visibility로 변경
            }

            return (
              <Box key={col.field} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <Typography
                  onClick={() => handleColumnClick(col.field)}
                  sx={{
                    cursor: 'pointer',
                    flexGrow: 1,
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.body2.fontSize,
                    fontWeight: 600,
                    color: theme.palette.dataGrid.headerText,
                    textAlign: 'center'
                  }}
                >
                  {col.headerName}
                  {sortModel.field === col.field ? (sortModel.sort === 'asc' ? ' ▲' : ' ▼') : ''}
                </Typography>

                <IconButton size="small" onClick={(e) => handleMenuOpen(e, col.field)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={menuAnchorEls[col.field]}
                  open={Boolean(menuAnchorEls[col.field])}
                  onClose={() => handleMenuClose(col.field)}
                >
                  <MenuItem onClick={() => { handleColumnClick(col.field); handleMenuClose(col.field); }}>
                    Sort {sortModel.field === col.field ? (sortModel.sort === 'asc' ? ' ▲' : ' ▼') : ''}
                  </MenuItem>
                  <MenuItem>
                    <Checkbox
                      checked={visibleColumns.includes(col.field)}
                      onChange={() => toggleColumnVisibility(col.field)}
                      size="small"
                    />
                    Hide Column
                  </MenuItem>
                </Menu>

                <Box
                  onMouseDown={(e) => handleMouseDown(e, colIndex)}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '5px',
                    height: '100%',
                    cursor: 'col-resize',
                  }}
                />
              </Box>
            );
          })}
        </Box>
        {/* ===== 스크롤 영역 ===== */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            minWidth: `${gridTemplateWidth}px`,
            backgroundColor: theme.palette.background.paper,
            "& .MuiTreeItem-content": {
              paddingY: 0,
              paddingX: 0,
              minHeight: rowHeight,
              height: rowHeight,
            },
            "& .MuiTreeItem-groupTransition": {
              marginLeft: 0,
              paddingLeft: 0,
              borderLeft: "none",
            },
          }}
        >
          <SimpleTreeView
            expandedItems={expandedItems}
            onExpandedItemsChange={(e, itemIds) => setExpandedItems(itemIds)}
            slots={{ collapseIcon: null, expandIcon: null, endIcon: null }}
            selectedItems={selectedItems}
            onSelectedItemsChange={handleSelectionV6}
            sx={{
              '& .MuiTreeItem-content': {
                marginLeft: '-1rem',
                marginRight: '-1rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
              },
              '& .MuiTreeItem-content.Mui-selected': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.16)'
                  : 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(25, 118, 210, 0.24)'
                    : 'rgba(25, 118, 210, 0.12)',
                },
              },
              '& .MuiTreeItem-content:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {renderTree(sortedRows)}
          </SimpleTreeView>
        </Box>
      </Box>
    </Box>
  );
}
