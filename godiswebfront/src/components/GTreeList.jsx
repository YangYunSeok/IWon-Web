// src/components/GTreeList.jsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Toolbar, IconButton, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';

/* ── 작은 파란 점 아이콘(그리드 타이틀 느낌과 통일) ── */
function SparkBadge({ size = 14, color = '#1976d2' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="gbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#42a5f5" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#gbg)" />
    </svg>
  );
}

/* ── 레이아웃 ── */
const Root = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 6,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
}));

/* 타이틀/버튼을 감싸는 박스 없이 인라인 */
const InlineHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '4px 6px',
  background: 'transparent',
});

const TitleLeft = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

const ToolbarRight = styled(Toolbar)({
  padding: 0,
  minHeight: 0,
  gap: 6,
});

const Body = styled(Box)(({ theme }) => ({
  height: 420,
  overflow: 'auto',
  padding: theme.spacing(1),
  background: theme.palette.background.paper,
}));

/* ── TreeItem 커스텀: 들여쓰기/커넥터 간격을 prop으로 제어 ── */
const StyledTreeItem = styled(TreeItem, {
  shouldForwardProp: (prop) => prop !== '$indent' && prop !== '$connector',
})(({ theme, $indent = 14, $connector = 12 }) => ({
  [`& .${treeItemClasses.label}`]: {
    fontSize: 14,
    padding: '0 6px',
  },
  [`& .${treeItemClasses.content}`]: {
    paddingRight: 4,
    borderRadius: 4,
    '&.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor:
        theme.palette.mode === 'light'
          ? 'rgba(25, 118, 210, 0.08)'
          : 'rgba(144, 202, 249, 0.16)',
    },
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'light'
          ? 'rgba(0,0,0,0.04)'
          : 'rgba(255,255,255,0.06)',
    },
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: $indent,       // 부모→자식 들여쓰기 간격
    paddingLeft: $connector,   // 점선과 라벨 사이 간격
    borderLeft: `1px dashed ${
      theme.palette.mode === 'light'
        ? theme.palette.divider
        : 'rgba(255,255,255,0.2)'
    }`,
  },
}));

/* ── 버튼 스타일 (GDataGrid와 통일) ── */
const btnSxRed = {
  bgcolor: 'error.main',
  color: '#fff',
  borderRadius: 1,
  width: 24,
  height: 24,
  p: 0,
  minWidth: 0,
  boxShadow: 'none',
  '& .MuiSvgIcon-root': { fontSize: 16 },
  '&:hover': { bgcolor: 'error.dark' },
};
const btnSxExcel = {
  bgcolor: '#fff',
  color: '#0f8b3d',
  border: '1.5px solid #0f8b3d',
  borderRadius: 1,
  width: 26,
  height: 26,
  p: 0,
  minWidth: 0,
  boxShadow: 'none',
  '& .MuiSvgIcon-root': { fontSize: 16 },
  '&:hover': { bgcolor: '#f5fff8' },
};

/* ── 컴포넌트 ── */
export default function GTreeList({
  /* 타이틀 */
  title,

  /* 레이아웃 */
  height = 420,

  /* 우측 버튼 표시: [add, remove, undo, export] */
  Buttons = [true, true, true, true],
  onAdd,
  onRemove,
  onUndo,
  onExport,

  /* 트리 데이터 */
  data,
  defaultExpanded = [],
  selectedId,
  onSelect,

  /* 라벨/더블클릭/드래그 시작 콜백(외부제어) */
  renderLabel,
  onDoubleClick,
  onBeginDrag,      // (node, event) => void  ← 외부에서 dataTransfer 세팅

  /* 행 높이 / 폰트 / 기타 sx */
  rowHeight = 28,
  labelFontSize = '14px',
  treeViewSx,

  /* 들여쓰기/커넥터 간격 */
  indentWidth = 14,
  connectorOffset = 12,
}) {
  const [expandedItems, setExpandedItems] = useState(defaultExpanded);
  const [internalSelected, setInternalSelected] = useState(selectedId ?? '');

  useEffect(() => {
    if (selectedId !== undefined) setInternalSelected(selectedId);
  }, [selectedId]);

  const handleExpandedChange = useCallback((_e, ids) => setExpandedItems(ids), []);

  const idMap = useMemo(() => {
    const m = new Map();
    const walk = (arr) =>
      arr?.forEach((n) => {
        m.set(String(n.id), n);
        if (n.children?.length) walk(n.children);
      });
    walk(data || []);
    return m;
  }, [data]);

  const handleSelectedChange = useCallback(
    (_e, itemIds) => {
      const id = Array.isArray(itemIds) ? itemIds[itemIds.length - 1] : itemIds;
      setInternalSelected(id);
      onSelect && onSelect(id, idMap.get(id));
    },
    [idMap, onSelect]
  );

  const renderTree = useCallback(
    (nodes) => {
      if (!nodes) return null;
      return nodes.map((n) => (
        <StyledTreeItem
          key={n.id}
          itemId={String(n.id)}
          $indent={indentWidth}
          $connector={connectorOffset}
          slotProps={{
            content: {
              onDoubleClick: () => onDoubleClick && onDoubleClick(n.id, n),
              draggable: true,
              onDragStart: (e) => {
                if (typeof onBeginDrag === 'function') {
                  onBeginDrag(n, e);
                } else {
                  // 기본 payload (fallback)
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ type: 'tree-node', node: n })
                  );
                }
              },
            },
          }}
          label={typeof renderLabel === 'function' ? renderLabel(n) : n.label}
        >
          {Array.isArray(n.children) && n.children.length > 0
            ? renderTree(n.children)
            : null}
        </StyledTreeItem>
      ));
    },
    [renderLabel, onDoubleClick, onBeginDrag, indentWidth, connectorOffset]
  );

  const anyButtonVisible = Buttons?.some(Boolean);

  return (
    <Root variant="outlined" sx={{ width: '100%' }}>
      {/* 타이틀/버튼: 감싸는 박스 없이 인라인 */}
      <InlineHeader>
        <TitleLeft>
          <SparkBadge size={14} />
          <Typography variant="subtitle2" sx={{ fontSize: 14, fontWeight: 700 }}>
            {title}
          </Typography>
        </TitleLeft>

        {anyButtonVisible && (
          <ToolbarRight disableGutters>
            {Buttons[0] && (
              <Tooltip title="추가">
                <IconButton size="small" sx={btnSxRed} onClick={onAdd}>
                  <AddRoundedIcon />
                </IconButton>
              </Tooltip>
            )}
            {Buttons[1] && (
              <Tooltip title="삭제">
                <IconButton size="small" sx={btnSxRed} onClick={onRemove}>
                  <RemoveRoundedIcon />
                </IconButton>
              </Tooltip>
            )}
            {Buttons[2] && (
              <Tooltip title="되돌리기">
                <IconButton size="small" sx={btnSxRed} onClick={onUndo}>
                  <UndoRoundedIcon />
                </IconButton>
              </Tooltip>
            )}
            {Buttons[3] && (
              <Tooltip title="엑셀 내보내기">
                <IconButton size="small" sx={btnSxExcel} onClick={onExport}>
                  <FileDownloadOutlinedIcon />
                </IconButton>
              </Tooltip>
            )}
          </ToolbarRight>
        )}
      </InlineHeader>

      <Body sx={{ height }}>
        <Box>
          <SimpleTreeView
            aria-label="g-tree-list"
            slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
            defaultExpandedItems={defaultExpanded}
            expandedItems={expandedItems}
            onExpandedItemsChange={handleExpandedChange}
            selectedItems={internalSelected}
            onSelectedItemsChange={handleSelectedChange}
            sx={{
              minWidth: 280,
              '& .MuiTreeItem-root': { mb: 0.25 },
              [`& .${treeItemClasses.content}`]: {
                minHeight: rowHeight,
                height: rowHeight,
                py: 0,
              },
              [`& .${treeItemClasses.label}`]: {
                lineHeight: `${rowHeight}px`,
                fontSize: labelFontSize,
              },
              ...treeViewSx,
            }}
          >
            {renderTree(data)}
          </SimpleTreeView>
        </Box>
      </Body>
    </Root>
  );
}

GTreeList.propTypes = {
  title: PropTypes.string,
  height: PropTypes.number,

  Buttons: PropTypes.arrayOf(PropTypes.bool),
  onAdd: PropTypes.func,
  onRemove: PropTypes.func,
  onUndo: PropTypes.func,
  onExport: PropTypes.func,

  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      children: PropTypes.array,
    })
  ).isRequired,
  defaultExpanded: PropTypes.arrayOf(PropTypes.string),
  selectedId: PropTypes.string,
  onSelect: PropTypes.func,

  renderLabel: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onBeginDrag: PropTypes.func,   // ← 추가됨

  rowHeight: PropTypes.number,
  labelFontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  treeViewSx: PropTypes.object,

  indentWidth: PropTypes.number,
  connectorOffset: PropTypes.number,
};
