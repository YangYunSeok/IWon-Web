import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

import { useState, useEffect, useRef } from "react";

export default function DynamicTreeTest({ data, onNodeClick }) {
  const [keyword, setKeyword] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [filteredData, setFilteredData] = useState(data);
  const [expanded, setExpanded] = useState([]); // 🔥 자동 확장될 노드 리스트

  const inputRef = useRef(null);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Ctrl + F 로 검색창 열기
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => inputRef.current?.focus(), 30);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // 노드 label 에 하이라이트 적용
  const highlightLabel = (label, keyword) => {
    if (!keyword) return label;

    const regex = new RegExp(`(${keyword})`, "gi");
    return label.replace(regex, "<mark>$1</mark>"); // mark 태그로 강조
  };

  // 특정 노드가 검색어 포함 여부
  const nodeContainsKeyword = (node, keyword) => {
    if (node.label.toLowerCase().includes(keyword.toLowerCase())) return true;
    if (!node.children) return false;

    return node.children.some((child) =>
      nodeContainsKeyword(child, keyword)
    );
  };

  // 특정 노드의 모든 부모 경로 찾기
  const getExpandPath = (nodes, keyword, collect = []) => {
    for (const node of nodes) {
      if (nodeContainsKeyword(node, keyword)) {
        collect.push(node.id); // 본인 추가

        if (node.children) {
          getExpandPath(node.children, keyword, collect);
        }
      }
    }
    return collect;
  };

  // 검색 후 트리 필터링 + 자동 확장
  const filterTree = (nodes, keyword) => {
    if (!keyword.trim()) return nodes;

    const result = [];
    for (const node of nodes) {
      if (nodeContainsKeyword(node, keyword)) {
        let newNode = { ...node };

        if (node.children) {
          newNode.children = filterTree(node.children, keyword);
        }

        result.push(newNode);
      }
    }
    return result;
  };

  // Enter 검색 실행
  const handleSearchEnter = (e) => {
    if (e.key === "Enter") {
      const filtered = filterTree(data, keyword);
      setFilteredData(filtered);

      // 🔥 자동으로 펼칠 노드 ID 수집
      const expandIds = getExpandPath(data, keyword);
      setExpanded(expandIds); // 즉시 확장
    }
  };

  // 재귀적 TreeItem 렌더링
  const renderTree = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;

    const labelIcon = hasChildren
      ? (level === 0
          ? <FolderIcon sx={{ color: "#2196F3", fontSize: 22, mr: 0.5 }} />
          : <FolderIcon sx={{ color: "#FFA726", fontSize: 22, mr: 0.5 }} />)
      : <TrendingFlatIcon sx={{ color: "#FFA726", fontSize: 22, mr: 0.5 }} />;

    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        onClick={(event) => {
          event.stopPropagation();
          if (typeof onNodeClick === 'function') {
            onNodeClick(node);
          }
        }}
        label={
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {labelIcon}
            <span
              dangerouslySetInnerHTML={{
                __html: highlightLabel(node.label, keyword),
              }}
            />
          </Box>
        }
      >
        {hasChildren && node.children.map((c) => renderTree(c, level + 1))}
      </TreeItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 320 }}>
      {/* 검색창 */}
      {showSearch && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5, gap: 1, flexShrink: 0 }}>
          <TextField
            placeholder="Search"
            size="small"
            value={keyword}
            inputRef={inputRef}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleSearchEnter}
            sx={{ flex: 1 }}
          />

          <IconButton
            size="small"
            onClick={() => {
              setShowSearch(false);
              setKeyword("");
              setFilteredData(data);
              setExpanded([]); // 확장 초기화
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* 트리 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <SimpleTreeView
          expandedItems={expanded}
          onExpandedItemsChange={(e, ids) => setExpanded(ids)}
          slots={{
            expandIcon: ChevronRightIcon,
            collapseIcon: ExpandMoreIcon,
          }}
        >
          {filteredData.map((node) => renderTree(node))}
        </SimpleTreeView>
      </Box>
    </Box>
  );
}