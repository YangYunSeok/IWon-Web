import React, { useEffect, useState, useMemo } from 'react';
import { message } from 'antd';

import GDataGrid from '@/components/GDataGrid.jsx';
import GDateRangePicker from '@/components/GDateRangePicker.jsx';
import GTextField from '@/components/GTextField';
import METASDTSD03P1 from './METASDTSD03P1'
import GSelectBox from '@/components/GSelectBox.jsx';
import { Stack } from '@mui/material';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GButton from '@/components/GButton';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
// 서버호출/유틸
import { http } from '@/libs/TaskHttp';
import { toValueOptions } from '@/libs/Utils';
import { cacheCode } from '@/libs/DataUtils';

export default function METASDTSD03S1() {
  // ===== Cache 코드 =====
  const [cacheSystemCd, setCacheSystemCd] = useState([]);
  const [cacheWordSecCd, setCacheWordSecCd] = useState([]);
  const [cacheWordTpCd, setCacheWordTpCd] = useState([]);
  const [cacheWordDtlTpCd, setCacheWordDtlTpCd] = useState([]);
  const [cacheDataTypeCd, setCacheDataTypeCd] = useState([]);

  // ===== 모달팝업 관련 =====
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'edit', 'delete'

  // ===== 검색/그리드 상태 =====
  const [termKorNm, setTermKorNm] = useState('');
  const [systemCd, setSystemCd] = useState('');
  const [termEngFullNm, setTermEngFullNm] = useState('');
  const [termEngNm, setTermEngNm] = useState('');
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 row 데이터

  // SearchHeader용 폼 상태
  const handleInitialize = () => { 
    console.log('Init'); 
    setTermKorNm(''); 
    setSystemCd(''); 
    setTermEngFullNm('');
    setTermEngNm('');
    setToDate('');
    setFromDate('');
  };

  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["SYS_CD", "WORD_SEC_CD" , "WORD_TP_CD", "WORD_DTL_TP_CD", "DATA_TYPE_CD"];
      const result = await cacheCode(params);
      setCacheSystemCd(result.SYS_CD || []);
      setCacheWordSecCd(result.WORD_SEC_CD || []);
      setCacheWordTpCd(result.WORD_TP_CD || []);
      setCacheWordDtlTpCd(result.WORD_DTL_TP_CD || []);
      setCacheDataTypeCd(result.DATA_TYPE_CD || []);
    })();
  }, []);

  // ===== 데이터 조회 =====
  const getTerms = async () => {
    console.log('용어 조회=====');
    try {
      const param = { 
        TERM_KOR_NM: termKorNm,
        SYSTEM_CD: systemCd,
        TERM_ENG_FULL_NM: termEngFullNm,
        TERM_ENG_NM: termEngNm,
        FROM_DATE: fromDate.replace(/-/g, ""),
        TO_DATE: toDate.replace(/-/g, "")
      };
      const { name, table } = await http.post('/meta/getTermList', param, { shape: 'datatable', showSpinner: true });
      setTerms(table);
      if (table && table.length > 0) {
        setSelectedTermId(table[0]);
        setSelectedRow(table[0]); // 첫 번째 row 선택
      } else {
        // ⭐ 조회 결과가 없으면 선택 초기화
        setSelectedTermId(null);
        setSelectedRow(null);
      }
    } catch (e) {
      console.error('[용어] 조회 실패', e);
      message.error('용어 목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => { getTerms(); }, []);

  // ===== Row 클릭 핸들러 =====
  const handleRowClick = (params) => {
    setSelectedRow(params.row);
    setSelectedTermId(params.row);
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
      message.warning('수정할 용어를 선택해주세요.');
      return;
    }

    const exists = terms.some(term => term.TERM_NO === selectedRow.TERM_NO);
    if (!exists) {
      message.warning('선택한 용어가 목록에 없습니다. 다시 조회해주세요.');
      setSelectedRow(null);
      setSelectedTermId(null);
      return;
    }

    setModalMode('edit');
    setOpenModal(true);
  };

  const handleOpenDelete = () => {
    if (!selectedRow) {
      message.warning('삭제할 용어를 선택해주세요.');
      return;
    }

    const exists = terms.some(term => term.TERM_NO === selectedRow.TERM_NO);
    if (!exists) {
      message.warning('선택한 용어가 목록에 없습니다. 다시 조회해주세요.');
      setSelectedRow(null);
      setSelectedTermId(null);
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
    setSelectedTermId(null);
    getTerms(); // 목록 재조회
  };

  // ===== 컬럼 =====
  const termColumns = [
    { headerName: 'NO', headerAlign: 'center', field: 'ROW_NUM', width: 80, editable: false , align: 'center'},
    { headerName: '용어명', headerAlign: 'center', field: 'TERM_KOR_NM', width: 300, editable: false },
    { headerName: '용어영문명', headerAlign: 'center', field: 'TERM_ENG_NM', width: 300, editable: false },
    { headerName: '용어영문정식명', headerAlign: 'center', field: 'TERM_ENG_FULL_NM', width: 400, editable: false },
    { headerName: '도메인명', headerAlign: 'center', field: 'DOMAIN_ID', width: 400, editable: false , hide:true },
    { headerName: '시스템', headerAlign: 'center', field: 'SYS_CD', type: 'singleSelect', width: 120, editable: false , valueOptions: toValueOptions(cacheSystemCd, 'CD_VAL', 'CD_VAL_NM') , align: 'center'},
    { headerName: '최종변경일시', headerAlign: 'center', field: 'LST_ADJ_DDTM', width: 200, editable: false , align: 'center'},
  ];

  return (
    <div>
      <Stack>
        <Stack>
          <GSearchHeader
            fields={[
              {
                header: '용어명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={termKorNm}
                    onChange={(e) => setTermKorNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getTerms();
                      }
                    }}
                    placeholder="용어명 입력"
                  />
                ),
              },
              {
                header: '시스템',
                content: (
                  <GSelectBox 
                    items={cacheSystemCd}
                    valueKey="CD_VAL"
                    labelKey="CD_VAL_NM"
                    toplabel="A"
                    value={systemCd}
                    onChange={(v) => setSystemCd(v)}
                  />
                ),
              },
              {
                header: '용어영문명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={termEngNm}
                    onChange={(e) => setTermEngNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getTerms();
                      }
                    }}
                    placeholder="용어영문명 입력"
                  />
                ),
              },
              {
                header: '용어영문정식명',
                content: (
                  <GTextField
                    fullWidth
                    name="text"
                    value={termEngFullNm}
                    onChange={(e) => setTermEngFullNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getTerms();
                      }
                    }}
                    placeholder="용어영문정식명 입력"
                  />
                ),
              },
              {
                header: '최종변경일',
                content: (
                  <GDateRangePicker 
                    value={[fromDate, toDate]}
                    onChange={([from, to]) => {
                      setFromDate(from);
                      setToDate(to);
                    }} 
                  />
                ),
              },
              {}, {}, {}
            ]}
            buttons={[
              <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
              <GButton key="search" auth="Search" label="Search" onClick={getTerms} />,
            ]}
          />
        </Stack>

        {/* 상단: 용어목록 */}
        <Stack>
          <GDataGrid
            title="용어목록"
            rows={terms}
            columns={termColumns}
            Buttons={[false, false, false, true]}
            columnHeaderHeight={30}
            rowHeight={25}
            height={350}
            disableRowSelectionOnClick
            onRowsChange={setTerms}
            onRowClick={handleRowClick}
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
                    }}>용어명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd',
                      width: '35%'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.TERM_KOR_NM || ''}
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
                    }}>용어영문명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd',
                      width: '35%'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.TERM_ENG_NM || ''}
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
                    }}>용어영문정식명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.TERM_ENG_FULL_NM || ''}
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
                    }}>시스템</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={getCodeName(cacheSystemCd, selectedRow?.SYS_CD) || ''}
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
                    }}>도메인명</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderRight: '1px solid #ddd',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.DOMAIN_ID || ''}
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
                    }}>비고</td>
                    <td style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.TERM_NOTE || ''}
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
                    }}>정의</td>
                    <td colSpan={3} style={{ 
                      padding: '8px 12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <GTextField
                        size="small"
                        fullWidth
                        value={selectedRow?.TERM_DEFIN_DSC || ''}
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
      <METASDTSD03P1
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedRow}
        cacheSystemCd={cacheSystemCd}
        cacheWordSecCd={cacheWordSecCd}
        cacheWordTpCd={cacheWordTpCd}
        cacheWordDtlTpCd={cacheWordDtlTpCd}
        cacheDataTypeCd={cacheDataTypeCd}
      />
    </div>
  );
}