import React, { useEffect, useState, useMemo } from 'react';
import { Card, Input, Space, message } from 'antd';

import GDataGrid from '@/components/GDataGrid.jsx';
import GDateEditCell from '@/components/GDateEditCell.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GDatePicker  from '@/components/GDatePicker.jsx';
import GDateRangePicker  from '@/components/GDateRangePicker.jsx';
import GTextField from '@/components/GTextField';
import METASDTSD01P1 from './METASDTSD01P1'
//import { useData } from '@/context/DataContext.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import { TextField, Stack, Button } from '@mui/material';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GButton from '@/components/GButton';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
// 서버호출/유틸
import { http } from '@/libs/TaskHttp';
import { changes, toValueOptions } from '@/libs/Utils';
import { cacheCode } from '@/libs/DataUtils';

export default function METASDTSD01S1() {
  // ===== Cache 코드 =====
  const [cacheWordSecCd, setCacheWordSecCd] = useState([]);
  const [cacheWordTpCd, setCacheWordTpCd] = useState([]);
  const [cacheWordDtlTpCd, setCacheWordDtlTpCd] = useState([]);

  // ===== 모달팝업 관련 =====
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'edit', 'delete'

  // ===== 검색/그리드 상태 =====
  const [wordKorNm, setWordKorNm] = useState('');
  const [wordSecCd, setWordSecCd] = useState('');
  const [wordRealEngNm, setWordRealEngNm] = useState('');
  const [wordEngNm, setWordEngNm] = useState('');
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [words, setWords] = useState([]);
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 row 데이터

   // SearchHeader용 폼 상태
  const handleInitialize = () => { 
    console.log('Init'); 
    setWordKorNm(''); 
    setWordSecCd(''); 
    setWordRealEngNm('');
    setWordEngNm('');
    setToDate('');
    setFromDate('');
  };

  
 
  // ===== 사용자 입력 검증 ===== 
  

  // ===== 데이터 초기화 =====


  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["WORD_SEC_CD", "WORD_TP_CD", "WORD_DTL_TP_CD"];
      const result = await cacheCode(params);
      setCacheWordSecCd(result.WORD_SEC_CD || []);
      setCacheWordTpCd(result.WORD_TP_CD || []);
      setCacheWordDtlTpCd(result.WORD_DTL_TP_CD || []);
    })();
  }, []);


  // ===== 데이터 조회 =====
  const getWords = async () => {
    console.log('단어 조회=====');
    try {
      const param = { WORD_KOR_NM : wordKorNm
                    , WORD_SEC_CD : wordSecCd
                    , WORD_ENG_FULL_NM : wordRealEngNm
                    , WORD_ENG_NM : wordEngNm 
                    , FROM_DATE : fromDate.replace(/-/g,"") 
                    , TO_DATE : toDate.replace(/-/g,"")
                    }; // 조회 조건을 JS 객체(Map 형태)로
      const { name, table } = await http.post('/meta/getWordList',param,{ shape: 'datatable', showSpinner: true });
      setWords(table);
      if (table && table.length > 0) {
        setSelectedWordId(table[0]);
        setSelectedRow(table[0]); // 첫 번째 row 선택
      } else {
        // ⭐ 조회 결과가 없으면 선택 초기화
        setSelectedWordId(null);
        setSelectedRow(null);
      }
    } catch (e) {
      console.error('[단어] 조회 실패', e);
      message.error('단어 목록을 불러오지 못했습니다.');
    } finally {

    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => { getWords(); }, []);

  // ===== Row 클릭 핸들러 =====
  const handleRowClick = (params) => {
    setSelectedRow(params.row);
    setSelectedWordId(params.row);
  };

  // ===== 코드 값을 코드명으로 변환하는 헬퍼 함수 =====
  const getCodeName = (codeList, codeValue) => {
    if (!codeValue || !codeList || codeList.length === 0) return '';
    const code = codeList.find(item => item.CD_VAL === codeValue);
    return code ? code.CD_VAL_NM : codeValue;
  };

  // ===== 모달 열기 핸들러들 =====
  const handleOpenAdd = () => {
    setModalMode('add');
    setOpenModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedRow) {
      message.warning('수정할 단어를 선택해주세요.');
      return;
    }

    const exists = words.some(word => word.WORD_NO === selectedRow.WORD_NO);
    if (!exists) {
      message.warning('선택한 단어가 목록에 없습니다. 다시 조회해주세요.');
      setSelectedRow(null);
      setSelectedWordId(null);
      return;
    }

    setModalMode('edit');
    setOpenModal(true);
  };

  const handleOpenDelete = () => {
    if (!selectedRow) {
      message.warning('삭제할 단어를 선택해주세요.');
      return;
    }

    const exists = words.some(word => word.WORD_NO === selectedRow.WORD_NO);
    if (!exists) {
      message.warning('선택한 단어가 목록에 없습니다. 다시 조회해주세요.');
      setSelectedRow(null);
      setSelectedWordId(null);
      return;
    }

    setModalMode('delete');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalMode('');
  };

  // ===== 팝업에서 성공 시 호출할 콜백 =====
  const handleModalSuccess = () => {
    setSelectedRow(null);
    setSelectedWordId(null);
    getWords(); // 목록 재조회
  };

  // ===== 컬럼 =====
  const wordColumns = [
    { headerName: 'NO'        , headerAlign: 'center', field: 'ROW_NUM'         ,                     width: 80, editable: false , align: 'center'},
    { headerName: '단어명'        , headerAlign: 'center', field: 'WORD_KOR_NM'     ,                       width: 300, editable: false },
    { headerName: '단어영문명'    , headerAlign: 'center', field: 'WORD_ENG_NM'     ,                       width: 300, editable: false },
    { headerName: '단어영문정식명'  , headerAlign: 'center', field: 'WORD_ENG_FULL_NM',                       width: 400, editable: false },
    { headerName: '단어구분'  , headerAlign: 'center', field: 'WORD_SEC_CD'  , type:'singleSelect'  ,  width: 120, editable: false, align: 'center' , valueOptions: toValueOptions(cacheWordSecCd, 'CD_VAL', 'CD_VAL_NM')},
    { headerName: '정의'        , headerAlign: 'center', field: 'WORD_DEFIN_DSC'     ,                       width: 300, editable: false , hide: true },
    { headerName: '최종변경일시', headerAlign: 'center', field: 'LST_ADJ_DDTM'      ,                       width: 200, editable: false , align: 'center'},
 ];

  const searchButtonGroup = useMemo(() => [
    { auth: 'Init', label: 'Initialize', onClick: handleInitialize },
    { auth: 'Search', label: 'Search', onClick: getWords },
  ], [handleInitialize, getWords]);

  const handleSave = () => {};
  const handleCancel = () => {};

  return (
    <div>
      <Stack>
        <Stack>
          <GSearchHeader
            fields={[
              {
                header: '단어명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={wordKorNm}
                    onChange={(e) => setWordKorNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getWords(); // 엔터로 조회 실행
                      }
                    }}
                    placeholder="단어명 입력"
                  />
                ),
              },
              {
                header: '단어구분',
                content: (
                  <GSelectBox 
                    items={cacheWordSecCd}              // Item 목록 바인딩
                    valueKey="CD_VAL"               // 코드 값
                    labelKey="CD_VAL_NM"            // 코드 명
                    toplabel="A"                    // 'A' : All , 'S' : Select
                    value={wordSecCd}                 // Value변수 할당
                    onChange={(v) => setWordSecCd(v)} // Value 할당
                  />
                ),
              },
              {
                header: '단어영문명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={wordEngNm}
                    onChange={(e) => setWordEngNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getWords(); // 엔터로 조회 실행
                      }
                    }}
                    placeholder="단어영문명 입력"
                  />
                ),
              },
              {
                header: '단어영문정식명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={wordRealEngNm}
                    onChange={(e) => setWordRealEngNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getWords(); // 엔터로 조회 실행
                      }
                    }}
                    placeholder="단어영문정식명 입력"
                  />
                ),
              },
              {
                header: '최종변경일',
                content: (
                  <GDateRangePicker value={[fromDate, toDate]}
                    onChange={([from, to]) => {
                      setFromDate(from);
                      setToDate(to);
                    }} />
                ),
              },{},{},{}
            ]}

            buttons={[
              <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
              <GButton key="search" auth="Search" label="Search" onClick={getWords} />,
            ]}
          />
        </Stack>

        {/* 상단: 단어목록 */}
        <Stack>
          <GDataGrid
            title="단어목록"
            rows={words}
            columns={wordColumns}
            Buttons={[false, false, false, true]}
            columnHeaderHeight={30}
            rowHeight={25}
            height={350}
            disableRowSelectionOnClick
            onRowsChange={setWords}        // 데이터변경사항 반영
            onRowClick={handleRowClick}     // Row 클릭 시 하단에 바인딩
            pagination={true}
            pageSizeOptions={[50, 100]}
            initialState={paginationInitialState}
            sx={paginationCenterSx}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 8 }}>
            <GButton key="add" auth="Save" label="Add" onClick={handleOpenAdd} />
            <GButton key="edit" auth="Save" label="Edit" onClick={handleOpenEdit} />
            <GButton key="delete" auth="Save" label="Delete" onClick={handleOpenDelete} />
          </div>
        </Stack>

        <Stack height={10} />

        {/* 하단: 용어 상세 (Read-only 바인딩) */}
        <Stack>
          <div>
            <div style={{ 
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {/* 첫 번째 행 */}
                  <tr>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      width: '15%',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>단어명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd',
                      width: '35%'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.WORD_KOR_NM || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      width: '15%',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>단어영문명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd',
                      width: '35%'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.WORD_ENG_NM || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                  </tr>

                  {/* 두 번째 행 */}
                  <tr>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>단어영문정식명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.WORD_ENG_FULL_NM || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>단어유형</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={getCodeName(cacheWordTpCd, selectedRow?.WORD_TP_CD) || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                  </tr>

                  {/* 네 번째 행 */}
                  <tr>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>단어소분류</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={getCodeName(cacheWordDtlTpCd, selectedRow?.WORD_DTL_TP_CD) || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>도메인명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.DOMAIN_NO || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                  </tr>

                  {/* 세 번째 행 */}
                  <tr>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>정의</td>
                    <td colSpan={3} style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.WORD_DEFIN_DSC || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                        multiline
                        minRows={2}
                        maxRows={2}
                      />
                    </td>
                  </tr>

                  {/* 다섯 번째 행 */}
                  <tr>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd'
                    }}>최초등록일시</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.REG_DDTM || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                    <td style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '10px 16px', 
                      fontSize: '14.8px',
                      fontWeight: '400',
                      color: '#333',
                      borderRight: '1px solid #ddd'
                    }}>최종변경일시</td>
                    <td style={{ 
                      padding: '8px 12px'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        isReadOnly={true}
                        value={selectedRow?.LST_ADJ_DDTM || ''}
                        InputProps={{ 
                          readOnly: true,
                          style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Stack>
      </Stack>

      {/* 팝업 컴포넌트 사용 */}
      <METASDTSD01P1
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedRow}
        cacheWordSecCd={cacheWordSecCd}
        cacheWordTpCd={cacheWordTpCd}
        cacheWordDtlTpCd={cacheWordDtlTpCd}
      />
    </div>
  );
}