// GFlowCanvas.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const GRID = 10;
const CARD_W = 86;
const CARD_H = 86;
const PADDING = 10;

const MARKER = { R: 5.2, ARROW_W: 14, ARROW_H: 8 };

const uid = (p="id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const anchorRight = (n) => ({ x: n.x + n.w, y: n.y + n.h / 2 });
const anchorLeft  = (n) => ({ x: n.x,       y: n.y + n.h / 2 });

function GFlowCanvas(
  { width=1400, height=760, showGrid=true, snapToGrid=true, connectMode=false, value, onChange, zoom=1, pan={x:0,y:0} },
  ref
){
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const svgRef = useRef(null);
  const gridIdRef = useRef(`grid_${Math.random().toString(36).slice(2,9)}`);
  const [nodes, setNodes] = useState(value?.nodes ?? []);
  const [edges, setEdges] = useState(value?.edges ?? []);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);
  const [drag, setDrag] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [panning, setPanning] = useState(null);
  const [hoverTargetId, setHoverTargetId] = useState(null);
  const [boxSel, setBoxSel] = useState(null); // {x1,y1,x2,y2, additive}
  const [ctx, setCtx] = useState(null); // {x,y,type:'node'|'edge'|'canvas', nodeIds?, edgeIds?}
  const [clip, setClip] = useState(null); // {nodes, edges}

  useEffect(()=>{
    if(!value) return;
    value.nodes && setNodes(value.nodes);
    value.edges && setEdges(value.edges);
    setSelectedNodeIds([]); setSelectedEdgeIds([]); setConnecting(null); setHoverTargetId(null);
  }, [value?.nodes, value?.edges]);

  useEffect(()=>{ onChange?.({nodes, edges}); }, [nodes, edges]);

  useEffect(()=>{
    if(connectMode){ setSelectedNodeIds([]); setSelectedEdgeIds([]); }
  }, [connectMode]);

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(()=>{
    const onDown = (e)=>{
      if(!menuRef.current) { setCtx(null); return; }
      if(menuRef.current.contains(e.target)) return;
      setCtx(null);
    };
    window.addEventListener("mousedown", onDown, true);
    return ()=> window.removeEventListener("mousedown", onDown, true);
  }, []);

  // ⌫/Delete 키로 삭제 — 캔버스에 포커스가 있을 때만 동작
  const handleKeyDown = (e)=>{
    if(e.key !== 'Delete' && e.key !== 'Backspace') return;
    // 입력창에서의 백스페이스는 방해하지 않음
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable;
    if(isInput && e.key === 'Backspace') return;

    // 캔버스가 포커스일 때만
    if(document.activeElement !== wrapRef.current) return;

    e.preventDefault();
    deleteSelected();
  };

  useEffect(()=>{
    const el = wrapRef.current;
    if(!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return ()=> el.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, selectedEdgeIds, nodes, edges]);

  const getSvgPoint = (evt) => {
    const svg = svgRef.current; const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const inv = svg.getScreenCTM().inverse(); const p = pt.matrixTransform(inv);
    const x = (p.x - pan.x) / zoom; const y = (p.y - pan.y) / zoom;
    return { x, y };
  };
  const snap = (v)=> snapToGrid ? Math.round(v/GRID)*GRID : v;

  const addNode = (partial)=>{
    const id = uid("n");
    const node = { id, type: partial?.type ?? "image", img: partial?.img ?? "", label: partial?.label ?? "", x: snap(partial?.x ?? 100), y: snap(partial?.y ?? 100), w: partial?.w ?? CARD_W, h: partial?.h ?? CARD_H };
    setNodes(prev=>[...prev, node]); return id;
  };

  const exportJson = ()=> JSON.stringify({nodes, edges}, null, 2);
  const importJson = (data)=>{
    let obj = data; if(typeof data==="string"){ try { obj = JSON.parse(data); } catch { return; } }
    setNodes(Array.isArray(obj.nodes) ? obj.nodes : []);
    setEdges(Array.isArray(obj.edges) ? obj.edges : []);
    setSelectedNodeIds([]); setSelectedEdgeIds([]); setConnecting(null); setHoverTargetId(null);
  };
  const getState = ()=>({nodes, edges});
  const setState = (next)=>{ if(next?.nodes) setNodes(next.nodes); if(next?.edges) setEdges(next.edges); };
  useImperativeHandle(ref, ()=>({ addNode, exportJson, importJson, getState, setState, setEdges, setNodes }), [nodes, edges, snapToGrid]);

  const hitNodeAt = (p)=>{
    for(let i=nodes.length-1; i>=0; i--){
      const n = nodes[i];
      if(p.x >= n.x && p.x <= n.x + n.w && p.y >= n.y && p.y <= n.y + n.h) return n;
    }
    return null;
  };

  /** ===== Node select/move ===== */
  const onShapeMouseDown = (evt, id)=>{
    evt.stopPropagation(); setCtx(null);
    // 클릭 시 포커스(키보드 삭제를 위해)
    wrapRef.current?.focus();

    if(connectMode){
      const n = nodes.find(nn=>nn.id===id); if(!n) return;
      const p1 = anchorRight(n);
      setConnecting({ fromId:id, x1:p1.x, y1:p1.y, x2:p1.x, y2:p1.y });
      setHoverTargetId(null);
      setSelectedNodeIds([]); setSelectedEdgeIds([]);
      return;
    }
    const p = getSvgPoint(evt);
    let ids;
    if (evt.shiftKey) {
      ids = [...new Set([...selectedNodeIds, id])];
    } else if (selectedNodeIds.length > 1 && selectedNodeIds.includes(id)) {
      ids = [...selectedNodeIds];
    } else {
      ids = [id];
    }
    setSelectedNodeIds(ids); setSelectedEdgeIds([]);
    const pos = new Map(); for(const n of nodes) if(ids.includes(n.id)) pos.set(n.id, {x:n.x, y:n.y});
    setDrag({ startX:p.x, startY:p.y, ids, pos });
  };
  const onShapeMouseUp = (evt, id)=>{
    if(!connectMode || !connecting) return;
    evt.stopPropagation();
    if(connecting.fromId !== id){
      setEdges(prev => [...prev, { id: uid("e"), from: connecting.fromId, to: id }]);
    }
    setConnecting(null); setHoverTargetId(null);
  };
  const onShapeContext = (evt, id)=>{
    evt.preventDefault(); evt.stopPropagation();
    wrapRef.current?.focus();
    if(!selectedNodeIds.includes(id)) setSelectedNodeIds([id]);
    setSelectedEdgeIds([]);
    const rect = wrapRef.current?.getBoundingClientRect?.() || {left:0, top:0};
    setCtx({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, type: "node" });
  };

  const onEdgeContext = (evt, id)=>{
    evt.preventDefault(); evt.stopPropagation();
    wrapRef.current?.focus();
    if(!selectedEdgeIds.includes(id)) setSelectedEdgeIds([id]);
    setSelectedNodeIds([]);
    const rect = wrapRef.current?.getBoundingClientRect?.() || {left:0, top:0};
    setCtx({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, type: "edge" });
  };

  const onCanvasContext = (evt)=>{
    if(connectMode) return;
    evt.preventDefault(); evt.stopPropagation();
    wrapRef.current?.focus();
    const rect = wrapRef.current?.getBoundingClientRect?.() || {left:0, top:0};
    setCtx({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, type: "canvas" });
  };

  const onSvgMouseDown = (evt)=>{
    setCtx(null);
    wrapRef.current?.focus();

    const spacePressed = evt.getModifierState && evt.getModifierState("Space");
    if(spacePressed){
      const pt = { x: evt.clientX, y: evt.clientY };
      setPanning({ startX: pt.x, startY: pt.y, panX: pan.x, panY: pan.y });
      return;
    }
    const p = getSvgPoint(evt);
    const node = hitNodeAt(p);
    if(!node && !connectMode){
      setBoxSel({ x1:p.x, y1:p.y, x2:p.x, y2:p.y, additive: evt.shiftKey });
      setSelectedEdgeIds([]);
      return;
    }
    setSelectedNodeIds([]); setSelectedEdgeIds([]);
  };

  const onSvgMove = (evt)=>{
    if(panning){
      const dx = evt.clientX - panning.startX;
      const dy = evt.clientY - panning.startY;
      const newPan = { x: panning.panX + dx, y: panning.panY + dy };
      const event = new CustomEvent("Gflowcanvas-pan", { detail: newPan });
      svgRef.current.dispatchEvent(event);
      return;
    }
    const p = getSvgPoint(evt);
    if(boxSel){
      setBoxSel(prev => ({ ...prev, x2:p.x, y2:p.y }));
      return;
    }
    if(drag){
      const dx = p.x - drag.startX, dy = p.y - drag.startY;
      setNodes(prev => prev.map(n => !drag.ids.includes(n.id) ? n : ({ ...n, x: snap(drag.pos.get(n.id).x + dx), y: snap(drag.pos.get(n.id).y + dy) })));
    }
    if(connecting){
      setConnecting(prev => prev ? { ...prev, x2: p.x, y2: p.y } : null);
      const n = hitNodeAt(p);
      if(n && n.id !== connecting.fromId) setHoverTargetId(n.id); else setHoverTargetId(null);
    }
  };
  const onSvgMouseUp = (evt)=>{
    if(boxSel){
      const { x1, y1, x2, y2, additive } = boxSel;
      const minX = Math.min(x1,x2), minY = Math.min(y1,y2);
      const maxX = Math.max(x1,x2), maxY = Math.max(y1,y2);
      const picked = nodes.filter(n => (n.x < maxX && n.x + n.w > minX && n.y < maxY && n.y + n.h > minY)).map(n=>n.id);
      setSelectedNodeIds(additive ? [...new Set([...selectedNodeIds, ...picked])] : picked);
      setBoxSel(null);
    }
    if(drag) setDrag(null);
    if(connecting){
      const p = getSvgPoint(evt);
      const toNode = hitNodeAt(p);
      if(toNode && toNode.id !== connecting.fromId){
        setEdges(prev => [...prev, { id: uid("e"), from: connecting.fromId, to: toNode.id }]);
      }
      setConnecting(null); setHoverTargetId(null);
    }
    if(panning) setPanning(null);
  };

  /** ===== DnD from side panel ===== */
  const onDrop = (evt)=>{
    evt.preventDefault();
    const {x,y} = getSvgPoint(evt);
    try{
      const raw = evt.dataTransfer.getData("application/x-flow-node");
      if(raw){ const obj = JSON.parse(raw); addNode({ ...obj, x: x - CARD_W/2, y: y - CARD_H/2 }); return; }
    }catch{}
  };
  const onDragOver = (e)=> e.preventDefault();

  /** ===== Actions ===== */
  const deleteSelected = ()=>{
    if(selectedNodeIds.length){
      const setIds = new Set(selectedNodeIds);
      setEdges(prev => prev.filter(e => !(setIds.has(e.from) || setIds.has(e.to))));
      setNodes(prev => prev.filter(n => !setIds.has(n.id)));
      setSelectedNodeIds([]);
    }else if(selectedEdgeIds.length){
      const del = new Set(selectedEdgeIds);
      setEdges(prev => prev.filter(e => !del.has(e.id)));
      setSelectedEdgeIds([]);
    }
    setCtx(null);
  };
  const disconnectSelectedNodes = ()=>{
    if(!selectedNodeIds.length) return;
    const setIds = new Set(selectedNodeIds);
    setEdges(prev => prev.filter(e => !(setIds.has(e.from) || setIds.has(e.to))));
    setCtx(null);
  };
  const duplicateSelected = ()=>{
    if(!selectedNodeIds.length) return;
    const idMap = new Map();
    const offset = GRID*2;
    const newNodes = nodes.map(n => {
      if(!selectedNodeIds.includes(n.id)) return null;
      const id = uid("n"); idMap.set(n.id, id);
      return { ...n, id, x: n.x + offset, y: n.y + offset };
    }).filter(Boolean);
    const newEdges = edges.map(e=>{
      if(idMap.has(e.from) && idMap.has(e.to)){
        return { id: uid("e"), from: idMap.get(e.from), to: idMap.get(e.to) };
      }
      return null;
    }).filter(Boolean);
    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeIds(newNodes.map(n=>n.id)); setSelectedEdgeIds([]);
    setCtx(null);
  };

  const copySelected = ()=>{
    if(!selectedNodeIds.length) return;
    const setIds = new Set(selectedNodeIds);
    const subNodes = nodes.filter(n => setIds.has(n.id));
    const subEdges = edges.filter(e => setIds.has(e.from) && setIds.has(e.to));
    setClip({ nodes: JSON.parse(JSON.stringify(subNodes)), edges: JSON.parse(JSON.stringify(subEdges)) });
  };
  const pasteClipboard = ()=>{
    if(!clip || !clip.nodes?.length) return;
    const idMap = new Map();
    const offset = GRID*2;
    let base = { x: 0, y: 0 };
    if(ctx){
      base = { x: (ctx.x - pan.x)/zoom, y: (ctx.y - pan.y)/zoom };
    }
    const minX = Math.min(...clip.nodes.map(n=>n.x));
    const minY = Math.min(...clip.nodes.map(n=>n.y));
    const dx0 = base.x - minX, dy0 = base.y - minY;
    const newNodes = clip.nodes.map(n=>{
      const id = uid("n"); idMap.set(n.id, id);
      return { ...n, id, x: snap(n.x + dx0 + offset), y: snap(n.y + dy0 + offset) };
    });
    const newEdges = clip.edges.map(e => ({ id: uid("e"), from: idMap.get(e.from), to: idMap.get(e.to) }));
    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeIds(newNodes.map(n=>n.id)); setSelectedEdgeIds([]);
    setCtx(null);
  };

  /** ===== Curved/straight path helpers ===== */
  const straightOrCurvePath = (p1, p2)=>{
    const dy = Math.abs(p2.y - p1.y);
    if(dy <= GRID) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }
    const dx = Math.max(40, Math.min(120, Math.abs(p2.x - p1.x) / 2));
    const c1x = p1.x + dx, c1y = p1.y;
    const c2x = p2.x - dx, c2y = p2.y;
    return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  };

  /** ===== Render ===== */
  const gridDefs = (
    <defs>
      <pattern id={gridIdRef.current} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
        <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} stroke="#f0f0f0" strokeWidth="1" fill="none" />
      </pattern>
    </defs>
  );

  const renderNode = (n)=>{
    const isSel = selectedNodeIds.includes(n.id);
    const isHoverTarget = !!connecting && hoverTargetId === n.id;
    const imgW = Math.max(0, n.w - PADDING*2), imgH = Math.max(0, n.h - PADDING*2);
    const labelY = n.y + n.h + 18;
    const overlayProps = {
      x: n.x, y: n.y, width: n.w, height: n.h, fill: "transparent", style: { cursor: connectMode ? "crosshair" : "move" },
      onMouseDown: (e)=>onShapeMouseDown(e, n.id),
      onMouseUp:   (e)=>onShapeMouseUp(e, n.id),
      onContextMenu: (e)=>onShapeContext(e, n.id),
    };
    return (
      <g key={n.id}>
        <image href={n.img} xlinkHref={n.img} x={n.x + PADDING} y={n.y + PADDING} width={imgW} height={imgH}
               preserveAspectRatio="xMidYMid meet" style={{ cursor: connectMode ? "crosshair" : "move", userSelect: "none" }}
               onMouseDown={(e)=>onShapeMouseDown(e, n.id)}
               onMouseUp={(e)=>onShapeMouseUp(e, n.id)}
               onContextMenu={(e)=>onShapeContext(e, n.id)}
        />
        <rect {...overlayProps} />
        {(isSel || isHoverTarget) && (
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" ry="10"
                fill="none" stroke="#1677ff" strokeWidth="2" />
        )}
        {n.label && (
          <text x={n.x + n.w/2} y={labelY} textAnchor="middle" fontSize="12" fill="#3f4a5a"
                style={{ userSelect:"none", pointerEvents:"none" }}>{n.label}</text>
        )}
      </g>
    );
  };

  const onEdgeDown = (e, id)=>{
    e.stopPropagation(); setCtx(null);
    const ids = e.shiftKey ? [...new Set([...selectedEdgeIds, id])] : [id];
    setSelectedEdgeIds(ids); setSelectedNodeIds([]);
  };

  const edgePathsTop = edges.map(e=>{
    const a = nodes.find(n=>n.id===e.from), b = nodes.find(n=>n.id===e.to);
    if(!a || !b) return null; 
    const p1 = anchorRight(a), p2 = anchorLeft(b);
    const isSel = selectedEdgeIds.includes(e.id);
    const stroke = isSel ? "#1677ff" : "#868e96";
    const d = straightOrCurvePath(p1, p2);
    return (
      <g key={e.id}>
        <path d={d} stroke={stroke} strokeWidth="2" fill="none"
              onContextMenu={(evt)=>onEdgeContext(evt, e.id)} />
        <path d={d} stroke="transparent" strokeWidth="12" fill="none" style={{ pointerEvents: "stroke" }}
              onMouseDown={(evt)=>onEdgeDown(evt, e.id)}
              onContextMenu={(evt)=>onEdgeContext(evt, e.id)} />
      </g>
    );
  });

  const markersTop = (()=>{
    const els = [];
    for(const n of nodes){
      const outEdges = edges.filter(e=>e.from===n.id);
      if(outEdges.length){
        const anySel = outEdges.some(e=>selectedEdgeIds.includes(e.id));
        const p = anchorRight(n);
        els.push(
          <circle key={`out-${n.id}`} cx={p.x} cy={p.y} r={MARKER.R} fill="#fff" stroke={anySel ? "#1677ff" : "#868e96"} strokeWidth="2" />
        );
      }
      const inEdges = edges.filter(e=>e.to===n.id);
      if(inEdges.length){
        const anySel = inEdges.some(e=>selectedEdgeIds.includes(e.id));
        const p = anchorLeft(n);
        const w = MARKER.ARROW_W, h = MARKER.ARROW_H;
        const pts = `${p.x},${p.y-h/2} ${p.x+w},${p.y} ${p.x},${p.y+h/2}`;
        els.push(
          <polygon key={`in-${n.id}`} points={pts} fill={anySel ? "#1677ff" : "#868e96"} />
        );
      }
    }
    return els;
  })();

  const contentTransform = `translate(${pan.x}, ${pan.y}) scale(${zoom})`;

  const preview = (()=>{
    if(!connecting) return null;
    const p1 = { x: connecting.x1, y: connecting.y1 };
    const p2 = { x: connecting.x2, y: connecting.y2 };
    const dy = Math.abs(p2.y - p1.y);
    let d;
    if(dy <= GRID){
      d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }else{
      const dx = Math.max(40, Math.min(120, Math.abs(p2.x - p1.x) / 2));
      const c1x = p1.x + dx, c1y = p1.y;
      const c2x = p2.x - dx, c2y = p2.y;
      d = `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return (
      <g>
        <path d={d} stroke="#1677ff" strokeWidth="2" fill="none" strokeDasharray="5 4" />
        <circle cx={p1.x} cy={p1.y} r={MARKER.R} fill="#fff" stroke="#1677ff" strokeWidth="2" />
        {(() => {
          const w = MARKER.ARROW_W, h = MARKER.ARROW_H;
          const pts = `${p2.x},${p2.y-h/2} ${p2.x+w},${p2.y} ${p2.x},${p2.y+h/2}`;
          return <polygon points={pts} fill="#1677ff" />;
        })()}
      </g>
    );
  })();

  const boxSelRect = (()=>{
    if(!boxSel) return null;
    const x = Math.min(boxSel.x1, boxSel.x2);
    const y = Math.min(boxSel.y1, boxSel.y2);
    const w = Math.abs(boxSel.x2 - boxSel.x1);
    const h = Math.abs(boxSel.y2 - boxSel.y1);
    return <rect x={x} y={y} width={w} height={h} fill="rgba(22, 119, 255, 0.08)" stroke="#1677ff" strokeDasharray="4 3" />;
  })();

  const renderContextMenu = ()=>{
    if(!ctx) return null;
    const style = { position:"absolute", top: ctx.y, left: ctx.x, background:"#fff", border:"1px solid #e5e5e5", borderRadius:8, boxShadow:"0 6px 24px rgba(0,0,0,0.08)", padding:6, zIndex:9999, minWidth:160, userSelect:"none" };
    const item = (label, onClick, danger=false, disabled=false)=> (
      <div onClick={(e)=>{ e.stopPropagation(); if(!disabled) onClick(); }} style={{ padding:"6px 10px", cursor: disabled ? "not-allowed" : "pointer", borderRadius:6, color: danger? "#cf1322": disabled ? "#aaa" :"#333" }}
           onMouseEnter={(e)=>{ if(!disabled) e.currentTarget.style.background="#f5f5f5"; }}
           onMouseLeave={(e)=> e.currentTarget.style.background="transparent"}>
        {label}
      </div>
    );
    return (
      <div ref={menuRef} style={style} onContextMenu={(e)=>e.preventDefault()}>
        {ctx.type==="node" && (
          <>
            {item("복사", copySelected)}
            {item("붙여넣기", pasteClipboard, false, !clip || !clip.nodes?.length)}
            <div style={{ height:1, background:"#eee", margin:"6px 0" }} />
            {item("연결 끊기", disconnectSelectedNodes)}
            {item("삭제", deleteSelected, true)}
          </>
        )}
        {ctx.type==="edge" && (
          <>
            {item("삭제", deleteSelected, true)}
          </>
        )}
        {ctx.type==="canvas" && (
          <>
            {item("붙여넣기", pasteClipboard, false, !clip || !clip.nodes?.length)}
            {item("선택 해제", ()=>{ setSelectedNodeIds([]); setSelectedEdgeIds([]); setCtx(null); })}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      style={{ width:"100%", height:"100%", border:"1px solid #e9edf2", borderRadius:10, userSelect:"none", position:"relative", outline:"none" }}
      onContextMenu={onCanvasContext}
    >
      {renderContextMenu()}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseDown={onSvgMouseDown}
        onMouseMove={onSvgMove}
        onMouseUp={onSvgMouseUp}
        onMouseLeave={onSvgMouseUp}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ width:"100%", height:"100%", userSelect:"none" }}
      >
        {gridDefs}
        <g transform={contentTransform}>
          <rect x={0} y={0} width={5000} height={5000} fill={showGrid ? `url(#${gridIdRef.current})` : "transparent"} />
          {/* Nodes first, then paths on TOP */}
          {nodes.map(renderNode)}
          {edgePathsTop}
          {markersTop}
          {preview}
          {boxSelRect}
        </g>
      </svg>
    </div>
  );
}

export default forwardRef(GFlowCanvas);
