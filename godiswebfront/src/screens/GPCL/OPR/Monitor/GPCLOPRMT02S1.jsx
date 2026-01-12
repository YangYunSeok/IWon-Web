// GPCLOPRMT02S1.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Paper,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import axios from "axios";
import { http } from "@/libs/TaskHttp";
import { message } from "antd";
import GDataGrid from "@/components/GDataGrid.jsx";
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GButton from '@/components/GButton';
import GSelectBox from '@/components/GSelectBox.jsx';
import GDateRangePicker from "@/components/GDateRangePicker";
import GTitleIcon from "@/components/GTitleIcon.jsx";
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GContentBox from '@/components/GContentBox';
import GButtonGroup from '@/components/GButtonGroup';
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

export default function GPCLOPRMT02S1() {
  // ==============================================================
  // 상태 변수 정의
  // ==============================================================
  const [cboConnStat, setCboConnStat] = useState("");
  const [cboUsrGrp, setCboUsrGrp] = useState("");
  const [rdoConn, setRdoConn] = useState("1"); // 1: 현황, 2: 내역
  const [userGroups, setUserGroups] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("조회 결과가 없습니다.");
  const [selectedGrpId, setSelectedGrpId] = useState(null);
  const [loginStatus, setLoginStatus] = useState("01"); // Login 기본
  const [columns, setColumns] = useState([]);
  const [gridColumns, setGridColumns] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /** 상세 팝업 관련 상태 */
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [detailFromDate, setDetailFromDate] = useState("");
  const [detailToDate, setDetailToDate] = useState("");

  const formatDate = (date) => date?.substring(0, 10);

  // ==============================================================
  // 사용자 그룹 조회
  // ==============================================================
  const getUserGroup = async () => {
    try {
      const { table } = await http.post(
        "/admin/getusergroupinfolist",
        {},
        { shape: "datatable", showSpinner: true }
      );

      console.log("📦 사용자그룹 목록:", table);
      setUserGroups(table || []);
    } catch (e) {
      console.error("❌ 사용자 그룹 조회 실패:", e);
      message.error("사용자 그룹을 불러오지 못했습니다.");
    }
  };

  // ==============================================================
  // 컬럼 정의
  // ==============================================================
  const updateColumns = (connType) => {
    if (connType === "1") {
      // 접속현황
      setGridColumns([
        { field: "PRSNT_LOGIN_YN", headerName: "접속상태", width: 100, headerAlign: "center", align: "center" },
        { field: "USR_ID", headerName: "사용자 ID", width: 150, headerAlign: "center", align: "left" },
        { field: "USR_NM", headerName: "사용자명", width: 150, headerAlign: "center", align: "left" },
        { field: "USR_GRP_NM", headerName: "사용자유형", width: 150, headerAlign: "center", align: "left" },
        { field: "CLIENT_IP", headerName: "접속 IP", width: 200, headerAlign: "center", align: "left" },
        { field: "CONN_DD", headerName: "최근접속일", width: 200, headerAlign: "center", align: "center" },
        { field: "CONN_STRT_TM", headerName: "접속시간", width: 100, headerAlign: "center", align: "center" },
        { field: "END_DD", headerName: "접속종료일", width: 180, headerAlign: "center", align: "center" },
        { field: "CONN_END_TM", headerName: "종료시간", width: 180, headerAlign: "center", align: "center" },
        {
          field: "history",
          headerName: "History",
          width: 200,
          headerAlign: "center",
          align: "center",
          renderCell: (params) => (
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                const row = params.row;
                setSelectedRow(row);
                setDetailFromDate(formatDate(row.CONN_DD));
                setDetailToDate(formatDate(row.END_DD));
                setOpenDetailModal(true);
              }}
            >
              History
            </Button>
          )
        }
      ]);
    } else {
      // 접속내역
      setGridColumns([
        { field: "PRSNT_LOGIN_YN", headerName: "접속상태", flex: 1, headerAlign: "center", align: "center" },
        { field: "USR_ID", headerName: "사용자 ID", flex: 1, headerAlign: "center", align: "left" },
        { field: "USR_NM", headerName: "사용자명", flex: 1, headerAlign: "center", align: "left" },
        { field: "USR_GRP_NM", headerName: "사용자유형", flex: 1, headerAlign: "center", align: "left" },
        { field: "CONN_DD", headerName: "날짜", flex: 1, headerAlign: "center", align: "center" },
        { field: "CONN_STRT_TM", headerName: "시간", flex: 1, headerAlign: "center", align: "center" },
      ]);
    }
  };

  const loginStatusOptions = [
    { CD_VAL: "01", CD_VAL_NM: "Login" },
    { CD_VAL: "02", CD_VAL_NM: "Logout" },
  ];
  // ==============================================================
  // 데이터 조회 함수
  // ==============================================================
  const getuserconnectstatus = async () => {
    try {
      setLoading(true);

      const param = {
        SYS_TP_CD: "STO", // 예시 TR시스템코드
        USR_GRP_ID: cboUsrGrp,
        // PRSNT_LOGIN_YN:
        //   cboConnStat === "Y" ? "01" : cboConnStat === "N" ? "02" : "",
        PRSNT_LOGIN_YN: cboConnStat || "",
        USR_TP_CD: "",
        TR_CONN_STAT: rdoConn === "1" ? "Y" : "N",  // 라디오 버튼 값에 따라 동적
        FROM_DD: fromDate,
        TO_DD: toDate
      };

      console.log(cboConnStat);

      const { name, table } = await http.post(
        "/admin/getuserconnectstatus",
        param,
        { shape: "datatable", showSpinner: true }
      );

      setData(table);

    } catch (e) {
      console.error("[사용자접속 모니터링] 그룹 조회 실패", e);
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getHistoryDetail = async () => {
    try {
      setLoading(true);

      const param = {
        USR_ID: selectedRow.USR_ID,
        CONN_DD: detailFromDate,
        END_DD: detailToDate
      };

      console.log("📌 조회 파라미터:", param);

      const { table } = await http.post(
        "/admin/getuserconnectstatusdetail",
        param,
        { shape: "datatable", showSpinner: true }
      );
      setDetailData(table || []);
      console.log(table);
    } catch (e) {
      message.error("접속 이력 조회 실패");
    }
  };

  // ==============================================================
  // useEffect
  // ==============================================================
  useEffect(() => {
    updateColumns(rdoConn);
    getuserconnectstatus();
  }, [rdoConn]);

  useEffect(() => {
    getUserGroup();
  }, []);

  useEffect(() => {
    if (openDetailModal && selectedRow) {
      getHistoryDetail();
    }
  }, [openDetailModal]);

  // ==============================================================
  // 화면 구성
  // ==============================================================
  return (
    <GPageContainer>
      {/* ✅ 이 부분만 추가! */}
      <style>{`
      .ant-picker-dropdown {
        z-index: 1301 !important;
      }
    `}</style>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '접속상태',
              content: (
                <GSelectBox
                  items={loginStatusOptions}
                  value={cboConnStat}
                  onChange={(value) => setCboConnStat(value)}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                />
              ),
            },
            {
              header: '사용자그룹',
              content: (
                <GSelectBox
                  items={userGroups}
                  value={cboUsrGrp}
                  onChange={(value) => setCboUsrGrp(value)}
                  valueKey="CD_VAL"     // ← 백단 컬럼명에 맞게
                  labelKey="CD_VAL_NM"     // ← 백단 컬럼명에 맞게
                  toplabel="A"
                />
              ),
            },
            {
              header: ' ',
              content: (
                <RadioGroup
                  row
                  value={rdoConn}
                  onChange={(e) => setRdoConn(e.target.value)}
                >
                  <FormControlLabel value="1" control={<Radio />} label="접속현황" />
                  <FormControlLabel value="2" control={<Radio />} label="접속내역" />
                </RadioGroup>
              ),
            },
            {
              header: rdoConn === '2' ? '접속일자' : '',
              content: (
                <GDateRangePicker
                  range={true}
                  value={[fromDate, toDate]}
                  onChange={([from, to]) => {
                    setFromDate(from);
                    setToDate(to);
                  }}
                />
              ),
            },
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={getuserconnectstatus} />,
          ]}
        />
      </GSearchSection>

      {/* 그리드 영역 */}
      <GContentBox flex={true}>
        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <GDataGrid
            title="사용자접속모니터링"
            rows={data}
            columns={gridColumns}
            columnHeaderHeight={30}
            rowHeight={25}
            loading={false}
            Buttons={[false, false, false, false]}
            pagination={true}
            pageSizeOptions={[50, 100]}
            initialState={paginationInitialState}
            sx={paginationCenterSx}
          />
        </Box>
      </GContentBox>

      {/* ========================*/}
      {/* 사용자 접속 History 팝업 */}
      {/* ========================*/}

      <Dialog open={openDetailModal} onClose={() => setOpenDetailModal(false)}
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
          <Box sx={{ fontSize: '18px', fontWeight: 1000 }}>사용자접속현황</Box>
        </DialogTitle>
        <DialogContent
        >
          {/* 검색 영역 */}
          <GSearchSection
            sx={{
              minHeight: 72,
              display: "flex",
              alignItems: "center",
              flexShrink: 0
            }}
          >
            <GSearchHeader
              fields={[
                {
                  header: "사용자",
                  content: (
                    <TextField
                      value={selectedRow?.USR_NM || ""}
                      size="small"
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  ),
                },
                {
                  header: "접속기간",
                  content: (
                    <Box sx={{ width: 350 }}>
                      <GDateRangePicker
                        range
                        value={[detailFromDate, detailToDate]}
                        onChange={([from, to]) => {
                          setDetailFromDate(from);
                          setDetailToDate(to);
                        }}
                      />
                    </Box>
                  ),
                }, {}, {}
              ]}
              buttons={[
                <GButton
                  key="search"
                  auth="Search"
                  label="Search"
                  onClick={getHistoryDetail}
                />,
              ]}
            />
          </GSearchSection>

          {/* 그리드 영역 */}
          <Box sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column"
          }}>
            <GDataGrid
              title="사용자접속현황상세"
              rows={detailData}
              columns={[
                { field: "CLIENT_IP", headerName: "접속IP", flex: 1 },
                { field: "CONN_STRT_TM", headerName: "접속시간", flex: 1 },
                { field: "CONN_END_TM", headerName: "접속종료시간", flex: 1 },
              ]}
              rowHeight={25}
              columnHeaderHeight={30}
              Buttons={[false, false, false, false]}
              height={500}
            />
          </Box>

          {/* 버튼 영역 */}
          <DialogActions>
            <GButton label="Close" onClick={() => setOpenDetailModal(false)} />
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* ========================*/}
      {/* 사용자 접속 History End  */}
      {/* ========================*/}

    </GPageContainer>
  );
}