import React, { useState, useEffect } from 'react';
import { Stack, Box } from '@mui/material';
import dayjs from 'dayjs';

import GSearchHeader from '@/components/GSearchHeader';
import GButton from '@/components/GButton';
import GDataGrid from '@/components/GDataGrid';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GDatePicker from '@/components/GDatePicker';
import GDateRangePicker from '@/components/GDateRangePicker';
import GTitleIcon from '@/components/GTitleIcon';
import { http } from '@/libs/TaskHttp';
import { cacheCode } from '@/libs/DataUtils';
import GMessageBox from '@/components/GMessageBox';
import { paginationCenterSx } from '@/components/GPagination';
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';
import GDetailTitle from '@/components/GDetailTitle';

/**
 * 영업일 관리 컴포넌트
 * - 휴일 정보 관리
 * - 영업일 정보 조회 및 관리
 */
export default function GPCLOPRBD01S1() {
  // ==============================================================
  //                        변수 정의
  // ==============================================================

  // 날짜 범위 상태
  const [dateRange, setDateRange] = useState([
    dayjs().format('YYYYMMDD'), 
    dayjs().add(1, 'year').format('YYYYMMDD')
  ]);

  // 휴일 목록 관련 상태
  const [holidayList, setHolidayList] = useState([]);
  const [originalHolidayList, setOriginalHolidayList] = useState([]);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // 영업일 정보 상태
  const [bizDateData, setBizDateData] = useState({
    BAS_DD: '',
    DD1AG_BZ_DD: '',
    DD1AF_BZ_DD: '',
    DD2AG_BZ_DD: '',
    DD2AF_BZ_DD: '',
    DD3AG_BZ_DD: '',
    DD3AF_BZ_DD: '',
  });

  // 코드 목록 상태
  const [lstHdayTpCd, setLstHdayTpCd] = useState([]);
  const [sysHolidayCache, setSysHolidayCache] = useState([]);

  // 고정 코드 목록
  const [lstHdayYn] = useState([
    { CD_VAL: 'Y', CD_VAL_NM: 'Yes' },
    { CD_VAL: 'N', CD_VAL_NM: 'No' }
  ]);

  const [lstRsvdayYn] = useState([
    { CD_VAL: 'Y', CD_VAL_NM: 'Yes' },
    { CD_VAL: 'N', CD_VAL_NM: 'No' }
  ]);

  // ==============================================================
  //                        데이터 조회 처리
  // ==============================================================

  /**
   * 컴포넌트 마운트 시 초기 데이터 조회
   */
  useEffect(() => {
    (async () => {
      // 코드 캐시 조회
      const params = ["HDAY_TP_CD"];
      const result = await cacheCode(params);
      setLstHdayTpCd(result.HDAY_TP_CD || []);

      // 시스템 공휴일 목록 조회
      try {
        const holidayResponse = await http.post('/mkm/getholidaylist', {}, {
          showSpinner: false
        });
        setSysHolidayCache(holidayResponse || []);
      } catch (error) {
        console.error('공휴일 목록 조회 실패:', error);
      }

      // 기준일자 기반 초기 데이터 조회
      try {
        const response = await http.post('/mkm/getmkmcl01', {
          SRCH_DD: dayjs().format('YYYYMMDD'),
          SRCH_END_DD: dayjs().add(1, 'year').format('YYYYMMDD')
        }, {
          showSpinner: false
        });

        const standardList = response.dtStandard || [];
        const standardData = standardList.length > 0 ? standardList[0] : null;

        if (standardData && standardData.BAS_DD) {
          const basDate = dayjs(standardData.BAS_DD, 'YYYYMMDD');
          
          setDateRange([basDate.format('YYYYMMDD'), basDate.add(1, 'year').format('YYYYMMDD')]);
          setBizDateData(standardData);

          const param = {
            SRCH_DD: basDate.format('YYYYMMDD'),
            SRCH_END_DD: basDate.add(1, 'year').format('YYYYMMDD')
          };

          const searchResponse = await http.post('/mkm/getmkmcl01', param, {
            showSpinner: true
          });

          const holidayData = processHolidayData(searchResponse);
          setHolidayList(holidayData);
          setOriginalHolidayList(holidayData);

          if (holidayData.length > 0) {
            setSelectedHoliday(holidayData[0]);
          }
        } else {
          handleSearch();
        }
      } catch (error) {
        console.error('기준일자 조회 실패:', error);
        handleSearch();
      }
    })();
  }, []);

  /**
   * 휴일 데이터 조회
   */
  const handleSearch = async () => {
    try {
      const param = {
        SRCH_DD: dateRange[0],
        SRCH_END_DD: dateRange[1]
      };
      
      const response = await http.post('/mkm/getmkmcl01', param, {
        showSpinner: true
      });
      
      const holidayData = processHolidayData(response);
      const standardList = response?.dtStandard || [];
      const standardData = standardList.length > 0 ? standardList[0] : null;
      
      setHolidayList(holidayData);
      setOriginalHolidayList(holidayData);
      
      if (standardData) {
        setBizDateData(standardData);
      }
      
      if (holidayData.length > 0) {
        setSelectedHoliday(holidayData[0]);
      }
    } catch (error) {
      console.error('조회 실패:', error);
      await GMessageBox.Show('조회중 에러가 발생했습니다', 'Ok');
    }
  };

  /**
   * 영업일 정보 조회
   */
  const handleBizDateSearch = async (baseDd) => {
    try {
      const param = { BAS_DD: baseDd };
      const result = await http.post('/mkm/getbizdate', param, {
        showSpinner: true
      });
      
      if (Array.isArray(result) && result.length > 0) {
        setBizDateData(result[0]);
      } else if (result && typeof result === 'object') {
        setBizDateData(result);
      }
    } catch (error) {
      console.error('영업일 조회 실패:', error);
      await GMessageBox.Show('영업일 조회 중 에러가 발생했습니다', 'Ok');
    }
  };

  // ==============================================================
  //                        데이터 저장 처리
  // ==============================================================

  /**
   * 휴일 데이터 저장
   */
  const handleHolidaySave = async () => {
    const changedData = holidayList.filter(row => row.ROW_STATE);

    if (changedData.length === 0) {
      await GMessageBox.Show('MGI00001', 'Ok');
      return;
    }

    if (!await validateHolidayData(changedData)) {
      return;
    }

    const insertCnt = changedData.filter(row => row.ROW_STATE === 'I').length;
    const updateCnt = changedData.filter(row => row.ROW_STATE === 'U').length;
    const deleteCnt = changedData.filter(row => row.ROW_STATE === 'D').length;

    const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
    if (r === 'no') {
      return;
    }

    try {
      const saveData = changedData.map(row => {
        const { __rid, ...rest } = row;
        return {
          ...rest,
          MKT_STRT_TM: formatTime(rest.MKT_STRT_TM),
          MKT_END_TM: formatTime(rest.MKT_END_TM)
        };
      });

      await http.post('/mkm/saveholydate', saveData, {
        showSpinner: true
      });

      await GMessageBox.Show('MGI00352', 'Ok');
      await handleSearch();

      if (bizDateData.BAS_DD) {
        await handleBizDateSearch(bizDateData.BAS_DD);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      await GMessageBox.Show('저장중 오류가 발생했습니다', 'Ok');
    }
  };

  /**
   * 영업일 데이터 저장
   */
  const handleBizDateSave = async () => {
    if (!bizDateData.BAS_DD) {
      await GMessageBox.Show('MGW00018', 'Ok', '기준일자');
      return;
    }
    
    const r = await GMessageBox.Show('MGQ00800', 'YesNo');
    if (r === 'no') {
      return;
    }
    
    try {
      const saveData = [{
        ...bizDateData,
        ROW_STATE: 'U'
      }];
      
      await http.post('/mkm/savebizdate', saveData, {
        showSpinner: true
      });
      
      await GMessageBox.Show('MGI00352', 'Ok');
      
      const basDate = dayjs(bizDateData.BAS_DD, 'YYYYMMDD');
      setDateRange([basDate.format('YYYYMMDD'), basDate.add(1, 'year').format('YYYYMMDD')]);
      
      const param = {
        SRCH_DD: basDate.format('YYYYMMDD'),
        SRCH_END_DD: basDate.add(1, 'year').format('YYYYMMDD')
      };
      
      const response = await http.post('/mkm/getmkmcl01', param, {
        showSpinner: true
      });
      
      const holidayData = processHolidayData(response);
      const standardList = response?.dtStandard || [];
      const standardData = standardList.length > 0 ? standardList[0] : null;
      
      setHolidayList(holidayData);
      setOriginalHolidayList(holidayData);
      
      if (standardData) {
        setBizDateData(standardData);
      }
      
      if (holidayData.length > 0) {
        setSelectedHoliday(holidayData[0]);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      await GMessageBox.Show('저장중 오류가 발생했습니다', 'Ok');
    }
  };

  // ==============================================================
  //                        이벤트 정의
  // ==============================================================

  /**
   * 휴일 행 클릭 이벤트
   */
  const handleHolidayRowClick = (params) => {
    setSelectedHoliday(params.row);
  };

  /**
   * 날짜 범위 변경 이벤트
   */
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const fromDate = dates[0].replace(/-/g, '');
      const toDate = dates[1].replace(/-/g, '');
      setDateRange([fromDate, toDate]);
    }
  };

  /**
   * 기준일자 변경 이벤트
   */
  const handleBasDdChange = async (dateStr) => {
    if (!dateStr) return;
    
    const formattedDate = dateStr.replace(/-/g, '');
    const newDate = dayjs(formattedDate, 'YYYYMMDD');
    const weekday = newDate.day();
    
    if (weekday === 0 || weekday === 6) {
      await GMessageBox.Show('유효한 영업일이 아닙니다', 'Ok');
      return;
    }
    
    const isSystemHoliday = sysHolidayCache.some(h => h.HOLDY_DD === formattedDate);
    if (isSystemHoliday) {
      await GMessageBox.Show('유효한 영업일이 아닙니다', 'Ok');
      return;
    }
    
    const holiday = holidayList.find(h => h.BAS_DD === formattedDate);
    if (holiday && holiday.HDAY_YN === 'Y') {
      await GMessageBox.Show('유효한 영업일이 아닙니다.', 'Ok');
      return;
    }

    const r = await GMessageBox.Show('기준일자 변경 시 하단 영업일이 재계산 됩니다. 진행하시겠습니까?', 'YesNo');
    if (r === 'no') {
      return;
    }

    setBizDateData(prev => ({ ...prev, BAS_DD: formattedDate }));
    await handleBizDateSearch(formattedDate);
  };

  /**
   * 셀 편집 시작 이벤트
   */
  const handleCellEditStart = async (params, event) => {
    if (params.field === 'HDAY_YN') {
      const selectedBasDd = params.row.BAS_DD;
      const subGridBasDd = bizDateData.BAS_DD;

      if (selectedBasDd === subGridBasDd) {
        event.defaultMuiPrevented = true;
        await GMessageBox.Show('기준일자와 동일한 경우 휴일여부 변경이 불가능합니다', 'Ok');
        return;
      }
    }
  };

  /**
   * 행 데이터 변경 이벤트
   */
  const handleRowsChange = (newRows) => {
    const updatedRows = newRows.map(newRow => {
      const oldRow = holidayList.find(old => 
        (old.__rid && old.__rid === newRow.__rid) || 
        (old.BAS_DD === newRow.BAS_DD)
      );
      
      if (!oldRow) return newRow;
            
      const isChanged = 
        newRow.BAS_DD !== oldRow.BAS_DD ||
        newRow.HDAY_YN !== oldRow.HDAY_YN ||
        newRow.HDAY_TP_CD !== oldRow.HDAY_TP_CD ||
        newRow.MKT_STRT_TM !== oldRow.MKT_STRT_TM ||
        newRow.MKT_END_TM !== oldRow.MKT_END_TM ||
        newRow.RSVDAY_YN !== oldRow.RSVDAY_YN;
      
      if (isChanged) {
        const newRowState = oldRow.ROW_STATE === 'I' ? 'I' : 'U';
        return { ...newRow, ROW_STATE: newRowState };
      }
      
      return newRow;
    });
    
    setHolidayList(updatedRows);
  };

  /**
   * 휴일 목록 되돌리기
   */
  const handleHolidayRevert = () => {
    setHolidayList([...originalHolidayList]);
  };

  // ==============================================================
  //                        필드 정의
  // ==============================================================

  /**
   * 숫자 전용 입력 셀 렌더러
   */
  const renderNumberOnlyCell = (params) => {
    return (
      <input
        type="text"
        value={params.value || ''}
        maxLength={6}
        autoFocus
        onFocus={(e) => {
          const length = e.target.value.length;
          e.target.setSelectionRange(length, length);
        }}
        onInput={(e) => {
          let value = e.target.value;
          value = value.replace(/[^\d]/g, '');
          value = value.slice(0, 6);
          
          e.target.value = value;
          
          params.api.setEditCellValue({ 
            id: params.id, 
            field: params.field, 
            value: value 
          });
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '0 8px',
          textAlign: 'center',
          fontSize: '14px'
        }}
      />
    );
  };

  /**
   * 새 휴일 행 생성
   */
  const createNewHolidayRow = () => {
    const maxDate = holidayList.length > 0 
      ? holidayList.reduce((max, row) => row.BAS_DD > max ? row.BAS_DD : max, '00000000')
      : dayjs().format('YYYYMMDD');
    
    const nextDate = dayjs(maxDate, 'YYYYMMDD').add(1, 'day').format('YYYYMMDD');
    const isHoliday = sysHolidayCache.some(h => h.HOLDY_DD === nextDate);
    
    return {
      BAS_DD: nextDate,
      HDAY_YN: isHoliday ? 'Y' : 'N',
      HDAY_TP_CD: 0,
      MKT_STRT_TM: '',
      MKT_END_TM: '',
      RSVDAY_YN: 'N'
    };
  };

  // ==============================================================
  //                        유틸리티 함수
  // ==============================================================

  /**
   * 날짜 표시 형식 변환 (YYYYMMDD → YYYY-MM-DD)
   */
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return '';
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  };

  /**
   * 시간 형식 변환
   */
  const formatTime = (timeStr) => {
    if (!timeStr) return '';

    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }

    const digits = String(timeStr).replace(/[^\d]/g, '');
    const padded = digits.padEnd(6, '0');
    const hh = padded.slice(0, 2);
    const mm = padded.slice(2, 4);
    const ss = padded.slice(4, 6);

    return `${hh}:${mm}:${ss}`;
  };

  /**
   * 휴일 데이터 처리
   */
  const processHolidayData = (response) => {
    if (!response || typeof response !== 'object') return [];
    
    return (response.dtHoly || []).map(row => ({
      ...row,
      MKT_STRT_TM: row.MKT_STRT_TM || '',
      MKT_END_TM: row.MKT_END_TM || '',
      RSVDAY_YN: row.RSVDAY_YN || 'N'
    }));
  };

  /**
   * 휴일 데이터 검증
   */
  const validateHolidayData = async (changedData) => {
    for (const row of changedData) {
      if (!row.BAS_DD || row.BAS_DD === '') {
        await GMessageBox.Show('MGW00018', 'Ok', '기준일자');
        return false;
      }
      
      if (row.ROW_STATE === 'I') {
        const duplicates = holidayList.filter(
          h => h.BAS_DD === row.BAS_DD && h.ROW_STATE === 'I'
        );
        if (duplicates.length > 1) {
          await GMessageBox.Show(
            `기준일자 ${dayjs(row.BAS_DD, 'YYYYMMDD').format('YYYY-MM-DD')}가 중복됩니다.`, 
            'Ok'
          );
          return false;
        }
      }
    }
    
    return true;
  };

  // ==============================================================
  //                        그리드 컬럼 정의
  // ==============================================================

  /** 휴일 목록 그리드 컬럼 */
  const holidayColumns = [
    {
      field: 'BAS_DD',
      headerName: '기준일자',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      displayAsYmd: true
    },
    {
      field: 'HDAY_YN',
      headerName: '휴일여부',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      type: 'singleSelect',
      valueOptions: lstHdayYn.map(item => ({
        value: item.CD_VAL,
        label: item.CD_VAL_NM
      }))
    },
    {
      field: 'MKT_STRT_TM',
      headerName: '장시작시간',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      renderEditCell: renderNumberOnlyCell
    },
    {
      field: 'MKT_END_TM',
      headerName: '장마감시간',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      renderEditCell: renderNumberOnlyCell
    },
    {
      field: 'HDAY_TP_CD',
      headerName: '휴일유형',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      type: 'singleSelect',
      valueOptions: lstHdayTpCd.map(item => ({
        value: item.CD_VAL,
        label: item.CD_VAL_NM
      }))
    },
    {
      field: 'RSVDAY_YN',
      headerName: '지준일여부',
      headerAlign: 'center',
      width: 120,
      align: 'center',
      editable: true,
      type: 'singleSelect',
      valueOptions: lstRsvdayYn.map(item => ({
        value: item.CD_VAL,
        label: item.CD_VAL_NM
      }))
    }
  ];

  // ==============================================================
  //                          화면 구성
  // ==============================================================

  return (
    <GPageContainer>
      {/* 조회 영역 */}
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '기준일자',
              content: (
                <GDateRangePicker 
                  value={[formatDateForDisplay(dateRange[0]), formatDateForDisplay(dateRange[1])]} 
                  onChange={handleDateRangeChange} 
                  format="YYYY-MM-DD"
                />
              ),
            },
            {},
            {},
            {}
          ]}
          buttons={[
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />
          ]}
        />
      </GSearchSection>

      {/* 메인 영역 (확장 가능) */}
      <GContentBox flex={true}>
        <Box sx={{ 
          flex: 1, 
          minHeight: 0, 
          display: 'flex', 
          gap: 2,
          overflow: 'hidden'
        }}>
          <Stack direction="row" spacing={2} sx={{ flex: 1, width: '100%' }}>
            {/* 왼쪽: 달력 그리드 */}
            <Box sx={{ 
              flex: 4, 
              minHeight: 0, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              gap: 2
            }}>
              <Box sx={{ 
                flex: 1, 
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <GDataGrid
                  title={`달력 Total (${holidayList.length})`}
                  showTitle={true}
                  rows={holidayList}
                  columns={holidayColumns}
                  onRowsChange={handleRowsChange}
                  onCellEditStart={handleCellEditStart}
                  Buttons={{ add: true, delete: true, revert: true, excel: false }}
                  onRevertClick={handleHolidayRevert}
                  createNewRow={createNewHolidayRow}
                  columnHeaderHeight={30}
                  rowHeight={25}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowClick={handleHolidayRowClick}
                  enableRowState={true}
                  pagination={true}
                  sx={paginationCenterSx}
                  localeText={{
                    noRowsLabel: '',
                  }}
                />
              </Box>
              
              <GButtonGroup>
                <GButton auth="Save" label="Save" onClick={handleHolidaySave} />
              </GButtonGroup>
            </Box>
            
            {/* 오른쪽: 영업일 정보 */}
            <Stack flex={6}>
              <GDetailTitle title="영업일 정보" />

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
                  <GLayoutGroup orientation="horizontal">
                    <GLayoutItem label="기준일자">
                      <GDatePicker
                        value={formatDateForDisplay(bizDateData.BAS_DD || '')}
                        onChange={handleBasDdChange}
                        format="YYYY-MM-DD"
                        showCalendarIcon={true}
                        allowClear={false}
                        height={30}
                        placeholder=""
                      />
                    </GLayoutItem>
                    
                    <GLayoutItem label="">
                      <Box />
                    </GLayoutItem>
                  </GLayoutGroup>
                  
                  <GLayoutGroup orientation="horizontal">
                    <GLayoutItem label="1전영업일">
                      <GTextField
                        value={bizDateData.DD1AG_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                    
                    <GLayoutItem label="1후영업일">
                      <GTextField
                        value={bizDateData.DD1AF_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                  </GLayoutGroup>
                  
                  <GLayoutGroup orientation="horizontal">
                    <GLayoutItem label="2전영업일">
                      <GTextField
                        value={bizDateData.DD2AG_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                    
                    <GLayoutItem label="2후영업일">
                      <GTextField
                        value={bizDateData.DD2AF_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                  </GLayoutGroup>
                  
                  <GLayoutGroup orientation="horizontal">
                    <GLayoutItem label="3전영업일">
                      <GTextField
                        value={bizDateData.DD3AG_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                    
                    <GLayoutItem label="3후영업일">
                      <GTextField
                        value={bizDateData.DD3AF_BZ_DD || ''}
                        isReadOnly={true}
                      />
                    </GLayoutItem>
                  </GLayoutGroup>
                </GLayoutGroup>
              </Box>
              
              <GButtonGroup>
                <GButton auth="Save" label="Save" onClick={handleBizDateSave} />
              </GButtonGroup>
            </Stack>
          </Stack>
        </Box>
      </GContentBox>
    </GPageContainer>
  );
}