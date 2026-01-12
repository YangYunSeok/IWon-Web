// GPCLOPRMT01S1.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Paper,
  Stack,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from "@mui/x-data-grid";
import { message } from "antd";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import GDataTreeGrid from "@/components/GDataTreeGrid.jsx";
import { http } from "@/libs/TaskHttp";

export default function GPCLOPRMT01S1() {
  // ==============================================================  
  //                        상태 변수 정의  
  // ==============================================================  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [status, setStatus] = useState("");
  const [executor, setExecutor] = useState("");
  const [groupName, setGroupName] = useState("");
  const [execType, setExecType] = useState("");
  const [resultMessage, setResultMessage] = useState("조회 결과가 없습니다.");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGrpId, setSelectedGrpId] = useState(null);

  // ✅ 사용자 검색 관련 상태
  const [openUserModal, setOpenUserModal] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  // ==============================================================  
  //                        컬럼 정의  
  // ==============================================================  
  const columns = [
    { field: "TASK_GRP_NM", headerName: "작업명", width: 300 },
    { field: "TASK_ID", headerName: "작업ID", width: 150 },
    { field: "TASK_SEQ", headerName: "순서", width: 100 },
    { field: "REG_NM", headerName: "실행요청자", width: 150 },
    { field: "EXECUTE_PARM_VAL", headerName: "Argument", width: 250 },
    { field: "EXECUTE_STAT_NM", headerName: "상태", width: 120 },
    { field: "FOLLW_TASK_CNT", headerName: "하위성공", width: 120 },
    { field: "TASK_CNT", headerName: "작업성공", width: 120 },
    { field: "TOTAL_CNT", headerName: "데이터성공", width: 120 },
    { field: "STRT_DDTM", headerName: "작업시작일시", width: 180 },
    { field: "END_DDTM", headerName: "작업종료일시", width: 180 },
    { field: "EXEC_MI", headerName: "소요시간", width: 100 },

    /** 임시추가컬럼 (숨김 처리) **/
    { field: "SEQ_KEY", headerName: "", width: 100, hide: true },
    { field: "GRP_SEQ", headerName: "", width: 100, hide: true },
    { field: "EXECUTE_GRP_SEQ", headerName: "", width: 100, hide: true },
    { field: "EXECUTE_TASK_SEQ", headerName: "", width: 100, hide: true },
    { field: "EXECUTE_TP_CD", headerName: "", width: 100, hide: true },
    { field: "EXECUTE_STAT_CD", headerName: "", width: 100, hide: true },
    { field: "DATA_FAIL_CNT", headerName: "", width: 100, hide: true },
    { field: "DATA_FAIL_YN", headerName: "", width: 100, hide: true },
    { field: "FOLLW_TASK_IDS", headerName: "", width: 100, hide: true },
    { field: "PARENT_TASK_IDS", headerName: "", width: 100, hide: true },
    { field: "TOT_CNT", headerName: "", width: 100, hide: true },
  ];

  const columnGroupingModel = [
    {
      groupId: "작업정보",
      children: [
        { field: "TASK_ID" },
        { field: "TASK_SEQ" },
        { field: "REG_NM" },
        { field: "EXECUTE_PARM_VAL" },
      ],
    },
    {
      groupId: "작업결과",
      children: [
        { field: "EXECUTE_STAT_NM" },
        { field: "FOLLW_TASK_CNT" },
        { field: "TASK_CNT" },
        { field: "TOTAL_CNT" },
      ],
    },
    {
      groupId: "작업",
      children: [
        { field: "STRT_DDTM" },
        { field: "END_DDTM" },
        { field: "EXEC_MI" },
      ],
    },
  ];

  // ==============================================================  
  //                        데이터 조회 함수  
  // ==============================================================  
  const getBatchGroups = async () => {
    try {
      setLoadingGroups(true);

      const param = {
        SEARCH_DD: "20240321",
        // EXECUTE_STAT_CD: "status",
        EXECUTE_STAT_CD: "08",
        SEARCH_GRP_NM: groupName,
        SEARCH_ID: executor,
        AUTO_FLAG: "N",
        EXECUTE_TP_CD: execType,
        SEARCH_EXEC_SEQ: 0,
        SEARCH_TOTAL: "N",
        OFFSET: 0,
      };

      const { name, table } = await http.post("/admin/getbatchgroups", param, { shape: "datatable" });
      const treeData = buildTree(table);
      setGroups(treeData);

      // ✅ 여기 추가
      if (table && table.length > 0) {
        setResultMessage(`${table.length}건이 조회되었습니다.`);
        message.info(`${table.length}건이 조회되었습니다.`); // antd 토스트 메시지
        setSelectedGrpId(table[0]);
      } else {
        setResultMessage("조회 결과가 없습니다.");
        message.warning("조회 결과가 없습니다.");
      }

    } catch (e) {
      console.error("[배치모니터링] 그룹 조회 실패", e);
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    getBatchGroups();
  }, []);

  // ==============================================================  
  //                        초기화 함수  
  // ==============================================================  
  const handleReset = () => {
    setStartDate(null);
    setStatus("");
    setExecutor("");
    setGroupName("");
    setExecType("");
    setRows([]);
    setResultMessage("조회 결과가 없습니다.");
  };

  // ==============================================================  
  //                  DEPTH 기반 트리 구조 변환 함수  
  // ==============================================================  
  const buildTree = (flatRows) => {
    const tree = [];
    const stack = [];

    flatRows.forEach((node) => {
      const currentDepth = node.DEPTH || 0;

      while (stack.length > 0 && stack[stack.length - 1].DEPTH >= currentDepth) {
        stack.pop();
      }

      if (stack.length === 0) {
        tree.push(node);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }

      stack.push(node);
    });

    return tree;
  };

  // ==============================================================  
  //                     사용자 검색 관련 함수  
  // ==============================================================  
  const handleSearchClick = () => {
    if (!executor.trim()) return;
    setUserList([]); // 아직 API 연결 전이라 빈 배열
    setUserSearch(executor); // ✅ 모달에 전달할 검색어 세팅
    setOpenUserModal(true);
  };

  const handleUserSelect = () => {
    if (selectedUser) {
      setExecutor(selectedUser.USR_NM);
    }
    setOpenUserModal(false);
  };

  // ==============================================================  
  //                          화면 구성  
  // ==============================================================  
  return (
    <Box p={2}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        배치작업모니터링
      </Typography>

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* 실행일자 */}
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="실행일자"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* 처리상태 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>처리상태</InputLabel>
              <Select value={status} label="처리상태" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 실행요청자 */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="실행요청자"
              fullWidth
              size="small"
              value={executor}
              onChange={(e) => setExecutor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearchClick}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* 작업그룹명 */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="작업그룹명"
              fullWidth
              size="small"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </Grid>

          {/* 실행유형 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>실행유형</InputLabel>
              <Select value={execType} label="실행유형" onChange={(e) => setExecType(e.target.value)}>
                <MenuItem value="">전체</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 버튼 */}
          <Grid
            item
            xs={12}
            sm={12}
            md={6}
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={getBatchGroups}
              sx={{ minWidth: 100, height: 40 }}
            >
              조회
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleReset}
              sx={{ minWidth: 100, height: 40 }}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Stack height={300}>
        <GDataTreeGrid
          title="배치실행결과"
          rows={groups}
          columns={columns}
          columnGroupingModel={columnGroupingModel}
          getRowId={(row) => row.SEQ_KEY}
          Buttons={[true, true, true, true]}
          columnHeaderHeight={30}
          rowHeight={25}
          height={480}
          pagination={false}
          hideFooter
          disableRowSelectionOnClick
          loading={loading}
        />
      </Stack>

      <Box mt={2} textAlign="right">
        <Typography variant="body2" color="text.secondary">
          {resultMessage}
        </Typography>
      </Box>

      {/* 사용자 목록 모달 */}
      <Dialog open={openUserModal} onClose={() => setOpenUserModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>사용자목록</DialogTitle>
        <DialogContent>
          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            size="small"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            sx={{ mb: 2 }}
          />
          <div style={{ height: 300 }}>
            <DataGrid
              rows={userList}
              columns={[
                { field: "USR_ID", headerName: "USR_ID", flex: 1 },
                { field: "USR_NM", headerName: "USR_NM", flex: 1 },
              ]}
              hideFooter
              onRowClick={(params) => setSelectedUser(params.row)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUserSelect}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
