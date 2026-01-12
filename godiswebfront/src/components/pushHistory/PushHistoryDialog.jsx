import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box
} from "@mui/material";
import { useSearchParams } from "react-router-dom";
import PushHistoryTable from "./PushHistoryTable";
import PushPagination from "./PushPagination";

export default function PushHistoryDialog({ open, onClose }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(p) && p > 0 ? p - 1 : 0;  
  }, [searchParams]);

  const initialSize = useMemo(() => {
    const s = parseInt(searchParams.get("size") ?? "10", 10);
    return Number.isFinite(s) && s > 0 ? s : 10;
  }, [searchParams]);

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page + 1)); // URL은 1-based
    next.set("size", String(pageSize));
    setSearchParams(next, { replace: true });
  }, [page, pageSize]);

  const normalizeRows = (list = []) =>
    list.map((it, idx) => ({
      id: it.PUSH_ID ?? idx,
      sender: it.USER_ID ?? "시스템",
      msg: it.PUSH_MSG_CONTN ?? "",
      time: it.PUSH_SEND_DTTM ?? "",
      _rawType: it.PUSH_TP_CD,
    }));

    const fetchPushList = async () => {
    const res = await fetch(
      `/api/push/notifications?page=${page + 1}&size=${pageSize}`,
      { method: "GET", headers: { Accept: "application/json" }, credentials: "include" }
    );

    if (!res.ok) {
      console.error("조회 실패:", res.status);
      setData([]);
      setTotalCount(0);
      return;
    }
    const json = await res.json();
    setData(Array.isArray(json.notifications) ? normalizeRows(json.notifications) : []);

    setPageSize(Number(json.size) || pageSize);
    setTotalCount(
      Number.isFinite(Number(json.totalPushCount))
        ? Number(json.totalPushCount)
        : Number(json.totalCount) || 0
    );
  };

  useEffect(() => {
    if (open) fetchPushList();
  }, [open, page, pageSize]);

   useEffect(() => {
    if (!open) return;
    setPage(initialPage);
    setPageSize(initialSize);
  }, [open]);

  // 총 페이지 바뀔 때 현재 페이지 범위 보정 (예: totalCount 감소 등)
  useEffect(() => {
    const pages = Math.max(1, Math.ceil((totalCount || 0) / (pageSize || 10)));
    if (page + 1 > pages) setPage(pages - 1);
  }, [totalCount, pageSize]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>
    <Typography variant="h6" component="div">PUSH 내역 조회</Typography>
  </DialogTitle>

  <DialogContent
    sx={{
      overflow: "hidden",     // 스크롤은 Table 영역에서만
      pt: 2,
      display: "flex",
      flexDirection: "column",
      minHeight: "500px",     // 모달 크기 유지
    }}
  >
    {/* 테이블 영역 */}
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",    // 스크롤은 오직 테이블만!
        minHeight: 0,
      }}
    >
      <PushHistoryTable rows={data} />
    </Box>

    {/* 페이지네이션 영역 (항상 아래 고정) */}
    <Box
      sx={{
        mt: 1,
        pt: 1,
      }}
    >
      <PushPagination
        page={page}
        totalCount={totalCount}
        pageSize={pageSize}
        onChange={(p) => setPage(p)}
      />
    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose} variant="contained">close</Button>
  </DialogActions>
</Dialog>

  );
}
