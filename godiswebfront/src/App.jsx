// src/App.jsx
import React, {useState, useEffect, useRef, useCallback , useLayoutEffect} from 'react';
//import { useNavigate } from 'react-router-dom';
import GlobalLoader from '@/libs/GlobalLoader.jsx';

import { useAuth } from '@/context/AuthContext';
import AutoLogout from '@/hooks/AutoLogout';
import SessionKeepStatus from '@/hooks/SessionKeepStatus';

import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  Box,
  Card,
  Switch as MuiSwitch,
  Tooltip as MuiTooltip,
  Stack,
  Autocomplete,
  TextField,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,

  // 추가 2025-11-21
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// 추가 2025-11-21
import TabUnselectedIcon from '@mui/icons-material/TabUnselected';
import TabIcon from '@mui/icons-material/Tab';
import ClearAllIcon from '@mui/icons-material/ClearAll';

import { http } from '@/libs/TaskHttp';
import { useThemeMode } from '@/theme/ThemeModeContext';

import PageHost from '@/pages/PageHost.jsx';
import Placeholder from '@/pages/Placeholder.jsx';
import { usePerm } from '@/authz/PermissionStore.jsx';
import { cacheMsgs } from '@/libs/DataUtils';
import { useData } from '@/context/DataContext.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GMessageToast from '@/components/GMessageToast.jsx';

import {
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  HomeOutlined,
  DatabaseOutlined,
  FormOutlined,
  ProjectOutlined,
  SettingOutlined,
  NotificationOutlined,
} from '@ant-design/icons';

import NotificationSocket from './components/socket/NotifcationSocket';
import PushHistoryDialog from "./components/pushHistory/PushHistoryDialog";
import UserInfoDialog from "./components/userInfo/UserInfoDialog";

// ---------- 공통 ----------

function createContent(node) {
  const titleText =
    node?.titleText ||
    node?.menuNm ||
    (typeof node?.title === 'string' ? node.title : '');
  const clssNm = node?.clssNm || node?.CLSS_NM || node?.className;

  return clssNm
    ? <PageHost clssNm={clssNm} title={titleText} />
    : <Placeholder title={titleText} />;
}

function Brand({ onClick, color }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        px: 2.5,
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
      aria-label="Godis"
      title="Godis"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-hidden="true">
        <g
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </g>
      </svg>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, color, letterSpacing: 0.4 }}
        >
          GODIS
        </Typography>
        {/* <Typography
          variant="h6"
          sx={{ fontWeight: 600, color, opacity: 0.85 }}
        >
          Studio
        </Typography> */}
      </Box>
    </Box>
  );
}

// ---------- 좌측 네비: 아이콘 레일 + 우측 드롭다운 서브메뉴 ----------

function LeftNav({
  topMenus,
  activeTopKey,
  onChangeTop,
  subMenus,
  onOpenNode,
  selectOptions,
  onSelectOption,
  activeKey,
  width = 340,
}) {
  const theme = useTheme();
  const ICON_RAIL_WIDTH = 80;
  const MENU_WIDTH = Math.max(180, width - ICON_RAIL_WIDTH); // 최소 180 보장

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        minHeight: 'calc(100vh - 64px)',
        boxShadow: theme.shadows[1],
        bgcolor: theme.palette.background.paper,
        flexShrink: 0,
        width,
      }}
    >
      {/* 1뎁스: 아이콘 레일 */}
      <Box
        sx={{
          width: ICON_RAIL_WIDTH,
          height: '100%',
          bgcolor:
            theme.palette.mode === 'light'
              ? theme.palette.grey[900]
              : theme.palette.grey[950],
          color: theme.palette.common.white,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          pt: 1.5,
          pb: 1.5,
          borderRight: `1px solid rgba(255,255,255,0.18)`,
          overflow: 'hidden',
        }}
      >
        {topMenus.map(root => {
          const active = activeTopKey === root.key;
          const label = root.titleText || root.title;

          return (
            <MuiTooltip
              key={root.key}
              title={label}
              placement="right"
            >
              <Box
                onClick={() => onChangeTop(root.key)}
                sx={{
                  width: '100%',
                  py: 1,
                  px: 0.5,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.35,
                  cursor: 'pointer',
                  bgcolor: active
                    ? 'rgba(255,255,255,0.12)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: active
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(255,255,255,0.10)',
                  },
                  transition: 'background-color 0.16s ease-out, color 0.16s ease-out, box-shadow 0.16s ease-out',
                          willChange: 'transform',
                }}
              >
                <IconButton
                  disableRipple
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.6,
                    bgcolor: active
                      ? theme.palette.common.white
                      : 'rgba(255,255,255,0.08)',
                    color: active
                      ? theme.palette.primary.main
                      : theme.palette.common.white,
                    boxShadow: active ? theme.shadows[2] : 'none',
                    '&:hover': {
                      bgcolor: active
                        ? theme.palette.common.white
                        : 'rgba(255,255,255,0.18)',
                    },
                  }}
                >
                  {root.icon || <FormOutlined />}
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.common.white,
                    fontSize: 10,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    wordBreak: 'keep-all',
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </MuiTooltip>
          );
        })}

        <Box sx={{ flexGrow: 1 }} />
      </Box>

      {/* 2뎁스: 오른쪽 컬럼 */}
      <Box
        sx={{
          width: MENU_WIDTH,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* 메뉴 검색 */}
        <Box sx={{ p: 1, flexShrink: 0 }}>
          <Autocomplete
            size="small"
            options={selectOptions}
            getOptionLabel={(opt) => opt.label || ''}
            onChange={(_, value) => onSelectOption(value?.value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="메뉴 검색"
                placeholder="메뉴 코드/명 검색"
                variant="outlined"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: 13,
                    bgcolor: theme.palette.background.paper,
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: 12,
                  },
                }}
              />
            )}
          />
        </Box>

        <Divider sx={{ flexShrink: 0 }} />

        {/* 2~3뎁스 드롭다운 리스트 */}
        <Box sx={{ flex: 1, overflowY: 'auto', pt: 0.5 }}>
          <List disablePadding>
            {subMenus.map(item => (
              <SubMenuItem
                key={item.key}
                node={item}
                onOpenNode={onOpenNode}
                activeKey={activeKey}
                allTopMenus={topMenus}
              />
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );
}

function SubMenuItem({ node, onOpenNode, depth = 0, activeKey, allTopMenus }) {
  const theme = useTheme();
  const hasChild = node.children && node.children.length > 0;
  
  // 🔧 추가: 활성화된 메뉴의 부모 메뉴들을 자동으로 열기
  const shouldBeOpen = React.useMemo(() => {
    if (!activeKey || !allTopMenus) return false;
    
    const findNodeInTree = (nodes, targetKey) => {
      for (const n of nodes) {
        if (n.key === targetKey) return n;
        if (n.children?.length) {
          const found = findNodeInTree(n.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };
    
    const activeNode = findNodeInTree(allTopMenus, activeKey);
    if (!activeNode) return false;
    
    // 현재 노드가 활성화된 노드의 부모인지 확인
    const isAncestor = (parent, child) => {
      if (parent.key === child.key) return true;
      if (!parent.children) return false;
      return parent.children.some(c => isAncestor(c, child));
    };
    
    return isAncestor(node, activeNode);
  }, [activeKey, node, allTopMenus]);
  
  const [open, setOpen] = React.useState(shouldBeOpen);
  
  // shouldBeOpen이 변경되면 open 상태 업데이트
  React.useEffect(() => {
    if (shouldBeOpen) {
      setOpen(true);
    }
  }, [shouldBeOpen]);

  const title = node.titleText || node.title;
  const screnNo = node.screnNo;
  const indent = depth === 0 ? 2 : 2.5 + depth * 1.4;
  
  // 🔧 추가: 현재 메뉴가 활성화되어 있는지 확인
  const isActive = activeKey === node.key;

  const handleClick = () => {
    if (hasChild && !node.clssNm) {
      setOpen(v => !v);
    } else {
      onOpenNode(node);
    }
  };

  const isGroupNode = !screnNo && hasChild;

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: indent,
          pr: 1.5,
          py: 0.45,
          gap: 0.5,
          borderRadius: 1.5,
          mx: 0.6,
          mb: 0.1,
          bgcolor: isActive 
            ? theme.palette.dataGrid?.headerBg || theme.palette.primary.light
            : 'transparent',
          color: isActive 
            ? theme.palette.dataGrid?.headerText || theme.palette.text.primary
            : theme.palette.text.primary,
          '&:hover': {
            bgcolor: isActive 
              ? theme.palette.dataGrid?.headerBg || theme.palette.primary.light
              : theme.palette.action.hover,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flex: 1,
            minWidth: 0,
          }}
        >
          {screnNo && (
            <Box
              sx={{
                px: 0.8,
                py: 0.1,
                borderRadius: 1,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                boxShadow: theme.shadows[1],
                whiteSpace: 'nowrap',
              }}
            >
              {screnNo}
            </Box>
          )}

          {isGroupNode && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.light,
                border: `1px solid ${theme.palette.primary.main}`,
                boxShadow: theme.shadows[1],
                flexShrink: 0,
              }}
            />
          )}

          <ListItemText
            primary={title}
            primaryTypographyProps={{
              fontSize: 13,
              noWrap: true,
              color: 'inherit',
            }}
          />
        </Box>

        {hasChild && !node.clssNm && (
          open ? (
            <ExpandLessIcon
              fontSize="small"
              sx={{ color: theme.palette.text.disabled }}
            />
          ) : (
            <ExpandMoreIcon
              fontSize="small"
              sx={{ color: theme.palette.text.disabled }}
            />
          )
        )}
      </ListItemButton>

      {hasChild && !node.clssNm && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {node.children.map(child => (
              <SubMenuItem
                key={child.key}
                node={child}
                onOpenNode={onOpenNode}
                depth={depth + 1}
                activeKey={activeKey}
                allTopMenus={allTopMenus}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ---------- 메인 ----------

export default function App() {
  const { mode, setMode } = useThemeMode();
  const theme = useTheme();
  const SHADOW_1 = theme.shadows?.[1] ?? theme.shadows[1];

  SessionKeepStatus();
  AutoLogout(1430);

  const { user, setUser } = useAuth();
  const msgCacheLoadedRef = useRef(false);
  //const navigate = useNavigate();
  const { setActive } = usePerm();
  const { setGlobalData } = useData();

  const [topMenus, setTopMenus] = useState([]);
  const [activeTopKey, setActiveTopKey] = useState(null);

  const [tabs, setTabs] = useState([]);
  const tabsRef = useRef([]);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);
  const [activeKey, setActiveKey] = useState();

  // 🔧 추가: 각 탭이 한 번이라도 활성화되었는지 추적
  const [mountedTabs, setMountedTabs] = useState(new Set());

  // 탭상태 체크
  const [contextMenu, setContextMenu] = useState(null);
  const [contextTabKey, setContextTabKey] = useState(null);

  // ===== 탭 상태 복원 (새로고침 시) =====
  const isRestoringRef = useRef(false);
  
  // 🔧 추가: 사용자가 수동으로 대메뉴를 클릭했는지 추적
  const isManualTopMenuChangeRef = useRef(false);

  const findNodeByKey = useCallback((nodes, key) => {
    for (const n of nodes) {
      if (n.key === key) return n;
      if (n.children?.length) {
        const found = findNodeByKey(n.children, key);
        if (found) return found;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (isRestoringRef.current || !user?.userId || topMenus.length === 0) return;

    try {
      const saved = sessionStorage.getItem('app_tabs_state');
      if (!saved) return;

      //const { savedTabs, savedActiveKey } = JSON.parse(saved);

      // 활성화탭, 활성화 세션키, 유저아이디, 타임스탬프 추가 - 2025-12-15
      const data = JSON.parse(saved);
      const { savedTabs, savedActiveKey, userId, timestamp } = data;
      
      // 세션 검증
      // 1. 다른 사용자의 데이터인지 체크
      if (userId && userId !== user.userId) {
        console.log('[App] 다른 사용자의 탭 데이터 - 초기화');
        sessionStorage.removeItem('app_tabs_state');
        return;
      }
      
      // 2. 저장된 지 너무 오래되었는지 체크 (예: 30분)
      const MAX_AGE = 60 * 60 * 24 * 1000; // 30분이 넘은 데이터는 탭데이터 만료
      //const MAX_AGE = 60 * 1000;
      if (timestamp && Date.now() - timestamp > MAX_AGE) {
        console.log('[App] 만료된 탭 데이터 - 초기화');
        sessionStorage.removeItem('app_tabs_state');
        return;
      }
      if (!Array.isArray(savedTabs) || savedTabs.length === 0) return;

      isRestoringRef.current = true;
      console.log('[App] 탭 상태 복원 중...', savedTabs.length, '개');

      const restoredTabs = savedTabs
      .map(savedTab => {
        const node = findNodeByKey(topMenus, savedTab.nodeKey);
        if (!node) {
          console.warn(`[App] 노드를 찾을 수 없음: ${savedTab.nodeKey}`);
          return null;
        }

        return {
          key: savedTab.key,
          title: savedTab.title,
          content: node.component || createContent(node),
          node,
        };
      })
      .filter(Boolean);

      if (restoredTabs.length > 0) {
        setTabs(restoredTabs);
        
        const validActiveKey = restoredTabs.find(t => t.key === savedActiveKey)
          ? savedActiveKey
          : restoredTabs[0].key;
        
        setActiveKey(validActiveKey);
        
        // 🔧 추가: 복원된 활성 탭을 mounted 상태로 등록
        setMountedTabs(new Set([validActiveKey]));
        
        // 🔧 추가: 활성화된 탭의 대메뉴를 찾아서 설정
        const findRootKey = (nodes, targetKey, parentKey = null) => {
          for (const n of nodes) {
            if (n.key === targetKey) return parentKey || n.key;
            if (n.children?.length) {
              const r = findRootKey(n.children, targetKey, parentKey || n.key);
              if (r) return r;
            }
          }
          return null;
        };
        
        const activeTab = restoredTabs.find(t => t.key === validActiveKey);
        if (activeTab && activeTab.node) {
          const rootKey = findRootKey(topMenus, activeTab.node.key);
          if (rootKey) {
            setActiveTopKey(rootKey);
            console.log('[App] 활성 탭의 대메뉴 설정:', rootKey);
          }
        }
        
        console.log('[App] 탭 복원 완료:', restoredTabs.length, '개');

        // 일부만 복원된 경우 사용자에게 알림
        if (restoredTabs.length < savedTabs.length) {
          const failedCount = savedTabs.length - restoredTabs.length;
          console.warn(`[App] ${failedCount}개의 탭을 복원하지 못했습니다`);
          // 필요시 토스트 알림 추가
        } else {
          // 복원 가능한 탭이 없으면 저장된 상태 삭제
          console.log('[App] 복원 가능한 탭이 없음 - 저장 데이터 삭제');
          sessionStorage.removeItem('app_tabs_state');
        }
      }
      
      // 탭 복원 완료 후 플래그 리셋
      isRestoringRef.current = false;
    } catch (err) {
      console.error('[App] 탭 복원 실패:', err);
      sessionStorage.removeItem('app_tabs_state');
      isRestoringRef.current = false;
    }
  }, [user?.userId, topMenus, findNodeByKey]);

  // 🔧 추가: activeKey 변경 시 대메뉴 자동 설정 및 mounted 상태 업데이트
  useEffect(() => {
    // 탭 복원 중이면 건너뛰기
    if (isRestoringRef.current) return;
    
    // 사용자가 수동으로 대메뉴를 변경한 직후라면 자동 설정 건너뛰기
    if (isManualTopMenuChangeRef.current) {
      isManualTopMenuChangeRef.current = false;
      return;
    }
    
    if (activeKey && topMenus.length > 0) {
      // 활성화된 탭의 노드를 찾아서 대메뉴 설정
      const activeTab = tabs.find(t => t.key === activeKey);
      if (activeTab && activeTab.node) {
        const findRootKey = (nodes, targetKey, parentKey = null) => {
          for (const n of nodes) {
            if (n.key === targetKey) return parentKey || n.key;
            if (n.children?.length) {
              const r = findRootKey(n.children, targetKey, parentKey || n.key);
              if (r) return r;
            }
          }
          return null;
        };
        
        const rootKey = findRootKey(topMenus, activeTab.node.key);
        if (rootKey && rootKey !== activeTopKey) {
          setActiveTopKey(rootKey);
        }
        
        // 현재 메뉴 ID를 window 객체에 저장 (ErrorHandler에서 사용)
        if (activeTab.node.key) {
          window.currentMenuId = activeTab.node.key;
        }
      }
    }
    
    if (activeKey) {
      setMountedTabs(prev => new Set([...prev, activeKey]));
    }
  }, [activeKey, tabs, topMenus, activeTopKey]);
  
  // 🔧 추가: 대메뉴 수동 변경 핸들러
  const handleTopMenuChange = (newTopKey) => {
    isManualTopMenuChangeRef.current = true;
    setActiveTopKey(newTopKey);
  };

  // ===== 탭 상태 저장 (탭이나 activeKey 변경 시) =====
  useEffect(() => {
    if (!user?.userId || tabs.length === 0) return;

    try {
      const savedTabs = tabs.map(tab => ({
        key: tab.key,
        title: tab.title,
        nodeKey: tab.node?.key,
      }));

      const state = {
        savedTabs,
        savedActiveKey: activeKey,
        userId: user?.userId,
        timestamp: Date.now(),
        version: '1.0',
      };

      sessionStorage.setItem('app_tabs_state', JSON.stringify(state));
    } catch (err) {
      console.error('[App] 탭 저장 실패:', err);
    }
  }, [tabs, activeKey, user?.userId]);


  // ---------- 탭 드래그 (Chrome/Edge 스타일: mousemove 기반) ----------
  const tabBarRef = useRef(null);
  const tabRefs = useRef(new Map()); 
  // FLIP animation support for smooth sibling tab movement
  const flipRef = useRef(null); // { [key]: DOMRect }

  // Run FLIP animation after tabs reorder
  useLayoutEffect(() => {
    const prev = flipRef.current;
    if (!prev) return;
    flipRef.current = null;

    // Wait for DOM to paint with new order, then animate
    requestAnimationFrame(() => {
      Object.entries(prev).forEach(([key, r0]) => {
        const el = tabRefs.current.get(key);
        if (!el) return;
        const r1 = el.getBoundingClientRect();
        const dx = r0.left - r1.left;
        if (Math.abs(dx) < 0.5) return;

        // Invert
        el.style.transition = 'transform 0s';
        el.style.transform = `translate3d(${dx}px, 0, 0)`;
        el.style.willChange = 'transform';

        // Play
        requestAnimationFrame(() => {
          el.style.transition = 'transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)';
          el.style.transform = 'translate3d(0, 0, 0)';

          // Cleanup
          window.setTimeout(() => {
            if (!el) return;
            el.style.transition = '';
            el.style.transform = '';
            el.style.willChange = '';
          }, 260);
        });
      });
    });
  }, [tabs]);
// key -> HTMLElement

  const dragRef = useRef({
    active: false,
    key: null,
    startIndex: -1,
    grabOffsetX: 0,
    fixedTop: 0,
    width: 0,
    height: 0,
    raf: 0,
    nextX: 0,
  });

  const [dragKey, setDragKey] = useState(null);
  const [dragGhost, setDragGhost] = useState(null); // { left, top, width, height }


  const [pushOpen, setPushOpen] = useState(false);
  const [userInfoOpen, setUserInfoOpen] = useState(false);

  // 왼쪽 메뉴 폭 + 리사이즈용 ref
  const [leftWidth, setLeftWidth] = useState(340);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseMove = useCallback((e) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - startXRef.current;
    let next = startWidthRef.current + dx;
    next = Math.max(260, Math.min(next, 600));
    setLeftWidth(next);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleResizeMouseDown = (e) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ---------- 메시지 캐시 ----------
  useEffect(() => {
    let cancelled = false;

    if (!user?.userId) {
      msgCacheLoadedRef.current = false;
      setGlobalData(prev => ({
        ...(prev || {}),
        messages: undefined,
        messagesRaw: undefined,
      }));
      return;
    }

    if (msgCacheLoadedRef.current) return;

    (async () => {
      try {
        const param = { MSG_CLSS_CD: '01' };
        const list = await cacheMsgs(param);
        if (!Array.isArray(list) || list.length === 0) return;

        const idx = {};
        for (const r of list) {
          const code =
            r.MSG_CD ??
            r.MSG_ID ??
            r.msgCd ??
            r.code;

          const text =
            r.MSG_CONTN ??
            r.MSG_NM ??
            r.MSG_KOR_CONTN ??
            r.MSG_ENG_CONTN ??
            r.msgNm ??
            r.message;

          if (code && typeof text === 'string') {
            idx[String(code).trim()] = String(text);
          }
        }

        if (!cancelled) {
          setGlobalData(prev => ({
            ...(prev || {}),
            messagesRaw: list,
            messages: idx,
          }));
          msgCacheLoadedRef.current = true;
        }
      } catch (e) {
        console.error('[App] message cache fail:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId, setGlobalData]);

  // ---------- 메뉴 로딩 ----------
  useEffect(() => {
    async function fetchMenus() {
      try {
        const param = { SYS_TP_CD: 'STO', USR_ID: user.userId };
        const { table = [] } = await http.post('/webcom/getmain', param, { shape: 'datatable' });

        const idToNode = {};
        table.forEach(item => {
          idToNode[item.MENU_ID] = {
            key: item.MENU_ID,
            title: item.MENU_NM,
            titleText: item.MENU_NM,
            butnId: item.BUTN_ID || '',
            progmId: item.PROGM_ID,
            screnNo: item.SCREN_NO,
            clssNm: item.CLSS_NM,
            children: [],
          };
        });

        table.forEach(item => {
          const node = idToNode[item.MENU_ID];
          node.component =
            item.CLSS_NM && String(item.CLSS_NM).trim()
              ? <PageHost clssNm={item.CLSS_NM} title={item.MENU_NM} />
              : <Placeholder title={item.MENU_NM} />;

          if (item.UP_MENU_ID && idToNode[item.UP_MENU_ID]) {
            idToNode[item.UP_MENU_ID].children.push(node);
          }
        });

        const roots = [];
        table.forEach(item => {
          if (item.LV === 1) {
            const node = idToNode[item.MENU_ID];
            const title = item.MENU_NM || '';

            let icon;
            if (title.includes('Home') || title.includes('대시보드') || title.includes('홈'))
              icon = <HomeOutlined />;
            else if (title.includes('기초') || title.includes('자산') || title.includes('기준'))
              icon = <DatabaseOutlined />;
            else if (title.includes('청약') || title.includes('배정') || title.includes('등록'))
              icon = <FormOutlined />;
            else if (title.includes('배치') || title.includes('운영') || title.includes('JOB'))
              icon = <ProjectOutlined />;
            else if (title.includes('관리') || title.includes('설정') || title.includes('관리자'))
              icon = <SettingOutlined />;
            else
              icon = <FormOutlined />;

            node.icon = icon;
            roots.push(node);
          }
        });

        setTopMenus(roots);
        
        // 🔧 수정: 탭이 복원 중이면 첫 번째 메뉴로 설정하지 않음 (탭 복원 로직에서 처리)
        // 탭이 없거나 복원되지 않은 경우에만 첫 번째 메뉴로 설정
        if (roots.length > 0 && !isRestoringRef.current) {
          setActiveTopKey(roots[0].key);
        }
      } catch (error) {
        console.error('Failed to load menus', error);
      }
    }

    fetchMenus();
  }, [user?.userId, setUser]);

  // ---------- 서브메뉴 계산 ----------
  const getSubMenusOfActiveTop = () => {
    const activeTop = topMenus.find(m => m.key === activeTopKey);
    if (!activeTop) return [];
    return activeTop.children || [];
  };

  const getLeafNodes = (nodes, leaves = []) => {
    nodes.forEach(n => {
      if (n.children?.length) getLeafNodes(n.children, leaves);
      else if (n.component) {
        leaves.push({
          key: n.key,
          code: n.screnNo || '',
          title: n.titleText || n.title,
        });
      }
    });
    return leaves;
  };

  const leafNodes = getLeafNodes(topMenus);
  const selectOptions = leafNodes.map(item => ({
    label: `${item.code ? `[${item.code}] ` : ''}${item.title}`,
    value: item.key,
  }));

  const subMenus = getSubMenusOfActiveTop();

  // ---------- 탭 제어 ----------
  const openNodeAsTab = (node) => {
    if (!node) return;

    try {
      setActive(String(node.menuId || node.key || ''), node.butnId);
    } catch { }

    if (node.children && node.children.length > 0 && !node.clssNm) return;

    const key = node.key;
    const existing = tabs.find(t => t.key === key);
    if (existing) {
      setActiveKey(existing.key);
      return;
    }

    const newTab = {
      key,
      title: node.titleText || node.title,
      content: node.component || createContent(node),
      node,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveKey(key);
  };

  const openTabByKey = (value) => {
    if (!value) return;

    const findNode = (nodes, key) => {
      for (const n of nodes) {
        if (n.key === key) return n;
        if (n.children?.length) {
          const r = findNode(n.children, key);
          if (r) return r;
        }
      }
      return null;
    };

    const node = findNode(topMenus, value);
    if (!node) return;

    const findRootKey = (nodes, targetKey, parentKey = null) => {
      for (const n of nodes) {
        if (n.key === targetKey) return parentKey || n.key;
        if (n.children?.length) {
          const r = findRootKey(n.children, targetKey, parentKey || n.key);
          if (r) return r;
        }
      }
      return null;
    };

    const rootKey = findRootKey(topMenus, value);
    if (rootKey) setActiveTopKey(rootKey);

    openNodeAsTab(node);
  };

  const removeTab = (targetKey) => {
    const newTabs = tabs.filter(t => t.key !== targetKey);
    
    // 🔧 추가: 탭 제거 시 mounted 상태에서도 제거
    setMountedTabs(prev => {
      const next = new Set(prev);
      next.delete(targetKey);
      return next;
    });
    
    if (newTabs.length === 0) {
      setTabs([]);
      setActiveKey(undefined);
      return;
    }

    if (activeKey === targetKey) {
      const idx = tabs.findIndex(t => t.key === targetKey);
      const fallback = newTabs[idx] || newTabs[idx - 1] || newTabs[0];
      setActiveKey(fallback.key);
      try {
        if (fallback.node) {
          setActive(
            String(fallback.node.menuId || fallback.node.key || ''),
            fallback.node.butnId
          );
        }
      } catch { }
    }

    setTabs(newTabs);
  };

  // 모든 탭 닫기
  const closeAllTabs = async () => {
    if (tabs.length === 0) return;

    const result = await GMessageBox.Show(
      'MGQ00827', 
      'YesNo', 
      `열려있는 ${tabs.length}개의 탭을 모두 닫으시겠습니까?`
    );
    
    if (result === 'yes') {
      setTabs([]);
      setActiveKey(undefined);
      setMountedTabs(new Set()); // 🔧 추가
      console.log('[App] 모든 탭 닫기 완료');
    }
  };

  const closeOtherTabs = async (targetKey) => {
    if (tabs.length <= 1) return;
    setContextMenu(null);

    const result = await GMessageBox.Show(
      'MGQ00831', 
      'YesNo', 
      '현재 탭을 제외한 다른 탭을 모두 닫으시겠습니까?'
    );
    
    if (result === 'yes') {
      const currentTab = tabs.find(t => t.key === (targetKey || activeKey));
      if (currentTab) {
        setTabs([currentTab]);
        setActiveKey(currentTab.key);
        setMountedTabs(new Set([currentTab.key])); // 🔧 추가
        console.log('[App] 다른 탭 모두 닫기 완료');
      }
    }
  };

  const closeLeftTabs = async (targetKey) => {
    const targetIndex = tabs.findIndex(t => t.key === targetKey);
    if (targetIndex <= 0) return;

    setContextMenu(null);

    const result = await GMessageBox.Show(
      'MGQ00829', 
      'YesNo', 
      `왼쪽 ${targetIndex}개의 탭을 닫으시겠습니까?`
    );
    
    if (result === 'yes') {
      const newTabs = tabs.slice(targetIndex);
      setTabs(newTabs);
      
      // 🔧 추가: mounted 상태 업데이트
      setMountedTabs(prev => {
        const next = new Set();
        newTabs.forEach(t => {
          if (prev.has(t.key)) next.add(t.key);
        });
        return next;
      });
      
      if (!newTabs.find(t => t.key === activeKey)) {
        setActiveKey(targetKey);
      }
      console.log('[App] 왼쪽 탭들 닫기 완료');
    }
  };

  const closeRightTabs = async (targetKey) => {
    const targetIndex = tabs.findIndex(t => t.key === targetKey);
    if (targetIndex === -1 || targetIndex >= tabs.length - 1) return;

    setContextMenu(null);

    const rightCount = tabs.length - targetIndex - 1;
    const result = await GMessageBox.Show(
      'MGQ00830', 
      'YesNo', 
      `오른쪽 ${rightCount}개의 탭을 닫으시겠습니까?`
    );
    
    if (result === 'yes') {
      const newTabs = tabs.slice(0, targetIndex + 1);
      setTabs(newTabs);
      
      // 🔧 추가: mounted 상태 업데이트
      setMountedTabs(prev => {
        const next = new Set();
        newTabs.forEach(t => {
          if (prev.has(t.key)) next.add(t.key);
        });
        return next;
      });
      
      if (!newTabs.find(t => t.key === activeKey)) {
        setActiveKey(targetKey);
      }
      console.log('[App] 오른쪽 탭들 닫기 완료');
    }
  };

  const handleTabContextMenu = (event, tabKey) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextTabKey(tabKey);
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
    setContextTabKey(null);
  };

  // ---------- 탭 드래그 (Chrome/Edge 스타일) ----------

  const reorderTabs = useCallback((fromKey, toIndex) => {
    // Capture current positions for FLIP animation (exclude dragged tab key)
    try {
      const rects = {};
      const current = tabsRef.current;
      for (const t of current) {
        if (t.key === fromKey) continue; // dragged tab stays as ghost
        const el = tabRefs.current.get(t.key);
        if (el) rects[t.key] = el.getBoundingClientRect();
      }
      flipRef.current = rects;
    } catch (e) {
      // ignore
    }


    setTabs(prev => {
      const fromIndex = prev.findIndex(t => t.key === fromKey);
      if (fromIndex === -1 || toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      tabsRef.current = next;
      return next;
    });
  }, [setTabs]);

  const getTabEl = useCallback((key) => tabRefs.current.get(key), []);
  const getTabRect = useCallback((key) => {
    const el = getTabEl(key);
    return el ? el.getBoundingClientRect() : null;
  }, [getTabEl]);

  const scheduleGhostUpdate = useCallback(() => {
    const st = dragRef.current;
    if (st.raf) return;
    st.raf = requestAnimationFrame(() => {
      st.raf = 0;
      if (!st.active) return;
      setDragGhost({ left: st.nextX, top: st.fixedTop, width: st.width, height: st.height });
    });
  }, []);

  const onTabMouseDown = useCallback((e, key) => {
    // only left button
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    // 드래그 시작 시 해당 탭 활성화
    setActiveKey(key);

    const rect = getTabRect(key);
    if (!rect) return;

    const st = dragRef.current;
    st.active = true;
    st.key = key;
    st.startIndex = tabs.findIndex(t => t.key === key);
    st.grabOffsetX = e.clientX - rect.left;
    st.fixedTop = rect.top;
    st.width = rect.width;
    st.height = rect.height;
    st.nextX = rect.left;

    setDragKey(key);
    setDragGhost({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });

    const handleMove = (ev) => {
      if (!st.active) return;
      st.nextX = ev.clientX - st.grabOffsetX;
      scheduleGhostUpdate();

      // Reorder 결정: ghost 중심 기준, 25% overlap
      const currentTabs = tabsRef.current; // 최신 탭 배열
      const idx = currentTabs.findIndex(t => t.key === st.key);
      if (idx === -1) return;

      const centerX = st.nextX + st.width / 2;

      // move right
      if (idx < currentTabs.length - 1) {
        const nextKey = currentTabs[idx + 1].key;
        const r = getTabRect(nextKey);
        if (r) {
          const triggerX = r.left + r.width * 0.25; // 1/4 진입 시 swap
          if (centerX > triggerX) {
            reorderTabs(st.key, idx + 1);
            return;
          }
        }
      }

      // move left
      if (idx > 0) {
        const prevKey = currentTabs[idx - 1].key;
        const r = getTabRect(prevKey);
        if (r) {
          const triggerX = r.right - r.width * 0.25; // 1/4 진입 시 swap
          if (centerX < triggerX) {
            reorderTabs(st.key, idx - 1);
            return;
          }
        }
      }
    };

    const handleUp = () => {
      if (!st.active) return;
      st.active = false;

      // 스냅: placeholder 위치로 자연스럽게 이동
      const finalRect = getTabRect(st.key);
      if (finalRect) {
        setDragGhost(g => g ? { ...g, left: finalRect.left, top: finalRect.top } : g);
        // 약간의 애니메이션 후 정리
        setTimeout(() => {
          setDragKey(null);
          setDragGhost(null);
        }, 180);
      } else {
        setDragKey(null);
        setDragGhost(null);
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [getTabRect, reorderTabs, scheduleGhostUpdate, setActiveKey]);


  // ---------- 기타 ----------
  const handleLogout = async () => {
    try {
      const r = await GMessageBox.Show('MGQ00826', 'YesNo', '로그아웃 하시겠습니까?');
      if (r !== 'yes') {
        return;
      }

      console.log('[App] 로그아웃 시작...');

      try {
        await http.post('/auth/logout');
      } catch (err) {
        console.warn('[App] 로그아웃 API 호출 실패 (무시하고 진행):', err);
      }

      msgCacheLoadedRef.current = false;
      setTabs([]);
      setActiveKey(undefined);
      setTopMenus([]);
      setGlobalData({});
      setMountedTabs(new Set()); // 🔧 추가

      setTimeout(() => {
        setUser(null);
        console.log('[App] 사용자 상태 초기화 완료');
      }, 100);

    } catch (err) {
      console.error('[App] 로그아웃 처리 중 오류:', err);
      setUser(null);
      GMessageToast.Show('error', '로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const handleUserInfo = () => setUserInfoOpen(true);
  const handlePushInfo = () => setPushOpen(true);
  const handleLock = () => window.alert('화면 잠금 기능이 호출되었습니다.');

  // ---------- 렌더 ----------
  return (
    <>
      <GMessageToast.Host />
      <GMessageBox.Host />
      <GlobalLoader />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 헤더 */}
        <AppBar
          position="fixed"
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: 'none',
          }}
        >
          <Toolbar
            sx={{
              minHeight: 64,
              px: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Brand
              onClick={() => {
                if (topMenus.length > 0) setActiveTopKey(topMenus[0].key);
              }}
              color={theme.palette.primary.contrastText}
            />

            <Box sx={{ flex: 1 }} />

            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{ ml: 2.5, mr: 2 }}
            >
              <MuiTooltip title={`테마 전환 (${mode === 'light' ? 'Light' : 'Dark'})`}>
                <MuiSwitch
                  checked={mode === 'dark'}
                  onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                  sx={{ mr: 0.5 }}
                />
              </MuiTooltip>

              <MuiTooltip title="화면 잠금">
                <IconButton
                  size="small"
                  onClick={handleLock}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  <LockOutlined />
                </IconButton>
              </MuiTooltip>
              <MuiTooltip title="PUSH 알림내역">
                <IconButton
                  size="small"
                  onClick={handlePushInfo}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  <NotificationOutlined />
                </IconButton>
              </MuiTooltip>
              <MuiTooltip title="사용자 정보">
                <IconButton
                  size="small"
                  onClick={handleUserInfo}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  <UserOutlined />
                </IconButton>
              </MuiTooltip>
              <MuiTooltip title="로그아웃">
                <IconButton
                  size="small"
                  onClick={handleLogout}
                  sx={{ color: theme.palette.primary.contrastText }}
                >
                  <LogoutOutlined />
                </IconButton>
              </MuiTooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* 본문 */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            height: `calc(100vh - 64px)`,
            pt: '64px',
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
          }}
        >
          {/* 왼쪽 메뉴 (가변 폭) */}
          <Box sx={{ width: leftWidth, flexShrink: 0, display: 'flex' }}>
            <LeftNav
              topMenus={topMenus}
              activeTopKey={activeTopKey}
              onChangeTop={handleTopMenuChange}
              subMenus={subMenus}
              onOpenNode={openNodeAsTab}
              selectOptions={selectOptions}
              onSelectOption={openTabByKey}
              activeKey={activeKey}
              width={leftWidth}
            />
          </Box>

          {/* 리사이즈 핸들 */}
          <Box
            onMouseDown={handleResizeMouseDown}
            sx={{
              width: 4,
              cursor: 'col-resize',
              flexShrink: 0,
              bgcolor: 'transparent',
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          />

          {/* 오른쪽: 탭 + 컨텐츠 */}
          <Box
            id="app-content-root"
            sx={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
              flexDirection: 'column',
              bgcolor: theme.palette.background.paper,
              p: 1,
            }}
          >
            <Card
              sx={{
                flex: 1,
                boxShadow: SHADOW_1,
                bgcolor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* ===== 탭 바 (박스형 디자인) ===== */}
              <Box
                sx={{
                  flexShrink: 0,
                  px: 1.5,
                  pt: 0.1,
                  pb: 0,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'flex-end',
                  bgcolor:
                    theme.palette.mode === 'light'
                      ? 'rgba(248,250,252,0.96)'
                      : 'rgba(15,23,42,0.9)',
                }}
              >
                <Box
                  ref={tabBarRef}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 0.5,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    width: '100%',
                    '::-webkit-scrollbar': {
                      height: 6,
                    },
                    '::-webkit-scrollbar-thumb': {
                      borderRadius: 999,
                      backgroundColor: 'rgba(148,163,184,0.7)',
                    },
                    '::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {tabs.map((tab) => {
                    const isActive = activeKey === tab.key;
                    const code = tab.node?.screnNo;

                    return (
                      <Box
                        key={tab.key}
                        ref={(el) => { if (el) tabRefs.current.set(tab.key, el); else tabRefs.current.delete(tab.key); }}
                        onMouseDown={(e) => onTabMouseDown(e, tab.key)}
                        onClick={() => setActiveKey(tab.key)}
                        onContextMenu={(e) => handleTabContextMenu(e, tab.key)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          height: 27,
                          maxWidth: 260,
                          px: 1,
                          borderRadius: '8px 8px 0 0',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          border: '1px solid',
                          borderColor: isActive
                            ? theme.palette.primary.main
                            : 'transparent',
                          borderBottom: isActive ? 'none' : '1px solid transparent',
                          bgcolor: isActive
                            ? theme.palette.background.paper
                            : theme.palette.mode === 'light'
                            ? theme.palette.primary.light
                            : theme.palette.primary.dark,
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.primary.contrastText,
                          boxShadow: isActive
                            ? '0 2px 6px rgba(15,23,42,0.16)'
                            : 'none',
                          transition: 'background-color 0.16s ease-out, color 0.16s ease-out, box-shadow 0.16s ease-out',
                          willChange: 'transform',
                          position: 'relative',
                          top: 0,
                          opacity: dragKey === tab.key ? 0 : 1,
                          pointerEvents: dragKey === tab.key ? 'none' : 'auto',
                          '&:hover': {
                            bgcolor: isActive
                              ? theme.palette.background.paper
                              : theme.palette.mode === 'light'
                              ? theme.palette.primary[300]
                              : theme.palette.primary[700],
                          },
                        }}
                      >
                        {code && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              fontSize: 11,
                              mr: 0.75,
                              px: 0.7,
                              py: 0.1,
                              borderRadius: 999,
                              bgcolor: isActive
                                ? 'rgba(15,23,42,0.04)'
                                : 'rgba(15,23,42,0.15)',
                            }}
                          >
                            {code}
                          </Typography>
                        )}

                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            mr: 0.35,
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          {tab.title}
                        </Typography>

                        <IconButton
                          size="small"
                          // ✅ 탭 드래그(onMouseDown)보다 먼저 이벤트를 차단해야 X 클릭이 정상 동작합니다.
                          // (부모 Box의 onMouseDown이 드래그를 시작하면서 클릭이 취소되는 케이스 방지)
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeTab(tab.key);
                          }}
                          sx={{
                            ml: 0.1,
                            width: 20,
                            height: 20,
                            p: 0,
                            color: 'inherit',
                            '&:hover': {
                              bgcolor: 'rgba(15,23,42,0.08)',
                            },
                          }}
                        >
                          <CloseRoundedIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    );
                  })}

                  {dragKey && dragGhost && (
                    <Box
                      sx={{
                        position: 'fixed',
                        left: dragGhost.left,
                        top: dragGhost.top,
                        width: dragGhost.width,
                        height: dragGhost.height,
                        zIndex: 20000,
                        pointerEvents: 'none',
                        opacity: 0.98,
                        transform: 'translate3d(0,0,0)',
                        willChange: 'left, top',
                        transition: dragRef.current.active ? 'none' : 'left 180ms cubic-bezier(0.2, 0.8, 0.2, 1), top 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                      }}
                    >
                      {(() => {
                        const tab = tabs.find(t => t.key === dragKey);
                        if (!tab) return null;
                        const code = tab.node?.screnNo;
                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              height: 27,
                              maxWidth: 260,
                              px: 1,
                              borderRadius: '8px 8px 0 0',
                              whiteSpace: 'nowrap',
                              cursor: 'grabbing',
                              border: '1px solid',
                              borderColor: 'transparent',
                              borderBottom: 'none',
                              bgcolor: theme.palette.background.paper,
                              color: theme.palette.primary.main,
                              boxShadow: '0 2px 6px rgba(15,23,42,0.16)',
                            }}
                          >
                            {code && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 11,
                                  mr: 0.75,
                                  px: 0.7,
                                  py: 0.1,
                                  borderRadius: 999,
                                  bgcolor: 'rgba(15,23,42,0.04)',
                                }}
                              >
                                {code}
                              </Typography>
                            )}
                            <Typography variant="body2" noWrap sx={{ mr: 0.35, fontWeight: 700 }}>
                              {tab.title}
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  )}

                </Box>
              </Box>

              {/* 컨텍스트 메뉴 */}
              <Menu
                open={contextMenu !== null}
                onClose={handleContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                  contextMenu !== null
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                    : undefined
                }
              >
                <MenuItem onClick={() => {
                  if (contextTabKey) removeTab(contextTabKey);
                  handleContextMenuClose();
                }}>
                  <ListItemIcon><CloseRoundedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>이 탭 닫기</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => {
                  if (contextTabKey) closeOtherTabs(contextTabKey);
                  handleContextMenuClose();
                }} disabled={tabs.length <= 1}>
                  <ListItemIcon><TabUnselectedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>다른 탭 모두 닫기</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => {
                  if (contextTabKey) closeLeftTabs(contextTabKey);
                  handleContextMenuClose();
                }} disabled={!contextTabKey || tabs.findIndex(t => t.key === contextTabKey) === 0}>
                  <ListItemIcon><TabIcon fontSize="small" sx={{ transform: 'scaleX(-1)' }} /></ListItemIcon>
                  <ListItemText>왼쪽 탭 모두 닫기</ListItemText>
                </MenuItem>

                <MenuItem onClick={() => {
                  if (contextTabKey) closeRightTabs(contextTabKey);
                  handleContextMenuClose();
                }} disabled={!contextTabKey || tabs.findIndex(t => t.key === contextTabKey) === tabs.length - 1}>
                  <ListItemIcon><TabIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>오른쪽 탭 모두 닫기</ListItemText>
                </MenuItem>

                <Divider />

                <MenuItem onClick={() => {
                  closeAllTabs();
                  handleContextMenuClose();
                }} sx={{ color: theme.palette.error.main }}>
                  <ListItemIcon><ClearAllIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>모든 탭 닫기</ListItemText>
                </MenuItem>
              </Menu>

              {/* 🔧 수정: 탭 컨텐츠 - 조건부 렌더링 */}
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {tabs.map((tab) => {
                  const isActive = tab.key === activeKey;
                  const shouldMount = mountedTabs.has(tab.key);

                  return (
                    <Box
                      key={tab.key}
                      sx={{
                        height: '100%',
                        display: isActive ? 'block' : 'none',
                      }}
                    >
                      {/* 한 번이라도 활성화된 탭만 렌더링 */}
                      {shouldMount && tab.content}
                    </Box>
                  );
                })}
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>

      <PushHistoryDialog
        open={pushOpen}
        onClose={() => setPushOpen(false)}
      />
      <NotificationSocket />
      <UserInfoDialog
        open={userInfoOpen}
        onClose={() => setUserInfoOpen(false)}
        fetchUrl="/api/users/me"
      />
    </>
  );
}
