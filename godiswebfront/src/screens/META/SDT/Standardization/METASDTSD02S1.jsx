import React, { useEffect, useState, useMemo } from 'react';
import { Card, Input, Space, message } from 'antd';

import GDataGrid from '@/components/GDataGrid.jsx';
import GDatePicker  from '@/components/GDatePicker.jsx';
import METASDTSD02P1 from './METASDTSD02P1'
//import { useData } from '@/context/DataContext.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import { TextField, Stack, Button } from '@mui/material';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';
import GButton from '@/components/GButton';
import GDateRangePicker from '@/components/GDateRangePicker.jsx';
// 서버호출/유틸
import { http } from '@/libs/TaskHttp';
import { cacheCode } from '@/libs/DataUtils';
import { changes, toValueOptions } from '@/libs/Utils';

export default function METASDTSD02S1() {
  // ===== Cache 코드 =====
  const [cacheDomainSysCd, setCacheDomainSysCd] = useState([]);
  const [cacheWordTpCd, setCacheWordTpCd] = useState([]);
  const [cacheWordDtlTpCd, setCacheWordDtlTpCd] = useState([]);
  const [cacheDataTypeCd, setCacheDataTypeCd] = useState([]);

  // ===== 모달팝업 관련 =====
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState(''); // 'add', 'edit', 'delete'

  // ===== 검색/그리드 상태 =====
  const [domainNm, setDomainNm] = useState('');         // 도메인명
  const [domainSysCd, setDomainSysCd] = useState('');         // 시스템 코드
  const [wordTpCd, setWordTpCd] = useState('');               // 유형
  const [wordDtlTpCd, setWordDtlTpCd] = useState('');         // 소분류
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [Domains, setDomains] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 row 데이터

   // SearchHeader용 폼 상태
  const handleInitialize = () => { 
    console.log('Init'); 
    setDomainNm(''); 
    setDomainSysCd(''); 
    setWordTpCd(''); 
    setWordDtlTpCd(''); 
    setToDate('');
    setFromDate('');
  };

  const filteredWordDtlTpCd = useMemo(() => {
    if (!wordTpCd || !cacheWordDtlTpCd || cacheWordDtlTpCd.length === 0) {
      return cacheWordDtlTpCd;
    }
    
    return cacheWordDtlTpCd.filter(item => item.UP_CD_VAL === wordTpCd);
  }, [wordTpCd, cacheWordDtlTpCd]);
 
  // ===== 사용자 입력 검증 ===== 
  

  // ===== 데이터 초기화 =====


  // ===== Cache 선조회 (초기 한 번) =====
  useEffect(() => {
    (async () => {
      const params = ["SYS_CD", "WORD_TP_CD", "WORD_DTL_TP_CD","DATA_TYPE_CD"];
      const result = await cacheCode(params);
      setCacheWordTpCd(result.WORD_TP_CD || []);
      setCacheWordDtlTpCd(result.WORD_DTL_TP_CD || []);
      setCacheDomainSysCd(result.SYS_CD || []);
      setCacheDataTypeCd(result.DATA_TYPE_CD || []);
    })();
  }, []);


  // ===== 데이터 조회 =====
  const getDomain = async () => {
    console.log('도메인 조회=====');
    try {
      const param = { DOMAIN_NM : domainNm
                    , SYS_CD : domainSysCd
                    , WORD_TP_CD : wordTpCd
                    , WORD_DTL_TP_CD : wordDtlTpCd
                    , FROM_DATE: fromDate.replace(/-/g, "")
                    , TO_DATE: toDate.replace(/-/g, "")
                    }; // 조회 조건을 JS 객체(Map 형태)로
      const { name, table } = await http.post('/meta/getDomainList',param,{ shape: 'datatable', showSpinner: true });
      setDomains(table);
      if (table && table.length > 0) {
        setSelectedRow(table[0]); // 첫 번째 row 선택
      }
    } catch (e) {
      console.error('[도메인] 조회 실패', e);
      message.error('도메인 목록을 불러오지 못했습니다.');
    } finally {

    }
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => { getDomain(); }, []);

  // ===== Row 클릭 핸들러 =====
  const handleRowClick = (params) => {
    setSelectedRow(params.row);
    console.log("params.row.SYS_CD: [" + params.row.SYS_CD + "]")
    console.log("params.row: [" + Object.entries(params.row) + "]")
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
      message.warning('수정할 도메인을 선택해주세요.');
      return;
    }
    setModalMode('edit');
    setOpenModal(true);
  };

  const handleOpenDelete = () => {
    if (!selectedRow) {
      message.warning('삭제할 도메인을 선택해주세요.');
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
    getDomain(); // 목록 재조회
  };

  // ===== 컬럼 =====
  const domainColumns = useMemo(() => [
    { headerName: 'NO'        , headerAlign: 'center',align : 'center', field: 'ROW_NUM'         ,                     width: 80, editable: false },
    { headerName: '도메인명'        , headerAlign: 'center', field: 'DOMAIN_KOR_NM'     ,                       width: 300, editable: false },
    { headerName: '도메인영문명'    , headerAlign: 'center', field: 'DOMAIN_ENG_NM'     ,                       width: 300, editable: false },
    { headerName: '유형'    , headerAlign: 'center',align : 'center',  field: 'WORD_TP_CD'   , type:'singleSelect'  ,                       width: 120, editable: false , valueOptions: toValueOptions(cacheWordTpCd, 'CD_VAL', 'CD_VAL_NM')},
    { headerName: '소분류'    , headerAlign: 'center',align : 'center',  field: 'WORD_DTL_TP_CD', type:'singleSelect'     ,          width: 120, editable: false,valueOptions: toValueOptions(cacheWordDtlTpCd, 'CD_VAL', 'CD_VAL_NM') },
    { 
    headerName: '데이터타입', 
    headerAlign: 'center', 
    field: 'DATA_TYPE_INFO',
    width: 180, 
    align: 'center',
    // 데이터 타입 계산 함수
    valueGetter: (params) => {
      // params가 undefined일 수 있으므로 안전하게 처리
      if (!params || !params.row) return '';
      const row = params.row;
      const typeCode = row.DATA_TYPE_CD;
      const typeName = getCodeName(cacheDataTypeCd, typeCode);
      const len = row.DATA_LEN;
      const scale = row.DATA_SCALE;
      
      if (!typeName || !len) return '';
      
      if (scale != null && scale !== '' && scale !== 0) {
        return `${typeName}(${len}, ${scale})`;
      }
      
      return `${typeName}(${len})`;
    },
    // valueFormatter도 추가하여 엑셀 다운로드 시 확실하게 작동하도록
    valueFormatter: (params) => {
      // params가 undefined일 수 있으므로 안전하게 처리
      if (!params) return '';
      const { value, row } = params;
      // valueGetter가 이미 값을 계산했으면 그대로 사용
      if (value && value !== '') return value;
      // valueGetter가 작동하지 않은 경우 직접 계산
      if (!row) return '';
      const typeCode = row.DATA_TYPE_CD;
      const typeName = getCodeName(cacheDataTypeCd, typeCode);
      const len = row.DATA_LEN;
      const scale = row.DATA_SCALE;
      
      if (!typeName || !len) return '';
      
      if (scale != null && scale !== '' && scale !== 0) {
        return `${typeName}(${len}, ${scale})`;
      }
      
      return `${typeName}(${len})`;
    },
    renderCell: (params) => {
      const typeCode = params.row.DATA_TYPE_CD;
      const typeName = getCodeName(cacheDataTypeCd, typeCode);
      const len = params.row.DATA_LEN;
      const scale = params.row.DATA_SCALE;
      
      if (!typeName || !len) return '';
      
      if (scale != null && scale !== '' && scale !== 0) {
        return `${typeName}(${len}, ${scale})`;
      }
      
      return `${typeName}(${len})`;
    }
  },
  { headerName: '정의'        , headerAlign: 'center', field: 'DOMAIN_DEFN_DSC'     ,                       width: 300, editable: false , hide:true },
  { headerName: '비고'        , headerAlign: 'center', field: 'DOMAIN_NOTE'     ,                       width: 300, editable: false , hide:true },
  { headerName: '시스템', headerAlign: 'center', field: 'SYS_CD', type: 'singleSelect', width: 120, editable: true , valueOptions: toValueOptions(cacheDomainSysCd, 'CD_VAL', 'CD_VAL_NM') , align: 'center'},
  //{ headerName: '보안등급'    , headerAlign: 'center',align : 'center',  field: 'SCRTY_PLCY_CD'     ,                       width: 100, editable: true },  // 보안 정책코드
    //{ headerName: '평문길이'    , headerAlign: 'center',align : 'right',  field: 'DATA_LEN'     ,                       width: 100, editable: true },  // 길이
    //{ headerName: '개인정보대상여부'    , headerAlign: 'center',align : 'center',  field: 'PSNL_INF_TGT_YN'     ,                       width: 120, editable: true },
    // { headerName: '화면사용여부'    , headerAlign: 'center', field: ''     ,                       width: 120, editable: true }, // 테이블 칼럼 추가 필요
    //{ headerName: '업무구분'    , headerAlign: 'center',align : 'center',  field: 'BIZ_SEC_CD'     ,                       width: 120, editable: true },
    { headerName: '최종변경일시', headerAlign: 'center', field: 'LST_ADJ_DDTM',align : 'center'      ,                       width: 200, editable: true },
    
  ], [cacheWordTpCd, cacheWordDtlTpCd, cacheDataTypeCd, cacheDomainSysCd]);



  const searchButtonGroup = useMemo(() => [
    { auth: 'Init', label: 'Initialize', onClick: handleInitialize },
    { auth: 'Search', label: 'Search', onClick: getDomain },
  ], [handleInitialize, getDomain]);

  return (
    <div>
      <Stack>
        <Stack>
          <GSearchHeader
            fields={[
              {
                header: '도메인명',
                content: (
                  <TextField
                    fullWidth
                    name="text"
                    value={domainNm}
                    onChange={(e) => setDomainNm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        getDomain(); // 엔터로 조회 실행
                      }
                    }}
                    placeholder="도메인명 입력"
                  />
                ),
              },
              {
                header: '시스템',
                content: (
                  <GSelectBox 
                    items={cacheDomainSysCd}              // Item 목록 바인딩
                    valueKey="CD_VAL"               // 코드 값
                    labelKey="CD_VAL_NM"            // 코드 명
                    toplabel="A"                    // 'A' : All , 'S' : Select
                    value={domainSysCd}                 // Value변수 할당
                    onChange={(v) => setDomainSysCd(v)} // Value 할당
                  />
                ),
              },
              {
                header: '유형',
                content: (
                  <GSelectBox 
                    items={cacheWordTpCd}              // Item 목록 바인딩
                    valueKey="CD_VAL"               // 코드 값
                    labelKey="CD_VAL_NM"            // 코드 명
                    toplabel="A"                    // 'A' : All , 'S' : Select
                    value={wordTpCd}                 // Value변수 할당
                    onChange={(v) => {
                      setWordTpCd(v)
                      setWordDtlTpCd(''); // 유형 변경 시 소분류 초기화
                    }} // Value 할당
                  />
                ),
              },
              {
                header: '소분류',
                content: (
                  <GSelectBox 
                    items={filteredWordDtlTpCd}              // Item 목록 바인딩
                    valueKey="CD_VAL"               // 코드 값
                    labelKey="CD_VAL_NM"            // 코드 명
                    toplabel="A"                    // 'A' : All , 'S' : Select
                    value={wordDtlTpCd}                 // Value변수 할당
                    onChange={(v) => {
                      setWordDtlTpCd(v);
                    }}
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
              <GButton key="search" auth="Search" label="Search" onClick={getDomain} />,
            ]}
          />
        </Stack>

        {/* 상단: 도메인목록 */}
        <Stack>
          <Stack>
            <GDataGrid
              title="도메인목록"
              rows={Domains}
              columns={domainColumns}
              Buttons={[false, false, false, true]}
              columnHeaderHeight={30}
              rowHeight={25}
              height={350}
              //height="100%"
              disableRowSelectionOnClick
              onRowsChange={setDomains}        // 데이터변경사항 반영
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
                        }}>도메인명</td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '1px solid #ddd',
                          borderBottom: '1px solid #ddd',
                          width: '35%'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={selectedRow?.DOMAIN_KOR_NM || ''}
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
                        }}>도메인영문명</td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '1px solid #ddd',
                          borderBottom: '1px solid #ddd',
                          width: '35%'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={selectedRow?.DOMAIN_ENG_NM || ''}
                            InputProps={{ 
                              readOnly: true,
                              style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                            }}
                          />
                        </td>
                      </tr>

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
                        }}>시스템</td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '1px solid #ddd',
                          borderBottom: '1px solid #ddd',
                          width: '35%'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={getCodeName(cacheDomainSysCd, selectedRow?.SYS_CD) || ''}
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
                        }}>데이터타입</td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '1px solid #ddd',
                          borderBottom: '1px solid #ddd',
                          width: '35%'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={(() => {
                              const typeCode = selectedRow?.DATA_TYPE_CD;
                              const typeName = getCodeName(cacheDataTypeCd, typeCode);
                              const len = selectedRow?.DATA_LEN;
                              const scale = selectedRow?.DATA_SCALE;
                              
                              if (!typeName || !len) return '';
                              
                              if (scale != null && scale !== '' && scale !== 0) {
                                return `${typeName}(${len}, ${scale})`;
                              }
                              
                              return `${typeName}(${len})`;
                            })()}
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
                        }}>정의</td>
                        <td colSpan={3} style={{ 
                          padding: '8px 12px',
                          borderBottom: '1px solid #ddd'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={selectedRow?.DOMAIN_DEFN_DSC || ''}
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
                        }}>비고</td>
                        <td colSpan={3} style={{ 
                          padding: '8px 12px',
                          borderBottom: '1px solid #ddd'
                        }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={selectedRow?.DOMAIN_NOTE || ''}
                            InputProps={{ 
                              readOnly: true,
                              style: { fontSize: '14.8px', backgroundColor: '#f5f5f5' }
                            }}
                            multiline
                            minRows={1}
                            maxRows={1}
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
                          borderRight: '1px solid #ddd'
                        }}>최초등록일시</td>
                        <td style={{ 
                          padding: '8px 12px',
                          borderRight: '1px solid #ddd'
                        }}>
                          <TextField
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
                          <TextField
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
      </Stack>

      {/* 팝업 컴포넌트 사용 */}
      <METASDTSD02P1
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        data={selectedRow}
        cacheDomainSysCd={cacheDomainSysCd}
        cacheWordTpCd={cacheWordTpCd}
        cacheWordDtlTpCd={cacheWordDtlTpCd}
        cacheDataTypeCd={cacheDataTypeCd}
      />
    </div>
  );
}