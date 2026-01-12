import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Snackbar,
  Stack,
} from "@mui/material";
import GDataGrid from "@/components/GDataGrid";
import axios from "axios";
import { http } from "@/libs/TaskHttp";
import { message } from "antd";
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GButton from '@/components/GButton';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { cacheCode } from '@/libs/DataUtils';
import GTitleIcon from "@/components/GTitleIcon.jsx";
import GDatePicker from '@/components/GDatePicker.jsx';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRMT03S1() {

  // ==============================================================
  // 상태 변수 정의
  // ==============================================================

  const _pageCount = useRef(1);
  const [DtPush, setDtPush] = useState([]);
  const [PUSH_TP_CD, setPUSH_TP_CD] = useState("");
  const [TR_SYS_TP_CD, setTR_SYS_TP_CD] = useState("");

  // 공통코드 (콤보박스용) - 간단히 빈배열로 시작
  const [pushTypes, setPushTypes] = useState([]);
  const [trSysTypes, setTrSysTypes] = useState([]);
  const [data, setData] = useState([]);
  const [resultMessage, setResultMessage] = useState("조회 결과가 없습니다.");
  const [selectedGrpId, setSelectedGrpId] = useState(null);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [lstExecStatCd, setLstExecStatCd] = useState([]);
  const [grpTpCd, setGrpTpCd] = useState('');

  const [date, setDate] = useState(dayjs());
  const searchDate = dayjs(date).format("YYYY-MM-DD");


  // 그리드 ref (스크롤 이벤트 바인딩용)
  const grdPushMessage = useRef(null);

  const ROW_COUNT_PER_PAGE = 30; // 필요 시 조정

  const [SEARCH_DD, setSEARCH_DD] = useState(() => {
    const d = new Date();
    // ASIS 초기값: yyyyMMdd
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });


  // ==============================================================
  // 컬럼 정의
  // ==============================================================
  const columns = [
    { field: "PUSH_TP_CD_NM", headerName: "Push유형", width: 120, headerAlign: "center", align: "center" },
    { field: "SND_USR_ID", headerName: "송신명", width: 110, headerAlign: "center", align: "left" },
    { field: "SND_USR_NM", headerName: "수신명", width: 110, headerAlign: "center", align: "left" },
    { field: "PUSH_MSG_CONTN", headerName: "Push메시지", flex: 1, headerAlign: "center", align: "left" },
    // { field: "PUSH_RCV_STAT_CD_NM", headerName: "수신상태", width: 100, headerAlign: "center", align: "center" },
    // { field: "PUSH_RCV_DD", headerName: "수신일자", width: 110, headerAlign: "center", align: "center" },
    // { field: "PUSH_RCV_TM", headerName: "수신시간", width: 110, headerAlign: "center", align: "center" },
    { field: "REG_DDTM", headerName: "등록일시", width: 170, headerAlign: "center", align: "center" },
    { field: "REG_ID", headerName: "등록자ID", width: 200, headerAlign: "center", align: "left" },
    { field: "REG_NM", headerName: "등록자명", width: 110, headerAlign: "center", align: "left" },
  ];

  // ==============================================================
  // 데이터 조회 함수
  // ==============================================================
  const BtnSearch_Click = async () => {
    // _pageCount.current = 1; // 최초 조회 시 페이지번호 초기화

    try {
      setLoading(true);
      const param = {
        SYS_LANG: "K",
        // PUSH_TP_CD: PUSH_TP_CD || null,
        PUSH_TP_CD: grpTpCd || null,
        TR_SYS_TP_CD: TR_SYS_TP_CD || null,
        SEARCH_DD: formatDateYYYYMMDD(searchDate),
        PAGE_CNT: ROW_COUNT_PER_PAGE,
        CURR_PAGE: _pageCount.current,
      };

      const { name, table } = await http.post("/admin/getpushmonitor", param, { shape: "datatable", showSpinner: true });

      setDtPush(table); // <-- 수정된 부분, 데이터 그리드에 반영

    } catch (e) {
      console.error("[PUSH 메세지 내역] 그룹 조회 실패", e);
      message.error("그룹 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };


  // ==============================================================  
  //                        서버 통신 
  // ==============================================================  
  const InitializeControl = async () => {
    // 공통코드 로딩 순서 보장
    try {
      // 처리상태
      const { table: clss } = await http.post(
        '/admin/getcodes',
        { GRP_CD_ID: 'PUSH_TP_CD' },
        { shape: 'datatable' }
      );
      setCodesMsgClssCd(Array.isArray(clss) ? clss : []);

      // 검색 콤보 기본값 세팅(없으면 첫 값)
      setMsgClssCd(prev => prev || clss?.[0]?.CD_VAL || '');
    } catch (e) {
      console.error('[공통코드] 조회 실패', e);
      GMessageBox.Show('MGW00001');
    }
  };

  // ==============================================================
  // useEffect
  // ==============================================================
  useEffect(() => {
    const el = grdPushMessage.current;
    BtnSearch_Click();
  }, []);

  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["PUSH_TP_CD"];
      const result = await cacheCode(params);
      setLstExecStatCd(result.PUSH_TP_CD || []);
    })();
  }, []);

  const setDtPushAndReset = (arr) => {
    setDtPush(arr);
  };

  // DataGrid row id getter
  const rows = (DtPush || []).map((r, idx) => ({ id: idx + 1, ...r }));

  // 유틸 함수
  function formatDateYYYYMMDD(isoDate) {
    if (!isoDate) return "";
    return isoDate.replaceAll("-", "");
  }

  function formatDateInput(yyyyMMdd) {
    // 'YYYYMMDD' -> 'YYYY-MM-DD'
    if (!yyyyMMdd) return "";
    if (yyyyMMdd.length !== 8) return "";
    return `${yyyyMMdd.slice(0, 4)}-${yyyyMMdd.slice(4, 6)}-${yyyyMMdd.slice(6, 8)}`;
  }

  // ==============================================================
  // 화면 구성
  // ==============================================================
  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: "전송일자",
              content: (
                <GDatePicker
                  value={searchDate}
                  onChange={(v) => setDate(dayjs(v))}
                  format="YYYY-MM-DD"
                  showCalendarIcon={true}
                  allowClear={false}
                />
              )
            },
            {
              header: 'PUSH유형',
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
            {},
            {}
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={BtnSearch_Click} />,
          ]}
        />
      </GSearchSection>

      {/* 그리드 영역 */}
      <GContentBox flex={true}>
        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <GDataGrid
            title="Push메세지내역"
            id="grdPushMessage"
            columns={columns}
            rows={rows}
            rowHeight={25}
            columnHeaderHeight={30}
            loading={loading}
            checkboxSelection={false}
            Buttons={{ add: false, delete: false, revert: false, excel: false }}
            pagination={true}
            pageSizeOptions={[50, 100]}
            initialState={paginationInitialState}
            sx={paginationCenterSx}
          />
        </Box>
      </GContentBox>
    </GPageContainer>
  );
}

