// GPCLOPRLG02S1.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box, Grid, TextField, Button, MenuItem, Select, FormControl, InputLabel, Typography,
  Paper, Stack, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import GDataGrid from "@/components/GDataGrid"; // 공통 그리드
import { message } from "antd";
import { http } from "@/libs/TaskHttp";
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GButton from '@/components/GButton';
import GDateRangePicker from "@/components/GDateRangePicker";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid } from '@mui/x-data-grid';
import GTitleIcon from "@/components/GTitleIcon.jsx";
import dayjs from "dayjs";
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRLG02S1() {

  // ==============================================================  
  // 상태 변수 정의
  // ==============================================================  

  const [userId, setUserId] = useState("");
  const [menuName, setMenuName] = useState("");
  const [btnId, setBtnId] = useState(""); // 초기값 빈 문자열
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [btnOptions, setBtnOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [DtPush, setDtPush] = useState([]);
  const [resultMessage, setResultMessage] = useState("조회 결과가 없습니다.");
  const [selectedGrpId, setSelectedGrpId] = useState(null);
  const [groupName, setGroupName] = useState("");

  const today = dayjs().format("YYYY-MM-DD");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const pageSize = 1000;
  const currentPage = useRef(1);

  // 모달 관련 상태
  const [openUserModal, setOpenUserModal] = useState(false);
  const [userList, setUserList] = useState([]);        // 모달에 표시될 사용자 목록
  const [selectedUser, setSelectedUser] = useState(null); // 모달에서 선택한 사용자
  const [userSearch, setUserSearch] = useState("");    // 모달 안 검색어


  // 버튼 옵션 초기 로딩
  useEffect(() => {
    const fetchBtnOptions = async () => {
      try {
        const { table } = await http.post(
          "/admin/getactionid",
          {},
          { shape: "datatable" }
        );

        const options = (table || [])
          .filter(opt => opt.BUTN_ID)
          .map(opt => ({
            BUTN_ID: String(opt.BUTN_ID),
            BUTN_NM: opt.BUTN_ID
          }));

        setBtnOptions(options);
        setBtnId("");
      } catch (err) {
        console.error("버튼 옵션 로딩 실패", err);
        setBtnOptions(options);
        setBtnId("");
      }
    };

    fetchBtnOptions(); // 옵션 불러오기
    handleSearch();    // 기본 조회 실행
  }, []);
  
  // ✅ 팝업이 열리면 자동으로 사용자 목록 조회
  useEffect(() => {
    if (openUserModal) {
      getSelectedUser();
    }
  }, [openUserModal]);

  // ==============================================================  
  // 트랜잭션모니터링 조회
  // ==============================================================  
  const handleSearch = async (reset = true) => {
    try {
      setLoading(true);

      const offset = reset ? 0 : (currentPage.current - 1) * pageSize;

      const param = {
        CURR_PAGE: offset,    // ✅ 0부터 시작
        PAGE_CNT: pageSize,   // 50 또는 1000
        FROM_DD: fromDate.replace(/-/g, ""),
        TO_DD: toDate.replace(/-/g, ""),
        USR_ID: userId,
        TXT_MENU: menuName,
        BUTN_ID: btnId || undefined
      };

      console.log("📌 조회 파라미터:", param);

      const { name, table } = await http.post("/admin/gettransactionlog", param, { shape: "datatable", showSpinner: true });
      setDtPush(table);
      console.log(table);
    } catch (e) {
      console.error("[트랜잭션로그] 그룹 조회 실패", e);
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "REG_DDTM", headerName: "요청일시", width: 180, headerAlign: "center", align: "center" },
    { field: "USR_NM", headerName: "요청자", width: 100, headerAlign: "center", align: "left" },
    { field: "MENU_NM", headerName: "메뉴명", flex: 2, headerAlign: "center", align: "left" },
    { field: "BUTN_ID", headerName: "작업구분", flex: 1, headerAlign: "center", align: "left" },
    { field: "ACTION_ID", headerName: "버튼명", flex: 1, headerAlign: "center", align: "left" },
    { field: "ACTION_URL", headerName: "작업URL", flex: 2, headerAlign: "center", align: "left" },
    {
      field: "TRAN_SECOND",
      headerName: "작업소요시간",
      width: 120,
      align: "right",
      headerAlign: "center",
      renderCell: (params) => `${params.value || 0}초`,
    },
    { field: "TRAN_CONTN", headerName: "작업파라미터", flex: 2, headerAlign: "center", align: "left" },
    { field: "REQ_CONTN", headerName: "요청내용", flex: 2, headerAlign: "center", align: "left" }
  ];

  // multiline readOnly TextField (height 조절 가능)
  const DetailBox = ({ label, value, height = 120 }) => (
    <Box sx={{ marginBottom: '8px' }}>
      <Typography variant="subtitle2">{label}</Typography>
      <TextField
        value={value || ""}
        fullWidth
        multiline
        InputProps={{ readOnly: true }}
        variant="outlined"
        size="small"
        sx={{
          height: height,
          "& .MuiInputBase-input": {
            overflowY: "auto",
            height: "100%",
          },
        }}
      />
    </Box>
  );

  // ==============================================================
  // 요청자 목록 조회
  // ==============================================================
  const getSelectedUser = async () => {
    try {
      setLoading(true);

      const param = {
        USR_NM: userSearch  // 검색어를 파라미터로 전송
      };

      const { name, table } = await http.post(
        "/admin/getusergrouppopup",
        param,
        { shape: "datatable", showSpinner: true }
      );

      setUserList(table || []);

    } catch (e) {
      message.error("사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 더블클릭 또는 OK 버튼 시 사용
  const applySelectedUser = (user) => {
    if (!user) {
      message.warning("사용자를 선택하세요.");
      return;
    }
    setUserId(user.USR_NM);      // ✅ 요청자 필드에 반영
    setOpenUserModal(false);
  };
  // ==============================================================  
  // 화면 구성
  // ==============================================================  
  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: "요청일자",
              content: (
                <GDateRangePicker
                  value={[fromDate, toDate]}
                  onChange={(dates) => {
                    setFromDate(dates[0] || '');
                    setToDate(dates[1] || '');
                  }}
                />
              ),
            },
            {
              header: '요청자',
              content: (
                <GTextField
                  fullWidth
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setUserSearch(userId);  // 현재 입력값을 검색어로 설정
                      setOpenUserModal(true);
                    }
                  }}
                  placeholder="요청자 입력"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => {
                          setUserSearch(userId);  // 현재 입력값을 검색어로
                          setOpenUserModal(true);
                        }}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              ),
            },
            {
              header: '메뉴명',
              content: (
                <GTextField
                  fullWidth
                  name="text"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="메뉴명 입력"
                />
              ),
            },
            {
              header: '작업구분',
              content: (
                <GSelectBox
                  items={btnOptions}
                  valueKey="BUTN_ID"
                  labelKey="BUTN_NM"
                  toplabel="A"
                  value={btnId}
                  onChange={(v) => setBtnId(v)}
                />
              ),
            }
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />,
          ]}
        />
      </GSearchSection>

      {/* 그리드 영역 */}
      <GContentBox flex={true}>
        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <GDataGrid
            title="트랜잭션모니터링"
            rows={DtPush}
            Buttons={{ add: false, delete: false, revert: false, excel: true }}
            columns={columns}
            pagination={true}
            pageSizeOptions={[50, 100]}
            initialState={paginationInitialState}
            sx={paginationCenterSx}
            onRowClick={(params) => setSelectedRow(params.row)}
            getRowId={row => row.ID || `${row.REG_DDTM}-${row.USR_NM}-${row.MENU_NM}`}
            columnHeaderHeight={30}
            rowHeight={25}
            columnVisibilityModel={{ TRAN_CONTN: false, REQ_CONTN: false }}
            loading={loading}
          />
        </Box>
      </GContentBox>

      {/* 디테일 영역 */}
      <GContentBox flex={false} marginBottom={0}>
        <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
          <GLayoutItem label="작업파라미터" height={60}>
            <GTextField
              value={selectedRow?.TRAN_CONTN || "조회된 데이터가 없습니다."}
              readOnly={true}
              multiline
              minRows={1}
            />
          </GLayoutItem>
          <GLayoutItem label="요청내용" height={60}>
            <GTextField
              value={selectedRow?.REQ_CONTN || "조회된 데이터가 없습니다."}
              readOnly={true}
              multiline
              minRows={1}
            />
          </GLayoutItem>
        </GLayoutGroup>
      </GContentBox>

      <Dialog open={openUserModal} onClose={() => setOpenUserModal(false)} maxWidth="sm" fullWidth>
        <Box fontSize="16px" fontWeight="600" color="#333" display="flex" alignItems="center" gap={0.5}>
          <GTitleIcon />
          사용자목록
        </Box>
        <DialogContent>
          <Box sx={{ backgroundColor: "#e8f3ff", p: 2, borderRadius: 1, mb: 2 }}>
            <GTextField
              fullWidth
              size="small"
              label="Search"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && getSelectedUser()}
            />
          </Box>

          <div style={{ height: 300 }}>
            <GDataGrid
              rows={userList}
              getRowId={row => row.USR_ID}
              columnHeaderHeight={30}
              rowHeight={25}
              loading={false}
              Buttons={[false, false, false, false]}
              columns={[
                { field: "USR_ID", headerName: "USR_ID", width: 200 },
                { field: "USR_NM", headerName: "USR_NM", width: 200, flex: 1 },
              ]}
              onRowClick={params => setSelectedUser(params.row)}
              onRowDoubleClick={params => applySelectedUser(params.row)}
              hideFooter
              disableRowSelectionOnClick
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => applySelectedUser(selectedUser)}
          >
            OK
          </Button>
          <Button variant="outlined" onClick={() => setOpenUserModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </GPageContainer>
  );
}