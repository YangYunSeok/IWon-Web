import React, { useState, useEffect, useRef } from "react";
import {
  Box
} from "@mui/material";
import GDataGrid from "@/components/GDataGrid";
import { message } from "antd";
import { http } from "@/libs/TaskHttp";
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GButton from '@/components/GButton';
import GDateRangePicker from "@/components/GDateRangePicker";
import dayjs from "dayjs";
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRLG01S1() {

  const [userId, setUserId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [excptLocTpCd, setExcptLocTpCd] = useState("");
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const pageSize = 1000;
  const currentPage = useRef(1);

  const excptLocTpCdOptions = [
    { CD_VAL: "", CD_VAL_NM: "전체" },
    { CD_VAL: "U", CD_VAL_NM: "UI" },
    { CD_VAL: "S", CD_VAL_NM: "Service" },
    { CD_VAL: "D", CD_VAL_NM: "DB" }
  ];

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (reset = true) => {
    try {
      setLoading(true);

      const offset = reset ? 0 : (currentPage.current - 1) * pageSize;

      const param = {
        CURR_PAGE: offset,
        PAGE_CNT: pageSize,
        FROM_DD: fromDate.replace(/-/g, ""),
        TO_DD: toDate.replace(/-/g, ""),
        USR_ID: userId,
        MENU_ID: menuId,
        EXCPT_LOC_TP_CD: excptLocTpCd || undefined
      };

      const { table } = await http.post("/admin/getexceptionlog", param, { shape: "datatable", showSpinner: true });
      const tableData = table || [];
      setData(tableData);
      
      // 첫 번째 row 자동 선택
      if (tableData.length > 0) {
        setSelectedRow(tableData[0]);
      } else {
        setSelectedRow(null);
      }
    } catch (e) {
      console.error("[예외로그] 조회 실패", e);
      message.error("예외 로그를 불러오지 못했습니다.");
      setSelectedRow(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = () => {
    const today = dayjs().format("YYYY-MM-DD");
    setFromDate(today);
    setToDate(today);
    setUserId("");
    setMenuId("");
    setExcptLocTpCd("");
  };

  const columns = [
    { field: "REG_DDTM", headerName: "발생일시", width: 180, headerAlign: "center", align: "center" },
    { field: "USR_ID", headerName: "사용자ID", width: 120, headerAlign: "center", align: "left" },
    { field: "MENU_ID", headerName: "메뉴ID", width: 150, headerAlign: "center", align: "left" },
    { field: "MENU_NM", headerName: "메뉴명", flex: 1, headerAlign: "center", align: "left" },
    { field: "EXCPT_LOC_TP_NM", headerName: "오류위치", width: 100, headerAlign: "center", align: "center" },
    { field: "SCREN_URL", headerName: "화면URL", flex: 2, headerAlign: "center", align: "left" },
    { field: "EXCPT_MSG_CONTN", headerName: "예외메시지", flex: 2, headerAlign: "center", align: "left" },
    { field: "USR_IP_ADDR", headerName: "사용자IP", width: 130, headerAlign: "center", align: "center" },
    { field: "SVR_IP", headerName: "서버IP", width: 130, headerAlign: "center", align: "center" }
  ];


  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: "발생일자",
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
              header: '사용자ID',
              content: (
                <GTextField
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="사용자ID 입력"
                />
              ),
            },
            {
              header: '메뉴ID',
              content: (
                <GTextField
                  value={menuId}
                  onChange={e => setMenuId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="메뉴ID 입력"
                />
              ),
            },
            {
              header: '오류위치',
              content: (
                <GSelectBox
                  items={excptLocTpCdOptions}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={excptLocTpCd}
                  onChange={(v) => setExcptLocTpCd(v)}
                />
              ),
            }
          ]}
          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />,
          ]}
        />
      </GSearchSection>

      <GContentBox flex={true}>
        <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
          <GDataGrid
            title="Exception현황"
            rows={data}
            Buttons={{ add: false, delete: false, revert: false, excel: true }}
            columns={columns}
            pagination={true}
            pageSizeOptions={[50, 100]}
            initialState={paginationInitialState}
            sx={paginationCenterSx}
            onRowClick={(params) => setSelectedRow(params.row)}
            getRowId={row => row.EXCPT_LOG_SEQ || `${row.REG_DDTM}-${row.USR_ID}`}
            columnHeaderHeight={30}
            rowHeight={25}
            columnVisibilityModel={{ EXCPT_MSG_CONTN: false, EXCPT_TRACE_CONTN: false }}
            loading={loading}
          />
        </Box>
      </GContentBox>

      <GContentBox flex={false} marginBottom={0}>
        <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
          <GLayoutItem label="예외메시지" height={60}>
            <GTextField
              value={selectedRow?.EXCPT_MSG_CONTN || "조회된 데이터가 없습니다."}
              readOnly={true}
              multiline
              minRows={1}
            />
          </GLayoutItem>
          <GLayoutItem label="예외상세로그" height={150}>
            <GTextField
              value={selectedRow?.EXCPT_TRACE_CONTN || "조회된 데이터가 없습니다."}
              readOnly={true}
              multiline
              minRows={3}
            />
          </GLayoutItem>
        </GLayoutGroup>
      </GContentBox>

    </GPageContainer>
  );
}