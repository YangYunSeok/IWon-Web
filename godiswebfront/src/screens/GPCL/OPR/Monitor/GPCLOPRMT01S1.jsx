// GPCLOPRMT01S1.jsx
import React, { useEffect, useState, useMemo } from 'react';
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
import { cacheCode } from '@/libs/DataUtils';

import GDataTreeGrid from "@/components/GDataTreeGrid.jsx";
import GDataGrid from "@/components/GDataGrid.jsx";
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GButton from '@/components/GButton';
import { http } from "@/libs/TaskHttp";
import GTitleIcon from "@/components/GTitleIcon.jsx";
import GDatePicker from '@/components/GDatePicker.jsx';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import GPopup from '@/components/GPopup.jsx';
import Draggable from 'react-draggable';

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

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
  const [userName, setUserName] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGrpId, setSelectedGrpId] = useState(null);

  // ✅ 사용자 검색 관련 상태
  const [openUserModal, setOpenUserModal] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  // const [data, setData] = useState([]);

  // ✅ 상세 모달 관련 상태
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [resultInfo, setResultInfo] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [exceptionText, setExceptionText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [lstGrpTpCd, setLstGrpTpCd] = useState([]);
  const [grpTpCd, setGrpTpCd] = useState('');
  const [lstExecStatCd, setLstExecStatCd] = useState([]);
  const [lstExecTpCd, setLstExecTpCd] = useState([]);

  // ==================== 체크박스 상태 변수 ====================
  const [fullColumnChecked, setFullColumnChecked] = useState(true);
  const [expandedItems, setExpandedItems] = useState([]);
  const [expandedChecked, setExpandedChecked] = useState(true);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState(null);
  const [resultInfoRows, setResultInfoRows] = useState([]); // 작업결과를 Grid로 표시하기 위한 데이터
  const [exceptionRows, setExceptionRows] = useState([]);

  const getRowId = (row) => row.SEQ_KEY;

  // ✅ allItemIds 계산 (기존 유지)
  const allItemIds = useMemo(() => {
    const collectIds = (nodes) => {
      let ids = [];
      nodes.forEach((node) => {
        ids.push(node.SEQ_KEY);
        if (node.children?.length) {
          ids = ids.concat(collectIds(node.children));
        }
      });
      return ids;
    };
    return collectIds(groups);
  }, [groups]);

  // ✅ 단일 useEffect: groups 변경 OR expandedChecked 변경 시 처리
  useEffect(() => {
    if (allItemIds.length === 0) return;

    if (expandedChecked) {
      setExpandedItems(allItemIds);  // 펼침
    } else {
      setExpandedItems([]);          // 접기
    }
  }, [allItemIds, expandedChecked]);  // 둘 다 감지

  // 디버그용 (선택사항)
  useEffect(() => {
    console.log('[DEBUG] groups.length =', groups.length);
    console.log('[DEBUG] allItemIds =', allItemIds);
    console.log('[DEBUG] expandedChecked =', expandedChecked);
    console.log('[DEBUG] expandedItems =', expandedItems);
  }, [groups, allItemIds, expandedChecked, expandedItems]);

  const expandAll = () => {
    setExpandedItems(allItemIds);   // 모든 노드 펼치기
  };

  const collapseAll = () => {
    setExpandedItems([]);          // 전체 접기
  };

  const handleChange = (key) => (e) => {
    setOptions((prev) => ({
      ...prev,
      [key]: e.target.checked,
    }));
  };

  // ==============================================================  
  //                        컬럼 정의  
  // ==============================================================  
  const columns = [
    { field: "TASK_GRP_NM", headerName: "작업명", width: 320 },
    { field: "TASK_ID", headerName: "작업ID", width: 200 },
    { field: "TASK_SEQ", headerName: "순서", width: 100 },
    { field: "REG_NM", headerName: "실행요청자", width: 150 },
    {
      field: "EXECUTE_PARM_VAL", headerName: "Argument",
      width: 350,
      renderCell: (params) => (
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%'
        }}>
          {params.value}
        </div>
      )
    },
    { field: "EXECUTE_STAT_NM", headerName: "상태", width: 120 },
    { field: "FOLLW_TASK_CNT", headerName: "하위성공", width: 120 },
    { field: "TASK_CNT", headerName: "작업성공", width: 120 },
    { field: "TOTAL_CNT", headerName: "데이터성공", width: 120 },
    { field: "STRT_DDTM", headerName: "작업시작일시", width: 180 },
    { field: "END_DDTM", headerName: "작업종료일시", width: 180 },
    { field: "EXEC_MI", headerName: "소요시간", width: 100 },
    {
      field: "ETC",
      headerName: "",
      width: 170,
      renderCell: (params) => {
        const { EXECUTE_TP_CD, EXECUTE_STAT_CD } = params.row;

        // 00 + 08 → Detail 버튼 (활성)
        if (EXECUTE_TP_CD === "00" && EXECUTE_STAT_CD === "08") {
          return (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleDetailClick(params.row)}
              sx={{ width: 90 }}
            >
              Detail
            </Button>
          );
        }

        // 00 + 01 → 숨김
        if (EXECUTE_TP_CD === "00" && EXECUTE_STAT_CD === "01") {
          return null;
        }

        // 01~04 + 08/09/07 → ForceEnd (비활성)
        if (
          ["01", "02", "03", "04"].includes(EXECUTE_TP_CD) &&
          ["08", "09", "07"].includes(EXECUTE_STAT_CD)
        ) {
          return (
            <Button
              variant="outlined"
              size="small"
              disabled
              sx={{ width: 90 }}
            >
              ForceEnd
            </Button>
          );
        }

        // 10 → 숨김
        if (EXECUTE_TP_CD === "10") {
          return null;
        }

        return null;
      },
    },

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
        { field: "ETC" },

      ],
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState(columns);

  const handleFullColumnChange = (e) => {
    const checked = e.target.checked;
    setFullColumnChecked(checked);

    if (checked) {
      // 전체 컬럼 보여주기
      setVisibleColumns(columns);
    } else {
      // 특정 컬럼 제외해서 보여주기
      const filtered = columns.filter(
        col => !["TASK_SEQ", "REG_NM", "END_DDTM", "ETC"].includes(col.field) // 🔥 숨기고 싶은 컬럼들
      );
      setVisibleColumns(filtered);
    }
  };

  const [options, setOptions] = useState({
    columns: false,
    allSearch: false,
    expand: false,
    autoSearch: false,
  });

  // ========== 작업결과 컬럼 정의 추가 ==========
  const resultInfoColumns = [
    {
      field: "VALUE",
      headerName: "",
      flex: 1,
      renderCell: (params) => (
        <div
          style={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: "1.4",
          }}
        >
          {params.value}
        </div>
      ),
    },
  ];

  const exceptionColumns = [
    { field: "CONTENT", headerName: "", width: 800, flex: 1 },
  ];

  // ==============================================================  
  //                        서버 통신 
  // ==============================================================  
  const InitializeControl = async () => {
    // 공통코드 로딩 순서 보장
    try {
      // 처리상태
      const { table: clss } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'EXECUTE_STAT_CD' },
        { shape: 'datatable' }
      );
      setCodesMsgClssCd(Array.isArray(clss) ? clss : []);

      // 실행유형
      const { table: tp } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'EXECUTE_TP_CD' },
        { shape: 'datatable' }
      );
      setCodesTrMsgTpCd(Array.isArray(tp) ? tp : []);

      // 검색 콤보 기본값 세팅(없으면 첫 값)
      setMsgClssCd(prev => prev || clss?.[0]?.CD_VAL || '');
    } catch (e) {
      console.error('[공통코드] 조회 실패', e);
      GMessageBox.Show('MGW00001');
    }
  };

  // ==============================================================  
  //                        데이터 조회 함수  
  // ==============================================================  

  const getBatchGroups = async () => {
    try {
      setLoadingGroups(true);

      const param = buildBatchGroupParam();
      console.log("[DEBUG] batch group param =", param);

      const { name, table } = await http.post(
        "/admin/getbatchgroups",
        param,
        { shape: "datatable", showSpinner: true }
      );

      const treeData = buildTree(table);
      setGroups(treeData);  // ✅ useEffect가 자동 처리

    } catch (e) {
      console.error("[배치모니터링] 그룹 조회 실패", e);
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingGroups(false);
    }
  };

  const buildBatchGroupParam = () => ({
    // 조회일자
    SEARCH_DD: startDate ? dayjs(startDate).format("YYYYMMDD") : "",
    // SEARCH_DD: "20240321",
    // 처리상태 (⭐ 값 있을 때만 넘긴다)
    ...(grpTpCd && { EXECUTE_STAT_CD: grpTpCd }),

    // 실행요청자
    SEARCH_ID: executor || "",

    // 작업그룹명
    SEARCH_GRP_NM: groupName?.trim() || "",

    // 실행유형
    EXECUTE_TP_CD: execType || "",

    // 옵션
    AUTO_FLAG: options.autoSearch ? "Y" : "N",
    SEARCH_TOTAL: options.allSearch ? "Y" : "N",

    // 고정값 / 확장용
    SEARCH_EXEC_SEQ: 0,
    OFFSET: 0,
  });

  const getSelectedUser = async () => {

    try {
      setLoading(true);

      const param = {
        // USR_NM: userName
        USR_NM: userSearch
      };

      const { name, table } = await http.post(
        "/admin/getusergrouppopup",
        param,
        { shape: "datatable", showSpinner: true }
      );

      // setData(table);
      setUserList(table || []);

      if (table && table.length > 0) {
        setSelectedGrpId(table[0]);
      }
    } catch (e) {
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    getBatchGroups();
  }, []);

  useEffect(() => {
    if (openUserModal) {
      getSelectedUser();   // 팝업 열리자마자 서버에서 유저 목록 가져오기 
    }
  }, [openUserModal]);

  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["EXECUTE_STAT_CD", "EXECUTE_TP_CD"];
      const result = await cacheCode(params);
      setLstExecStatCd(result.EXECUTE_STAT_CD || []);
      setLstExecTpCd(result.EXECUTE_TP_CD || []);
    })();
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
    setResultMessage("");
    setUserName("");
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
  const handleSearchClick = (searchValue) => {
    const q = typeof searchValue === "string" ? searchValue : executor || "";
    // setOpenDetailModal(false);  // 혹시 충돌 우려 시 주석 해제
    setUserList([]);
    setUserSearch(q);
    setOpenUserModal(true);
    getBatchGroups();
  };

  const handleUserSelect = () => {
    if (selectedUser) {
      setExecutor(selectedUser.USR_NM);
    }
    setExecutor(selectedUser.USR_NM); // 실행요청자 TextField 값
    setOpenUserModal(false);
  };

  // ==============================================================  
  //                     팝업 관련 함수  
  // ==============================================================  

  const handleDetailClick = async (row) => {
    setSelectedRow(row);
    setOpenDetailModal(true);

    try {
      setLoading(true);
      const param = { EXECUTE_TASK_SEQ: row.EXECUTE_TASK_SEQ };

      const result = await http.post("/admin/getexcpdtllog", param);

      console.log("Detail Param =>", row.EXECUTE_TASK_SEQ);

      // ✅ 작업결과를 Grid 형태로 변환
      const resultData = result.dtExcptDtlLog || {};
      const resultRows = Object.entries(resultData).map(([key, value], index) => ({
        id: index,
        KEY: key,
        VALUE: typeof value === 'object' ? JSON.stringify(value) : String(value || '')
      }));

      setResultInfo(resultData);
      setResultInfoRows(resultRows);

      // ✅ 작업상세로그
      setDetailLogs(result.dtExcptDtlLogList || []);

      // ✅ 상세 Exception을 Grid 형태로 변환
      const exceptionContent = result.dtExcptDtlLog?.EXECUTE_RSLT_CONTN || "예외 내용이 없습니다.";
      const exceptionRows = exceptionContent.split('\n').map((line, index) => ({
        id: index,
        CONTENT: line
      }));

      setExceptionText(exceptionContent);
      setExceptionRows(exceptionRows);

    } catch (e) {
      console.error("상세 조회 실패", e);
      message.error("상세 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setSelectedRow(null);
    setResultInfo(null);
    setResultInfoRows([]);
    setDetailLogs([]);
    setExceptionText("");
    setExceptionRows([]);
  };

  const applySelectedUser = (user) => {
    if (!user) {
      message.warning("사용자를 선택하세요.");
      return;
    }

    setExecutor(user.USR_NM);
    setOpenUserModal(false);
  };

  const handleAutoSearchChange = (e) => {
    const checked = e.target.checked;

    setOptions((prev) => ({ ...prev, autoSearch: checked }));

    if (checked) {
      // 확인 메시지
      if (!window.confirm("입력된 조건으로 현재 시간 이후 배치실행내역을 조회합니다.\n자동조회 하시겠습니까?")) {
        setOptions((prev) => ({ ...prev, autoSearch: false }));
        return;
      }

      // 초기 조회
      getBatchGroups();

      // 5초마다 자동 조회
      const timer = setInterval(() => {
        getBatchGroups();
      }, 5000);

      setAutoRefreshTimer(timer);
      message.success("자동조회가 시작되었습니다. (5초 간격)");
    } else {
      // 타이머 해제
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        setAutoRefreshTimer(null);
        message.info("자동조회가 중지되었습니다.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }
    };
  }, [autoRefreshTimer]);

  console.log("allItemIds = ", allItemIds);
  console.log("expandedChecked = ", expandedChecked);
  console.log("rows = ", rows);


  // ==============================================================  
  //                          화면 구성  
  // ==============================================================  

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div style={{
        padding: '8px',
        height: 'calc(100vh - 120px)',   // ← 헤더/탑바 높이에 맞게 조절
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          {/* 헤더 영역 */}
          <Stack spacing={2} >
            <Box fontSize="16px" fontWeight="600" color="#333" display="flex" alignItems="center" gap={0.5}>
              <GTitleIcon />
              배치모니터링
            </Box>
            <GSearchHeader
              fields={[
                {
                  header: "실행일자",
                  name: "startDate",
                  content: (
                    <GDatePicker
                      value={startDate}                         // 그대로 사용 가능
                      onChange={(v) => setStartDate(dayjs(v))}  // dayjs 변환 동일하게
                      format="YYYY-MM-DD"
                      showCalendarIcon={true}
                      allowClear={false}
                    />
                  )
                },
                {
                  header: '처리상태',
                  content: (
                    <GSelectBox
                      items={lstExecStatCd}
                      valueKey="CD_VAL"
                      labelKey="CD_VAL_NM"
                      toplabel="A"
                      value={grpTpCd}
                      onChange={(v) => setGrpTpCd(v)}
                    />
                  ),
                },
                {
                  header: '실행요청자',
                  content: (
                    <TextField
                      size="small"
                      value={executor}
                      onChange={(e) => setExecutor(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearchClick(e.target.value); }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => handleSearchClick(executor)}>
                              <SearchIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  ),
                },
                {
                  header: '작업그룹명',
                  content: (
                    <TextField
                      fullWidth
                      name="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') getBatchGroups(); }}
                      placeholder="작업그룹명 입력"
                    />
                  ),
                },
                {
                  header: '실행유형',
                  content: (
                    <GSelectBox
                      items={lstExecTpCd}
                      valueKey="CD_VAL"
                      labelKey="CD_VAL_NM"
                      toplabel="A"
                      value={execType}
                      onChange={(v) => setExecType(v)}
                    />
                  ),
                }, {}, {}, {}
              ]}
              buttons={[
                <GButton key="search" auth="Search" label="Search" onClick={getBatchGroups} sx={{ ml: 2 }} />,
              ]}
              sx={{ flexWrap: "nowrap", overflowX: "auto" }}  // ← 이 부분 추가
            />
          </Stack>

          {/* 체크박스 이벤트 */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box fontSize="16px" fontWeight="600" color="#333" display="flex" alignItems="center" gap={0.5}>
              <GTitleIcon />
              배치실행결과
            </Box>

            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
              {/* 전체컬럼 */}
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={fullColumnChecked}
                    onChange={handleFullColumnChange}
                  />
                }
                label="전체컬럼"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={options.allSearch}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, allSearch: e.target.checked }))
                    }
                  />
                }
                label="전체조회"
              />
              {/* 확장여부 */}
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={expandedChecked}
                    onChange={(e) => setExpandedChecked(e.target.checked)}
                  />
                }
                label="확장여부"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={options.autoSearch}
                    onChange={handleAutoSearchChange}
                  />
                }
                label="자동조회"
              />
            </Box>
          </Box>
          {/* 그리드 영역 */}
          <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
            <GDataTreeGrid
              // title="배치실행결과"
              rows={groups}
              columns={visibleColumns}
              columnGroupingModel={columnGroupingModel}
              getRowId={(row) => row.SEQ_KEY}
              Buttons={[false, false, false, true]}
              columnHeaderHeight={30}
              rowHeight={25}
              // height="100%"   
              pagination={false}
              hideFooter
              disableRowSelectionOnClick
              loading={false}
              columnResizeMode="onColumnResize"
              expandedItems={expandedItems}
              onExpandedItemsChange={(ids) => setExpandedItems(ids)}
              initiallyExpandAll={expandedChecked}
              key={`tree-${expandedChecked}-${groups.length}`}  // ✅ 강제 리마운트
            //key={expandedChecked ? "expanded" : "collapsed"}
            />
          </Box>
          <Box mt={2} textAlign="right">
            <Typography variant="body2" color="text.secondary">
              {resultMessage}
            </Typography>
          </Box>

          {/************************************************** Detail Popup Open *************************************************/}

          <Dialog open={openDetailModal} onClose={handleCloseDetailModal}
            maxWidth="lg" fullWidth
            PaperComponent={PaperComponent}
            aria-labelledby="draggable-dialog-title"
          >

            <DialogTitle
              id="draggable-dialog-title"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0',
                padding: '12px 16px',
                cursor: 'move'
              }}
            >
              <Box sx={{ fontSize: '18px', fontWeight: 1000 }}>배치실행결과</Box>
            </DialogTitle>

            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <GDataGrid
                    title="작업결과"
                    showTitle={true}
                    rows={resultInfoRows}
                    columns={resultInfoColumns}
                    height={200}
                    Buttons={{ add: false, delete: false, revert: false, excel: false }}
                    columnHeaderHeight={0}
                    rowHeight={250}
                    hideFooter
                    disableRowSelectionOnClick
                  />
                </Box>

                <GDataGrid
                  title="작업상세로그"
                  rowHeight={25}
                  columnHeaderHeight={30}
                  Buttons={[false, false, false, false]}
                  rows={detailLogs}
                  columns={[
                    { field: "EXE_TASK_DD", headerName: "실행일자", width: 120 },
                    { field: "EXE_TASK_TM", headerName: "실행시간", width: 120 },
                    { field: "BAS_DD", headerName: "기준일자", width: 120 },
                    { field: "PRG_ID", headerName: "프로그램ID", width: 120 },
                    { field: "PK_VAL1", headerName: "PK1", width: 120 },
                    { field: "PK_VAL2", headerName: "PK2", width: 120 },
                    { field: "PK_VAL3", headerName: "PK3", width: 120 },
                    { field: "PK_VAL4", headerName: "PK4", width: 120 },
                    { field: "PK_VAL5", headerName: "PK5", width: 120 },
                    { field: "ERR_NUMBER", headerName: "ERROR번호", width: 120 },
                    { field: "ERR_PROCEDURE", headerName: "ERROR프로시져", width: 120 },
                    { field: "ERR_LINE", headerName: "ERROR라인", width: 120 },
                    { field: "ERR_MESSAGE", headerName: "ERROR메세지", width: 120 },
                    // 숨김컬럼
                    { field: "LOG_SEQ", headerName: "", width: 120, hide: true },
                    { field: "EXE_TASK_SEQ", headerName: "", width: 120, hide: true },
                    { field: "REG_ID", headerName: "", width: 120, hide: true },
                    { field: "ERR_SEVERITY", headerName: "", width: 120, hide: true },
                    { field: "ERR_STATE", headerName: "", width: 120, hide: true },
                  ]}
                  hideFooter
                />

                {/* 상세 Exception */}

                <Box>
                  <GDataGrid
                    title="상세 Exception"
                    showTitle={true}
                    rows={exceptionRows}
                    columns={exceptionColumns}
                    height={200}
                    Buttons={{ add: false, delete: false, revert: false, excel: false }}
                    columnHeaderHeight={0}
                    rowHeight={25}
                    hideFooter
                    disableRowSelectionOnClick
                  />
                </Box>
              </Stack>
              <DialogActions>
                <Button onClick={handleCloseDetailModal} variant="outlined">
                  닫기
                </Button>
              </DialogActions>
            </DialogContent>
          </Dialog>

          {/************************************************** Detail Popup Closed *************************************************/}

          {/* ✅ 사용자 검색 모달 */}
          <Dialog
            open={openUserModal}
            onClose={() => setOpenUserModal(false)}
            maxWidth="sm"
            fullWidth
          >
            <Box fontSize="16px" fontWeight="600" color="#333" display="flex" alignItems="center" gap={0.5}>
              <GTitleIcon />
              사용자목록
            </Box>
            <DialogContent>
              <Box sx={{ backgroundColor: "#e8f3ff", p: 2, borderRadius: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && getSelectedUser(e.target.value)}
                />
              </Box>

              <Box sx={{ mb: 1, textAlign: "right" }}>
                <Typography variant="body2" color="text.secondary">
                  Total ({userList?.length || 0})
                </Typography>
              </Box>
              <div style={{ height: 320 }}>
                <GDataGrid
                  rows={userList}
                  getRowId={(row) => row.USR_ID}
                  columnHeaderHeight={30}
                  rowHeight={25}
                  loading={false}
                  Buttons={[false, false, false, false]}
                  onRowClick={(params) => {
                    setSelectedUser(params.row);   // 선택한 행 저장
                  }}
                  onRowSelectionModelChange={(ids) => {

                    if (!ids || ids.length === 0) return; // 🔥 핵심

                    const id = ids[0];
                    setSelectedUserId(id);

                    const row = userList.find((r) => r.USR_ID === id);
                    setSelectedUser(row);    // 기존 로직과 연동
                  }}
                  onRowDoubleClick={(params) => {
                    applySelectedUser(params.row); // 더블클릭: 즉시 적용
                  }}
                  columns={[
                    { field: "USR_ID", headerName: "USR_ID", width: 250 },
                    { field: "USR_NM", headerName: "USR_NM", width: 250, flex: 1 },
                  ]}
                  hideFooter
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenUserModal(false)} variant="outlined">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </div>
    </LocalizationProvider>
  );
}
