// src/screens/GPCL/OPR/Batch/GPCLOPRBT01S1.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Modal, Space, Tabs, message } from "antd";
import { http } from '@/libs/TaskHttp';

import GFlowCanvas from "@/components/GFlowCanvas";
import GTreeList from "@/components/GTreeList";
import GMessageBox from '@/components/GMessageBox.jsx';

// 아이콘(트리 라벨용)
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import FolderIcon from '@mui/icons-material/Folder';

import folderImg from "./Images/folder.png";
import groupImg from "./Images/group.png";
import fileExportImg from "./Images/file-export.png";
import fileImportImg from "./Images/file-import.png";
import taskStartImg from "./Images/TaskStart.png";
import procImg from "./Images/proc.png";

const IMG = {
  folder: folderImg,
  group: groupImg,
  fileExport: fileExportImg,
  fileImport: fileImportImg,
  taskStart: taskStartImg,
  proc: procImg,
};

/** 로컬 저장 목록(기타 기능 유지용) */
function listSaved(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith("flow:"));
  const items = keys.map(k=>{
    try {
      const v = JSON.parse(localStorage.getItem(k) || "{}");
      return { id: k.slice(5), title: v?.meta?.title ?? k.slice(5), updatedAt: v?.meta?.updatedAt ?? '', folderId: v?.meta?.folderId ?? null };
    } catch { return null; }
  }).filter(Boolean);
  items.sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  return items;
}

export default function GPCLOPRBT01S1(){
  /*** 캔버스/탭 ***/
  const canvasRef = useRef(null);
  const canvasRefs = useRef({});       // id -> GFlowCanvas ref
  const canvasHostRefs = useRef({});   // id -> 캔버스 div (드랍 좌표용)
  const [openTabs, setOpenTabs] = useState([]); // [{id, title, _server}]
  const [activeTabId, setActiveTabId] = useState(null);
  const dirtyTabsRef = useRef(new Set());       // 변경된 탭 id 집합

  /*** 좌측 트리 선택 상태 ***/
  const [activeExplorerTab, setActiveExplorerTab] = useState('group');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedFileMapId, setSelectedFileMapId] = useState(null);
  const [selectedProcId, setSelectedProcId] = useState(null);

  /*** 부가 상태 ***/
  const [showGrid, setShowGrid] = useState(true);
  const [connectMode, setConnectMode] = useState(true);
  const [saved] = useState(listSaved());

  /*** 레이아웃(좌측 리사이저) ***/
  const MIN_LEFT = 220;
  const MAX_LEFT = 900;
  const [leftWidth, setLeftWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('GPCLOPRBT01_leftWidth'));
    if (Number.isFinite(v)) return Math.min(MAX_LEFT, Math.max(MIN_LEFT, v));
    return 300;
  });
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const onDragStart = (e) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };
  const onDrag = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    let next = startWidthRef.current + dx;
    if (next < MIN_LEFT) next = MIN_LEFT;
    if (next > MAX_LEFT) next = MAX_LEFT;
    setLeftWidth(next);
  };
  const onDragEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('GPCLOPRBT01_leftWidth', String(Math.round(leftWidth)));
  };
  useEffect(() => {
    const move = (e) => onDrag(e);
    const up = () => onDragEnd();
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, [leftWidth]);

  /*** 트리 높이 동적 ***/
  const [treeHeight, setTreeHeight] = useState(320);
  useEffect(() => {
    const updateHeight = () => {
      const h = typeof window !== 'undefined' ? Math.max(320, window.innerHeight - 240) : 320;
      setTreeHeight(h);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  /*** 서버 데이터 ***/
  const [batchGroups, setBatchGroups] = useState([]);
  const [fileMaps, setFileMaps] = useState([]);
  const [storedProcs, setStoredProcs] = useState([]);

  // ▶ 원본 스냅샷(배치그룹) : id -> 원본 row
  const groupOriginRef = useRef(new Map());

  const columnsForGroup = [
    'TASK_GRP_ID',
    'TASK_GRP_NM',
    'TASK_GRP_DSC',
    'TASK_GRP_TP_CD',
    'UP_TASK_GRP_ID',
    'EXECUTE_PARM_VAL',
    'BAT_SCHDL_ID',
    'BAS_DD_CHK_YN',
    'TR_TASK_TP_CD',
    'USE_YN',
    'BAT_INIT_GRP_YN',
    'BAT_SMS_SND_TP_CD',
    'SORT_ORD'
  ];

  const normalizeRow = (r) => {
    const o = {};
    columnsForGroup.forEach(k => { o[k] = r?.[k] ?? null; });
    return o;
  };

  const rowsEqual = (a, b) => {
    for (const k of columnsForGroup) {
      const va = a?.[k] ?? null;
      const vb = b?.[k] ?? null;
      if (String(va ?? '') !== String(vb ?? '')) return false;
    }
    return true;
  };

  const loadBatchGroups = async ()=>{
    try{
      const param = { SYS_TP_CD : "STO" };
      const { table } = await http.post('/admin/getbatchgroup', param, { shape: 'datatable' });
      const rows = Array.isArray(table) ? table : [];
      setBatchGroups(rows);
      // 스냅샷 갱신
      const snap = new Map();
      rows.forEach(r => snap.set(String(r.TASK_GRP_ID), normalizeRow(r)));
      groupOriginRef.current = snap;
    }catch(err){
      console.error(err);
      message.error('배치그룹 조회 실패: ' + (err?.message || 'unknown'));
    }
  };

  const loadFileMaps = async ()=>{
    try{
      const { table } = await http.post('/admin/getfilemaps', { TASK_GRP_ID: "" }, { shape:'datatable' });
      setFileMaps(Array.isArray(table) ? table : []);
    }catch(err){
      console.error(err);
      message.error('파일입출력 조회 실패: ' + (err?.message || 'unknown'));
    }
  };

  const loadStoredProcs = async ()=>{
    try{
      const { table } = await http.post('/admin/getstoredprocs', { TASK_GRP_ID: "" }, { shape:'datatable' });
      setStoredProcs(Array.isArray(table) ? table : []);
    }catch(err){
      console.error(err);
      message.error('프로시저 조회 실패: ' + (err?.message || 'unknown'));
    }
  };

  useEffect(()=>{ loadBatchGroups(); }, []);

  /*** 트리 데이터 어댑터 ***/
  const makeTree = (rows, { idKey, labelKey, parentKey }) => {
    const byParent = new Map();
    (rows || []).forEach(r => {
      const pid = r?.[parentKey] ?? null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(r);
    });
    const build = (pid = null) =>
      (byParent.get(pid) || []).map(r => ({
        id: String(r[idKey]),
        label: r[labelKey] ?? String(r[idKey]),
        meta: r,
        children: build(r[idKey])
      }));
    return build(null);
  };

  const groupTreeData = useMemo(() => makeTree(batchGroups, {
    idKey:'TASK_GRP_ID', labelKey:'TASK_GRP_NM', parentKey:'UP_TASK_GRP_ID'
  }), [batchGroups]);

  const fileTreeData = useMemo(() => makeTree(fileMaps, {
    idKey:'FILE_MAP_ID', labelKey:'MAP_INFO_NM', parentKey:'UP_FILE_MAP_ID'
  }), [fileMaps]);

  const procTreeData = useMemo(() => makeTree(storedProcs, {
    idKey:'PROC_ID', labelKey:'PROC_NM', parentKey:'UP_PROC_ID'
  }), [storedProcs]);

  /*** 캔버스 JSON Import/Export ***/
  const fileInputRef = useRef(null);
  const exportJSON = ()=>{
    const json = canvasRef.current?.exportJson();
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (activeTabId || "flow") + ".json";
    a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = ()=> fileInputRef.current?.click();
  const onFileChange = (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try { canvasRef.current?.importJson(reader.result); message.success("불러오기 완료"); }
      catch { message.error("JSON 형식 오류"); }
    };
    reader.readAsText(f); e.target.value = "";
  };

  /*** 캔버스 열기/불러오기 ***/
  const importToTab = (id, payload) => {
    const nodes = payload?.nodes ?? payload?.value?.nodes ?? [];
    const edges = payload?.edges ?? payload?.value?.edges ?? [];
    canvasRefs.current[id]?.importJson({ nodes, edges });
    dirtyTabsRef.current.delete(String(id));
  };

  const openTaskTab = (job) => {
    if (!job) return;
    const id = String(job.id);
    const title = job.title || id;
    const exists = openTabs.some(t => t.id === id);
    if (exists) { setActiveTabId(id); return; }
    setOpenTabs(prev => [...prev, { id, title, _server: job._server }]);
    setActiveTabId(id);
    setTimeout(() => {
      if (job._server) loadFlowServer(id, true);
      else loadFlowLocal(id);
    }, 0);
  };

  const loadFlowLocal = (id)=>{
    const raw = localStorage.getItem("flow:"+id); if(!raw) return;
    try {
      const obj = JSON.parse(raw);
      importToTab(id, { nodes: obj.nodes ?? [], edges: obj.edges ?? [] });
    } catch { message.error("저장 파일이 손상되었습니다."); }
  };

  const loadFlowServer = async (taskGrpId, toTab=false) => {
    try {
      const { row } = await http.post('/admin/getbatchflow', { TASK_GRP_ID: taskGrpId }, { shape: 'datarow' });
      let payload = (row && (row.GRP_XML_CONTN ?? row)) ?? {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { payload = {}; }
      }
      let nodes = payload?.nodes ?? payload?.value?.nodes ?? [];
      let edges = payload?.edges ?? payload?.value?.edges ?? [];
      const isEmpty = (!Array.isArray(nodes) || nodes.length === 0) && (!Array.isArray(edges) || edges.length === 0);
      if (isEmpty) {
        const startNode = { id:`n_init_${taskGrpId}`, type:"image", img:IMG.taskStart, label:"시작", x:200, y:200, w:70, h:70 };
        nodes = [startNode]; edges = [];
      }
      const json = { nodes:Array.isArray(nodes)?nodes:[], edges:Array.isArray(edges)?edges:[] };
      toTab ? importToTab(taskGrpId, json) : canvasRef.current?.importJson(json);
    } catch (err) {
      console.error(err);
      message.error('작업 불러오기 실패: ' + (err?.message || 'unknown'));
    }
  };

  /*** 저장 : 우측 캔버스(JSON) ***/
  const saveCanvasJson = async ()=>{
    const id = activeTabId;

    if (!id)  {
      await GMessageBox.Show('MGE00890', 'Ok', 'warning', 'Information');
      return;
    }

    if (!dirtyTabsRef.current.has(String(id))) {
      await GMessageBox.Show('MGE00890', 'Ok', 'warning', 'Information');
      return;

    }

    const state =
      (canvasRefs.current?.[id]?.getState)
        ? canvasRefs.current[id].getState()
        : (canvasRef.current?.getState ? canvasRef.current.getState() : null);

    const nodes = state?.nodes ?? [];
    const edges = state?.edges ?? [];
    const grpXmlContn = JSON.stringify({ nodes, edges });

    try {
      await http.post('/admin/savebatchflow', { TASK_GRP_ID:id, GRP_XML_CONTN:grpXmlContn }, { shape:'datarow' });
      dirtyTabsRef.current.delete(String(id));
      message.success('배치 플로우가 저장되었습니다.');
    } catch (e) {
      console.error(e);
      message.error(e.message || '배치 플로우 저장 중 오류가 발생했습니다.');
    }
  };

  /*** 저장 : 좌측 배치그룹 단건(ROW_STATE 적용) ***/
  const buildRowWithRowState = (row) => {
    const id = String(row.TASK_GRP_ID ?? '');
    const isTemp = id.startsWith('tmp_');
    const now = normalizeRow(row);
    const origin = groupOriginRef.current.get(id);

    let ROW_STATE = 'U';
    if (isTemp || !origin) ROW_STATE = 'I';
    else if (origin && rowsEqual(origin, now)) ROW_STATE = null; // 변경 없음

    return ROW_STATE ? { ...now, ROW_STATE } : null;
  };

  const saveSelectedGroupRow = async ()=>{
    const id = String(selectedGroupId ?? '');
    if (!id) { message.info('선택된 배치그룹이 없습니다.'); return; }
    const row = batchGroups.find(r => String(r.TASK_GRP_ID) === id);
    if (!row) { message.warning('선택된 배치그룹 정보를 찾지 못했습니다.'); return; }

    const payloadRow = buildRowWithRowState(row);
    if (!payloadRow) {
      message.info('변경된 내용이 없습니다.');
      return;
    }

    try {
      await http.post('/admin/savebatchgroup', { rows:[payloadRow] }, { shape:'none' });
      message.success('배치그룹 정보가 저장되었습니다.');
      await loadBatchGroups();  // 저장 후 원본 스냅샷 갱신
    } catch (e) {
      console.error(e);
      message.error(e.message || '배치그룹 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteSelectedGroupRow = async ()=>{
    const id = String(selectedGroupId ?? '');
    if (!id) { message.info('삭제할 배치그룹을 선택하세요.'); return; }
    const row = batchGroups.find(r => String(r.TASK_GRP_ID) === id);
    if (!row) { message.warning('선택된 배치그룹 정보를 찾지 못했습니다.'); return; }
    const hasChild = batchGroups.some(r => String(r.UP_TASK_GRP_ID ?? '') === id);
    if (hasChild) { message.warning('하위 항목이 있어 삭제할 수 없습니다.'); return; }

    Modal.confirm({
      title:'삭제 확인',
      content:'선택한 배치그룹을 삭제하시겠습니까?',
      okText:'삭제', cancelText:'취소',
      async onOk(){
        try{
          const now = normalizeRow(row);
          await http.post('/admin/savebatchgroup', { rows:[{ ...now, ROW_STATE:'D' }] }, { shape:'none' });
          message.success('삭제되었습니다.');
          await loadBatchGroups();
          setSelectedGroupId(null);
        }catch(e){
          console.error(e);
          message.error(e.message || '삭제 중 오류가 발생했습니다.');
        }
      }
    });
  };

  /*** 트리 라벨(아이콘/드래그) ***/
  const renderGroupLabel = (node) => {
    const tp = node?.meta?.TASK_GRP_TP_CD ? String(node.meta.TASK_GRP_TP_CD) : null;
    let icon = null;
    if (tp === '01') {
      icon = <ArrowRightAltIcon style={{ fontSize: 16, color: '#1890ff', marginRight: 4 }} />;
    } else if (tp === '02') {
      icon = <FolderIcon style={{ fontSize: 16, color: '#faad14', marginRight: 4 }} />;
    }
    return (
      <span style={{ display:'inline-flex', alignItems:'center' }}>
        {icon}{node.label}
      </span>
    );
  };
  const renderFileLabel = (node) => {
    const tp = node?.meta?.MAP_TP_CD ? String(node.meta.MAP_TP_CD) : null;
    let icon = null;
    if (tp === '00') icon = <img src={IMG.folder} alt="folder" style={{ width:16, height:16, marginRight:4 }} />;
    else if (tp === '01') icon = <img src={IMG.fileImport} alt="import" style={{ width:16, height:16, marginRight:4 }} />;
    else if (tp === '02') icon = <img src={IMG.fileExport} alt="export" style={{ width:16, height:16, marginRight:4 }} />;
    else icon = <img src={IMG.fileImport} alt="import" style={{ width:16, height:16, marginRight:4 }} />;
    return <span style={{ display:'inline-flex', alignItems:'center' }}>{icon}{node.label}</span>;
  };
  const renderProcLabel = (node) => {
    const tp = node?.meta?.PROC_TP_CD ? String(node.meta.PROC_TP_CD) : null;
    let icon = (tp === '02')
      ? <FolderIcon style={{ fontSize: 16, color: '#faad14', marginRight: 4 }} />
      : <ArrowRightAltIcon style={{ fontSize: 16, color: '#1890ff', marginRight: 4 }} />;
    return <span style={{ display:'inline-flex', alignItems:'center' }}>{icon}{node.label}</span>;
  };

  /*** 캔버스 이동/확대 상태 ***/
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x:0, y:0 });
  useEffect(()=>{
    const onPan = (e)=> setPan(e.detail);
    const svg = document.querySelector("svg");
    if (svg) svg.addEventListener("flowcanvas-pan", onPan);
    return () => { if (svg) svg.removeEventListener("flowcanvas-pan", onPan); };
  }, []);

  /*** 드래그 시작 payload(트리 → 캔버스) ***/
  const beginDragGroup = (node, e) => {
    const meta = node?.meta || {};
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'group-tree',
      payload: {
        TASK_GRP_ID: meta.TASK_GRP_ID,
        TASK_GRP_NM: meta.TASK_GRP_NM,
        TASK_GRP_TP_CD: meta.TASK_GRP_TP_CD,
      },
    }));
  };
  const beginDragFile = (node, e) => {
    const m = node?.meta || {};
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'file-tree',
      payload: { ...m },
    }));
  };
  const beginDragProc = (node, e) => {
    const m = node?.meta || {};
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'proc-tree',
      payload: { ...m },
    }));
  };

  /*** 캔버스에 노드 추가 ***/
  const addNodeToCanvas = (tabId, newNode) => {
    const ref = canvasRefs.current?.[tabId];
    if (!ref?.getState || !ref?.setState) return;
    const state = ref.getState() || {};
    const nodes = Array.isArray(state.nodes) ? [...state.nodes] : [];
    const edges = Array.isArray(state.edges) ? [...state.edges] : [];
    // id 충돌 방지
    const id = newNode.id || ('n_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6));
    nodes.push({ ...newNode, id });
    ref.setState({ nodes, edges });
    dirtyTabsRef.current.add(String(tabId));
  };

  /*** 좌표 계산(드랍 위치 → 캔버스 좌표, pan/zoom 반영) ***/
  const toCanvasPoint = (tabId, clientX, clientY) => {
    const host = canvasHostRefs.current?.[tabId];
    if (!host) return { x: 100, y: 100 };
    const rect = host.getBoundingClientRect();
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    // pan/zoom 보정
    const zx = (x - (pan?.x || 0)) / (zoom || 1);
    const zy = (y - (pan?.y || 0)) / (zoom || 1);
    return { x: Math.round(zx), y: Math.round(zy) };
  };

  /*** 좌측 탭(트리 3개) ***/
  const tabs = [
    { key:"group", label:"배치그룹", children:(
      <div style={{ height:'100%' }}>
        <GTreeList
          title="배치그룹"
          data={groupTreeData}
          defaultExpanded={(() => {
            const ids = [];
            const walk = (arr, d=0)=>arr?.forEach(n=>{ if(d<=1) ids.push(String(n.id)); if(n.children?.length) walk(n.children,d+1); });
            walk(groupTreeData,0); return ids;
          })()}
          selectedId={selectedGroupId || undefined}
          onSelect={(id)=> setSelectedGroupId(id)}
          onDoubleClick={(id, node)=>{
            setSelectedGroupId(id);
            const tp = String(node?.meta?.TASK_GRP_TP_CD ?? '');
            if (tp === '01') openTaskTab({ id:String(id), title: node?.label, _server:true });
          }}

          Buttons={[true,true,true,true]}
          onAdd={()=>{/* 필요 시 신규행 생성 로직 */}}
          onRemove={deleteSelectedGroupRow}
          onUndo={loadBatchGroups}
          onExport={()=>{/* 필요 시 트리 엑셀 내보내기 */}}

          height={treeHeight}
          rowHeight={26}
          indentWidth={0}
          connectorOffset={0}
          labelFontSize={'13px'}
          renderLabel={renderGroupLabel}
          onBeginDrag={beginDragGroup}
        />
        <div style={{ marginTop:8, display:'flex', gap:8 }}>
          <Button type="primary" onClick={saveSelectedGroupRow}>배치그룹 저장(ROW_STATE)</Button>
        </div>
      </div>
    )},
    { key:"file", label:"파일입출력", children:(
      <div style={{ height:'100%' }}>
        <GTreeList
          title="파일입출력"
          data={fileTreeData}
          defaultExpanded={[]}
          selectedId={selectedFileMapId || undefined}
          onSelect={(id)=> setSelectedFileMapId(id)}
          Buttons={[false,false,false,false]}
          height={treeHeight}
          rowHeight={26}
          indentWidth={0}
          connectorOffset={0}
          labelFontSize={'13px'}
          renderLabel={renderFileLabel}
          onBeginDrag={beginDragFile}
        />
      </div>
    )},
    { key:"proc", label:"프로시저", children:(
      <div style={{ height:'100%' }}>
        <GTreeList
          title="프로시저"
          data={procTreeData}
          defaultExpanded={[]}
          selectedId={selectedProcId || undefined}
          onSelect={(id)=> setSelectedProcId(id)}
          Buttons={[false,false,false,false]}
          height={treeHeight}
          rowHeight={24}
          indentWidth={0}
          connectorOffset={0}
          labelFontSize={'13px'}
          renderLabel={renderProcLabel}
          onBeginDrag={beginDragProc}
        />
      </div>
    )},
  ];

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:`${leftWidth}px 6px 1fr`, height:"calc(100vh - 80px)", gap:12 }}>
        {/* 왼쪽: 탭 + 트리 */}
        <div style={{ borderRight:"1px solid #eee", overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <Tabs
            items={tabs}
            activeKey={activeExplorerTab}
            onChange={(k)=>{
              setActiveExplorerTab(k);
              if(k==='group'){ setSelectedFileMapId(null); setSelectedProcId(null); loadBatchGroups(); }
              if(k==='file'){  setSelectedGroupId(null); setSelectedProcId(null); loadFileMaps(); }
              if(k==='proc'){  setSelectedGroupId(null); setSelectedFileMapId(null); loadStoredProcs(); }
            }}
            style={{ paddingInline:4 }}
          />
        </div>

        {/* splitter */}
        <div
          onMouseDown={onDragStart}
          style={{
            cursor:'col-resize', width:6,
            background: draggingRef.current ? '#eef5ff' : '#f5f5f5',
            borderLeft:'1px solid #e8e8e8', borderRight:'1px solid #e8e8e8', height:'100%'
          }}
        />

        {/* 오른쪽: 캔버스 영역 */}
        <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
          <div style={{ padding:8, borderBottom:"1px solid #eee", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <Space>
              <Button onClick={()=>setZoom(z=>Math.min(2.5, +(z+0.1).toFixed(2)))}>＋</Button>
              <Button onClick={()=>{ setZoom(1); setPan({x:0,y:0}); }}>◎</Button>
              <Button onClick={()=>setZoom(z=>Math.max(0.4, +(z-0.1).toFixed(2)))}>－</Button>
            </Space>
            <div style={{ flex:1 }} />
            <Space wrap>
              <Checkbox checked={connectMode} onChange={(e)=>setConnectMode(e.target.checked)}>연결 모드</Checkbox>
              <Checkbox checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)}>격자</Checkbox>
              <Button onClick={exportJSON}>내보내기</Button>
              <Button onClick={importJSON}>불러오기</Button>
            </Space>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileChange} hidden />
          </div>

          <div style={{ position:'relative', flex:1, minHeight:0 }}>
            <Tabs
              type="editable-card"
              hideAdd
              items={openTabs.map(t => ({
                key: t.id,
                label: t.title || t.id,
                children: (
                  <div
                    ref={el => { if (el) { const m = canvasHostRefs.current || {}; m[t.id] = el; canvasHostRefs.current = m; } }}
                    style={{ position:'relative', height:'100%' }}
                    onDragOver={(e)=>{ e.preventDefault(); }}
                    onDrop={(e)=>{
                      e.preventDefault();
                      let parsed = null;
                      try { parsed = JSON.parse(e.dataTransfer.getData('application/json')); } catch {}
                      if (!parsed || !parsed.source) return;
                      const pt = toCanvasPoint(t.id, e.clientX, e.clientY);

                      // 드랍 소스 별로 노드 생성
                      if (parsed.source === 'group-tree') {
                        const p = parsed.payload || {};
                        const node = {
                          type: 'image',
                          img: IMG.group,
                          label: p.TASK_GRP_NM || '그룹작업',
                          x: pt.x, y: pt.y, w: 70, h: 70,
                          meta: { kind: 'GROUP', TASK_GRP_ID: p.TASK_GRP_ID, TP: p.TASK_GRP_TP_CD }
                        };
                        addNodeToCanvas(t.id, node);
                      } else if (parsed.source === 'file-tree') {
                        const p = parsed.payload || {};
                        const node = {
                          type: 'image',
                          img: p.MAP_TP_CD === '02' ? IMG.fileExport : IMG.fileImport,
                          label: p.MAP_INFO_NM || '파일 I/O',
                          x: pt.x, y: pt.y, w: 70, h: 70,
                          meta: { kind: 'FILE', ...p }
                        };
                        addNodeToCanvas(t.id, node);
                      } else if (parsed.source === 'proc-tree') {
                        const p = parsed.payload || {};
                        const node = {
                          type: 'image',
                          img: IMG.proc,
                          label: p.PROC_NM || '프로시저',
                          x: pt.x, y: pt.y, w: 70, h: 70,
                          meta: { kind: 'PROC', ...p }
                        };
                        addNodeToCanvas(t.id, node);
                      }
                    }}
                  >
                    <GFlowCanvas
                      ref={el => { if (el) { const m = canvasRefs.current || {}; m[t.id] = el; canvasRefs.current = m; } }}
                      showGrid={showGrid}
                      connectMode={connectMode}
                      onChange={()=>{ dirtyTabsRef.current.add(String(t.id)); }}
                      zoom={zoom}
                      pan={pan}
                    />
                  </div>
                )
              }))}
              activeKey={activeTabId || undefined}
              onChange={(k)=> setActiveTabId(k)}
              onEdit={(targetKey, action) => {
                if (action === 'remove') {
                  setOpenTabs(prev => prev.filter(t => t.id !== targetKey));
                  const m = { ...(canvasRefs.current || {}) }; delete m[targetKey]; canvasRefs.current = m;
                  dirtyTabsRef.current.delete(String(targetKey));
                  if (activeTabId === targetKey) {
                    const rest = openTabs.filter(t => t.id !== targetKey);
                    setActiveTabId(rest.length ? rest[rest.length - 1].id : null);
                  }
                }
              }}
            />
{           /* Save 버튼을 화면 오른쪽 하단에 고정 표시 */}
            <div style={{
              position: 'fixed',
              right: '32px',
            }}>
              <Button
                auth="Save"
                type="primary"
                size="large"
                onClick={saveCanvasJson}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
