import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GMessageBox from '@/components/GMessageBox';
import GTitleIcon from '@/components/GTitleIcon';

const INTERNAL_KEY = '__rid';
const STATE_FIELD = 'ROW_STATE';

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
export default function GSimpleTreeGrid({
  rows = [],
  onRowsChange,
  idField = 'id',
  parentIdField = 'UP_ID',
  labelField = 'label',
  columnLabel = '',
  createNewRow,
  generateNewId,
  enableRowState = true,
  stateField = STATE_FIELD,
  title = '트리',
  showTitle = true,
  Buttons,
  height = 380,
  selectedItem,
  onSelectedItemChange,
  onHasChanges,
  showIconMode = false,
  treeIndent = 24,
  sx,
  ...rest
}) {
  const theme = useTheme();
  /* ----- 버튼 플래그 정규화 ----- */
  const btnFlags = useMemo(() => normalizeButtons(Buttons), [Buttons]);

  /* ----- __rid 생성/주입 유틸 ----- */
  const genRid = useCallback(
    (prefix = 'RID') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const ensureRid = useCallback(
    (row) => {
      if (!row) return row;
      if (row[INTERNAL_KEY]) return row;
      return { ...row, [INTERNAL_KEY]: genRid('ROW') };
    },
    [genRid]
  );

  const ensureRidArray = useCallback(
    (arr) => (Array.isArray(arr) ? arr : []).map((r) => ensureRid(r)),
    [ensureRid]
  );

  /* ----- 로컬 rows 상태 ----- */
  const [localRaw, setLocalRaw] = useState(() => ensureRidArray(rows ?? []));

  useEffect(() => {
    if (rows) setLocalRaw(ensureRidArray(rows));
  }, [rows, ensureRidArray]);

  const dataForTree = useMemo(() => ensureRidArray(localRaw), [localRaw, ensureRidArray]);

  const setRowsSafe = (updater) => {
    const next = typeof updater === 'function' ? updater(dataForTree) : updater;
    const withRid = ensureRidArray(next);
    if (onRowsChange) onRowsChange(withRid);
    else setLocalRaw(withRid);
    if (onHasChanges) onHasChanges(true);
  };

  /* ----- 확장 상태 ----- */
  const [expandedItems, setExpandedItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 초기 로드 시에만 모든 항목 자동 확장
    if (!isInitialized && dataForTree.length > 0) {
      const allIds = dataForTree.map((r) => r[idField]);
      setExpandedItems(allIds);
      setIsInitialized(true);
    }
  }, [dataForTree, idField, isInitialized]);

  /* ----- 선택 상태 ----- */
  const selectedRef = useRef(null);

  useEffect(() => {
    if (selectedItem) {
      selectedRef.current = selectedItem[idField];
    }
  }, [selectedItem, idField]);

  const handleSelectChange = (event, itemId) => {
    const selected = dataForTree.find((r) => r[idField] === itemId);
    if (selected && onSelectedItemChange) {
      selectedRef.current = itemId;
      onSelectedItemChange(selected);
    }
  };

  /* ----- 추가/삭제/되돌리기 ----- */
  const doAdd = () => {
    if (!selectedItem) return;

    const base = { [INTERNAL_KEY]: genRid('NEW'), [stateField]: 'I' };
    const extra = typeof createNewRow === 'function' ? createNewRow(selectedItem) || {} : {};
    const newId = typeof generateNewId === 'function' ? generateNewId() : genRid('NEW');

    const newRow = {
      ...base,
      ...extra,
      [idField]: newId,
      [parentIdField]: selectedItem[idField],
      [INTERNAL_KEY]: base[INTERNAL_KEY],
      [stateField]: 'I',
    };

    setRowsSafe((prev) => [...prev, newRow]);

    // 부모 확장
    if (!expandedItems.includes(selectedItem[idField])) {
      setExpandedItems([...expandedItems, selectedItem[idField]]);
    }

    // 새 항목 선택
    if (onSelectedItemChange) {
      selectedRef.current = newId;
      onSelectedItemChange(newRow);
    }
  };

  const doDelete = async() => {
    if (!selectedItem) return;

    const selectedId = selectedItem[idField];

    // 하위 항목 체크 (D가 아닌 항목만)
    const hasChildren = dataForTree.some((r) => r[parentIdField] === selectedId && r[stateField] !== 'D');
    if (hasChildren) {
      await GMessageBox.Show('하위 항목이 존재하는 항목은 삭제할 수 없습니다', 'Ok');
      return;
    }
    
    const r = await GMessageBox.Show('MGQ00065', 'YesNo', selectedItem[labelField]);
    if (r === 'no') {
      return;
    }

    setRowsSafe((prev) =>
      prev.flatMap((r) => {
        if (r[idField] !== selectedId) return [r];
        const curState = r[stateField];
        if (curState === 'I') return [];
        return [{ ...r, [stateField]: 'D' }];
      })
    );

    // 삭제 후 다른 항목 선택
    const activeRows = dataForTree.filter((r) => r[idField] !== selectedId && r[stateField] !== 'D');
    if (activeRows.length > 0 && onSelectedItemChange) {
      const newSelected = activeRows.find((r) => !r[parentIdField]) || activeRows[0];
      selectedRef.current = newSelected[idField];
      onSelectedItemChange(newSelected);
    }
  };

  const doRevert = () => {
    if (onRowsChange) {
      onRowsChange(rows);
    }
    if (onHasChanges) onHasChanges(false);
  };

  /* ----- 버튼 핸들러 ----- */
  const onAdd = rest.onAddClick || doAdd;
  const onDelete = rest.onDeleteClick || doDelete;
  const onRevert = rest.onRevertClick || doRevert;

  /* ----- 하위 항목 확인 헬퍼 ----- */
  const hasChildrenFunc = useCallback((nodeId) => {
    return dataForTree.some((r) => r[parentIdField] === nodeId);
  }, [dataForTree, parentIdField]);

  /* ----- 트리 렌더링 ----- */
  const renderTreeItems = (nodes, parentId = null) => {
    return nodes
      .filter((node) => node[parentIdField] === parentId)
      .map((node) => {
        const nodeId = node[idField];
        const label = node[labelField] || '';
        const state = node[stateField];
        const nodeHasChildren = hasChildrenFunc(nodeId);

        return (
          <TreeItem
            key={node[INTERNAL_KEY]}
            itemId={nodeId}
            label={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '13px',
                  height: 25,
                  px: 0.5,
                  width: '100%',
                  color: state === 'D' ? '#ff6b9d' : theme.palette.text.primary,
                  backgroundColor: 'transparent',
                }}
              >
                {/* 폴더 아이콘 또는 하늘색 화살표 표시 */}
                {showIconMode && (
                  nodeHasChildren ? (
                    // 자식이 있으면 노란색 폴더 아이콘
                    <FolderIcon sx={{ fontSize: 16, color: '#FFA726' }} />
                  ) : (
                    // 자식이 없으면 하늘색 화살표
                    <ArrowRightAltIcon sx={{ fontSize: 16, color: '#4FC3F7' }} />
                  )
                )}
                {label}
              </Box>
            }
          >
            {renderTreeItems(nodes, nodeId)}
          </TreeItem>
        );
      });
  };

  /* ----- 렌더 ----- */
  const showTopBar =
    (showTitle && !!title) ||
    (btnFlags.add || btnFlags.delete || btnFlags.revert || btnFlags.excel);

  return (
    <Box sx={{ 
      width: '100%', 
      height: Number.isFinite(height) ? height : 300, 
      display: 'flex', 
      flexDirection: 'column',
      ...sx 
    }}>
      {showTopBar && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 1, pt: 0 }}>
          {showTitle && !!title ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <GTitleIcon />
              </Box>
              <Typography variant="subtitle1" sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text.primary }}>
                {title}
              </Typography>
            </Box>
          ) : <span />}

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {btnFlags.add && (
              <Tooltip title="추가">
                <IconButton size="small" onClick={onAdd} sx={getBtnSxRed(theme)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {btnFlags.delete && (
              <Tooltip title="삭제표시 / 해제 (I는 제거)">
                <IconButton size="small" onClick={onDelete} sx={getBtnSxRed(theme)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {btnFlags.revert && (
              <Tooltip title="되돌리기">
                <IconButton size="small" onClick={onRevert} sx={getBtnSxRed(theme)}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {btnFlags.excel && (
              <Tooltip title="엑셀 다운로드 (CSV)">
                <IconButton size="small" onClick={() => {}} sx={getBtnSxExcel(theme)}>
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto', 
        border: `1px solid ${theme.palette.divider}`, 
        p: 0.5,
        backgroundColor: theme.palette.background.paper,
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
        <SimpleTreeView
          expandedItems={expandedItems}
          onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
          selectedItems={selectedRef.current}
          onSelectedItemsChange={handleSelectChange}
          slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
          sx={{
            backgroundColor: theme.palette.background.paper,
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
            '& .MuiTreeItem-content': {
              paddingY: 0,
              paddingX: 0,
              minHeight: 25,
              height: 25,
              marginLeft: '-0.5rem',
              marginRight: '-0.5rem',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
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
              '& .MuiTreeItem-label': {
                '& > div': {
                  backgroundColor: 'transparent !important',
                },
              },
            },
            '& .MuiTreeItem-content:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)',
            },
            '& .MuiTreeItem-label': { fontSize: '13px' },
            '& .MuiTreeItem-groupTransition': { 
              marginLeft: 0, 
              paddingLeft: `${treeIndent}px`
            },
          }}
        >
          {renderTreeItems(dataForTree)}
        </SimpleTreeView>
      </Box>
    </Box>
  );
}

/* ===== 유틸 ===== */
function normalizeButtons(Buttons) {
  const defaults = { add: true, delete: true, revert: true, excel: false };
  if (Buttons == null) return defaults;
  if (Array.isArray(Buttons)) {
    const [a, d, r, e] = Buttons;
    return { add: a ?? true, delete: d ?? true, revert: r ?? true, excel: e ?? false };
  }
  if (typeof Buttons === 'string') {
    const [a, d, r, e] = Buttons.trim()
      .split(/\s+/)
      .map((t) => /^(true|1|y|yes)$/i.test(t));
    return { add: a ?? true, delete: d ?? true, revert: r ?? true, excel: e ?? false };
  }
  if (typeof Buttons === 'object') {
    return {
      add: Buttons.add ?? true,
      delete: Buttons.delete ?? true,
      revert: Buttons.revert ?? true,
      excel: Buttons.excel ?? false,
    };
  }
  return defaults;
}