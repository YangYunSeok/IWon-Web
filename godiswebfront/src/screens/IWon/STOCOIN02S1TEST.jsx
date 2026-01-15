import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import GSearchHeader from '@/components/GSearchHeader';
import GDataGrid from '@/components/GDataGrid';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GButton from '@/components/GButton';
import GTextField from '@/components/GTextField';
import GSelectBox from '@/components/GSelectBox';
import GTitleIcon from '@/components/GTitleIcon';
import GMessageBox from '@/components/GMessageBox';
import { http } from '@/libs/TaskHttp';

/**
 * [STOCOIN02S1] IWon 코인 지급 및 전송 관리
 * - 기능: 직원 목록 조회, 관리자 지갑 잔액 확인, 코인 지급(Transfer)
 * - 연동: CoinService.sendCoin() via Backend API
 */
export default function STOCOIN02S1() {
  // ==============================================================
  //                        상태 변수 정의
  // ==============================================================

  // 1. 검색 조건 상태
  const [searchParams, setSearchParams] = useState({
    empNm: '',
    deptNm: ''
  });

  // 2. 관리자 지갑 정보 (헤더 표시용)
  const [adminWallet, setAdminWallet] = useState({
    address: 'Loading...', // 0xb954... (CoinService 참조)
    balance: '0',
    network: 'Sepolia (Testnet)'
  });

  // 3. 직원 그리드 데이터
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // 4. 지급(Transfer) 폼 데이터
  const [transferForm, setTransferForm] = useState({
    targetAddress: '',
    targetName: '',
    amount: '',
    reason: 'INCENTIVE', // 기본값: 성과급
    coin: 'WELFARE'  // 기본값: 복지코인
  });

  // 지급 사유 공통코드
  const coinOptions = [
    { CD_VAL: 'WELFARE', CD_VAL_NM: '복지코인' },
    { CD_VAL: 'pay', CD_VAL_NM: '결제코인' }
  ];

  // 지급 사유 공통코드
  const reasonOptions = [
    { CD_VAL: 'INCENTIVE', CD_VAL_NM: '성과급 지급' },
    { CD_VAL: 'WELFARE', CD_VAL_NM: '복지 포인트' },
    { CD_VAL: 'MEAL', CD_VAL_NM: '식대 지원' },
    { CD_VAL: 'ETC', CD_VAL_NM: '기타' }
  ];

  // ==============================================================
  //                        초기화 및 조회
  // ==============================================================

  useEffect(() => {
    loadAdminInfo();
    handleSearch();
  }, []);

  /**
   * 관리자 지갑 정보 및 잔액 조회
   */
  const loadAdminInfo = async () => {
    try {
      // 실제 서비스 호출
      const res = await http.post('/coin/getAdminWalletInfo', null, { showSpinner: true });
      if (res) {
        setAdminWallet({
          address: res.address,
          balance: res.balance,
          network: 'Sepolia (Testnet)'
        });
      }
    } catch (error) {
      console.error('관리자 지갑 정보 로드 실패:', error);
    }
  };

  /**
   * 직원 목록 조회
   */
  const handleSearch = async () => {
    try {
      // 1. 파라미터 구성
      const query = `?empNm=${encodeURIComponent(searchParams.empNm)}&deptNm=${encodeURIComponent(searchParams.deptNm)}`;

      // 2. API 호출
      // 백엔드는 List<Map> 형태의 배열(Array)을 반환합니다.
      const res = await http.get(`/coin/getEmployeeList${query}`);

      // 3. 데이터 바인딩 (핵심!)
      // res 자체가 배열이거나, 데이터가 없을 경우 빈 배열 처리
      if (Array.isArray(res)) {
        // 각 행에 고유 id가 필요하므로 map으로 처리 (선택사항, 그리드 키 설정에 따라 다름)
        const rowsWithId = res.map((row, index) => ({
          id: row.EMP_NO || index, // id 필드 추가 (DataGrid용)
          ...row
        }));
        setEmployeeList(rowsWithId);
      } else {
        setEmployeeList([]); // 데이터가 없거나 형식이 다를 때 빈 배열
      }

      // 4. 상태 초기화 (기존 로직 유지)
      setSelectedEmp(null);
      setTransferForm({ targetAddress: '', targetName: '', amount: '', reason: 'INCENTIVE' });

    } catch (error) {
      console.error('직원 목록 조회 실패:', error);
      GMessageBox.Show('데이터 조회 중 오류가 발생했습니다.', 'Ok');
      setEmployeeList([]); // 에러 시에도 목록 초기화
    }
  };

  /** 
   * 전체 잔액 동기화 버튼 클릭 
   */
  const handleSync = async () => {
    const isConfirmed = await GMessageBox.ShowEx({
      title: '잔액 동기화',
      message: '모든 직원의 잔액을 블록체인 최신값으로 업데이트하시겠습니까?\n(직원 수에 따라 시간이 소요될 수 있습니다.)',
      buttons: 'YesNo',
      type: 'question'
    });

    if (isConfirmed !== 'yes') return;

    try {
      // API 호출 (syncBalances)
      const res = await http.post('/coin/syncBalances', null, { showSpinner: true });

      if (res.status === 'success') {
        await GMessageBox.Show(res.message, 'Ok', '동기화 완료');
        handleSearch(); // 동기화가 끝났으니 목록을 새로고침해서 최신 DB값을 보여줌
      } else {
        await GMessageBox.Show(res.message, 'Ok', '오류');
      }

    } catch (error) {
      console.error('동기화 실패:', error);
      await GMessageBox.Show('동기화 중 오류가 발생했습니다.', 'Ok', '오류');
    }
  };

  // ==============================================================
  //                        이벤트 핸들러
  // ==============================================================

  /** 검색 조건 변경 */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  /** 그리드 행 클릭 (직원 선택) */
  const handleRowClick = (params) => {
    const row = params.row;
    setSelectedEmp(row);

    // 우측 폼에 데이터 바인딩
    setTransferForm(prev => ({
      ...prev,
      targetAddress: row.WALLET_ADDR,
      targetName: row.EMP_NM,
      amount: '' // 금액은 초기화
    }));
  };

  /** 지급 폼 입력 변경 */
  const handleFormChange = (field, value) => {
    setTransferForm(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 코인 전송 (핵심 로직)
   * CoinService.sendCoin() 호출
   */
  const handleTransfer = async () => {
    // 1. 유효성 검증
    if (!selectedEmp || !transferForm.targetAddress) {
      await GMessageBox.Show('지급할 직원을 선택해주세요.', 'Ok');
      return;
    }
    if (!transferForm.amount || isNaN(transferForm.amount) || Number(transferForm.amount) <= 0) {
      await GMessageBox.Show('유효한 지급 수량을 입력해주세요.', 'Ok');
      return;
    }
    if (Number(transferForm.amount) > Number(adminWallet.balance)) {
      await GMessageBox.Show('관리자 지갑의 잔액이 부족합니다.', 'Ok');
      return;
    }

    // 2. 확인 팝업
    const confirmMsg = `${transferForm.targetName}님에게 ${transferForm.amount} IWC을 지급하시겠습니까?\n(사유: ${reasonOptions.find(r => r.CD_VAL === transferForm.reason)?.CD_VAL_NM})`;
    // const isConfirmed = await GMessageBox.Show(confirmMsg, 'YesNo');
    const isConfirmed = await GMessageBox.ShowEx({
      title: '코인 전송',
      message: confirmMsg,
      buttons: 'YesNo',
      type: 'question'
    });

    if (isConfirmed !== 'yes') return;

    // 3. API 호출
    try {
      const payload = {
        toAddress: transferForm.targetAddress,
        amount: transferForm.amount,
        reasonCd: transferForm.reason || 'INCENTIVE',
        empNo: selectedEmp ? selectedEmp.EMP_NO : ''
      };

      // 타임아웃 걱정 없이 호출 (백엔드가 즉시 응답함)
      const res = await http.post('/coin/transfer', payload, { showSpinner: true });

      // 성공 처리
      if (res.status === 'success') {
        await GMessageBox.ShowEx({
          title: '요청 완료',
          message: res.message, // "전송 요청이 접수되었습니다..."
          buttons: 'Ok',
          type: 'info'
        });

        // 폼 초기화
        setTransferForm({ targetAddress: '', targetName: '', amount: '', reason: 'INCENTIVE' });
        setSelectedEmp(null);

        // 목록 동기화 후 재조회
        handleSearch();

      } else {
        await GMessageBox.Show(res.message, 'Ok');
      }

    } catch (error) {
      console.error('코인 전송 실패:', error);
      await GMessageBox.ShowEx({
        title: '에러 발생',
        message: '전송 요청 중 오류가 발생했습니다.',
        buttons: 'Ok',
        type: 'error'
      });
    }
  };

  // ==============================================================
  //                        컬럼 정의
  // ==============================================================

  const columns = [
    { field: 'EMP_NO', headerName: '사번', width: 100, align: 'center', headerAlign: 'center' },
    { field: 'EMP_NM', headerName: '성명', width: 80, align: 'center', headerAlign: 'center' },
    { field: 'DEPT_NM', headerName: '부서', width: 150, align: 'center', headerAlign: 'center' },
    { field: 'WALLET_ADDR', headerName: '지갑주소', flex: 1, align: 'left', headerAlign: 'center' },
    {
      field: 'COIN_BAL',
      headerName: '현재 보유량',
      width: 100,
      align: 'right',
      headerAlign: 'center',
      renderCell: (params) => (
        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
          {Number(params.value).toLocaleString()}
        </span>
      )
    },
  ];

  // ==============================================================
  //                        화면 UI
  // ==============================================================

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)', // 전체 높이 제한
      p: 1,
      gap: 1
    }}>

      {/* 1. 상단: 검색 조건 및 관리자 지갑 상태 */}
      <Box sx={{
        display: 'flex',
        gap: 1,
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        {/* 검색 헤더 */}
        <Box sx={{ flex: 1 }}>
          <GSearchHeader
            fields={[
              {
                header: '사원명',
                content: (
                  <GTextField
                    name="empNm"
                    value={searchParams.empNm}
                    onChange={handleFilterChange}
                    placeholder="사원명 입력"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                )
              },
              {
                header: '부서명',
                content: (
                  <GTextField
                    name="deptNm"
                    value={searchParams.deptNm}
                    onChange={handleFilterChange}
                    placeholder="부서명 입력"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                )
              },
              {}, {}
            ]}

            buttons={[
              <GButton key="sync" label="잔액 동기화" onClick={handleSync} color="secondary" />,
              <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />
            ]}
          />

        </Box>

      </Box>

      {/* 2. 메인 컨텐츠: 그리드 및 상세 폼 */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        gap: 2,
        minHeight: 0, // Flex item 내부 스크롤을 위해 필수
        // [핵심] 화면이 중간(md) 사이즈 이상일 때만 가로 배치, 작으면 세로 배치
        flexDirection: { xs: 'column', md: 'row' }
      }}>

        {/* 좌측: 직원 목록 그리드 */}
        <Box sx={{
          // [핵심] 가로 배치일 때는 6 비율, 세로 배치일 때는 높이 자동 조절
          flex: { xs: 'none', md: 6 },
          height: { xs: '400px', md: 'auto' }, // 모바일에서는 높이 고정
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // 그리드가 영역 밖으로 튀어나가지 않게 방지
        }}>

          <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
            <GDataGrid
              title={`직원 목록 (${employeeList.length})`}
              showTitle={true}
              rows={employeeList}
              columns={columns}
              onRowClick={handleRowClick}
              checkboxSelection={false}
              disableRowSelectionOnClick={false}
              hideFooter={false}
              pageSize={20}
              // 그리드 자체의 스크롤을 유도하기 위해 style 추가
              style={{ height: '100%', width: '100%' }}
            />
          </Box>
        </Box>

        {/* [우측] 상하 분할 레이아웃 */}
        <Box sx={{
          flex: { xs: 'none', md: 4 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1 // 상하 박스 간격
        }}>

          {/* (1) 우측 상단: 관리자 지갑 정보 카드 */}
          <Box sx={{
            bgcolor: '#fff',
            border: '1px solid #e0e0e0', // 그리드 헤더 색상과 비슷하게
            borderRadius: '4px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '100px', // 적당한 높이 확보
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">관리자 계좌 잔고</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
                  <Typography variant="h5" fontWeight="bold" color="#1976d2">
                    {Number(adminWallet.balance).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="textSecondary">IWC</Typography>
                </Box>
              </Box>
              <GButton label="Refresh" auth="Search" onClick={loadAdminInfo} iconOnly size="small" />
            </Box>
            <Typography variant="caption" color="#9e9e9e" sx={{ mt: 1, fontFamily: 'monospace' }}>
              {adminWallet.address}
            </Typography>
          </Box>

          {/* (2) 우측 하단: 지급 처리 폼 (남은 높이 채움) */}
          <Box sx={{
            flex: 1, // 남은 공간 모두 사용
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#fff',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
            p: 2,
            minHeight: '300px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
              <GTitleIcon />
              <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>코인 지급 처리 (Transfer)</Typography>
            </Box>

            <GLayoutGroup itemBorder="1px solid #f0f0f0" labelWidth={100}>
              <GLayoutItem label="수신자 성명">
                <GTextField value={transferForm.targetName} isReadOnly={true} placeholder="좌측 목록에서 선택" />
              </GLayoutItem>
              <GLayoutItem label="지갑 주소">
                <GTextField value={transferForm.targetAddress} isReadOnly={true} placeholder="0x..." />
              </GLayoutItem>

              <Box sx={{ my: 2, height: '1px', bgcolor: '#eee' }} />

              <GLayoutItem label="코인 종류" required>
                <GSelectBox
                  items={coinOptions}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  value={transferForm.reason}
                  fieldName="reason"
                  onFieldChange={handleFormChange}
                />
              </GLayoutItem>

              <GLayoutItem label="지급 사유" required>
                <GSelectBox
                  items={reasonOptions}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  value={transferForm.reason}
                  fieldName="reason"
                  onFieldChange={handleFormChange}
                />
              </GLayoutItem>

              <GLayoutItem label="지급 수량" required>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                  <GTextField
                    value={transferForm.amount}
                    fieldName="amount"

                    /* 입력된 값에서 숫자가 아닌 문자는 즉시 지워버림 */
                    onFieldChange={(name, value) => {
                      // 정수만 허용할 경우: /[^0-9]/g
                      // 소수점도 허용할 경우: /[^0-9.]/g 
                      const sanitizedValue = String(value).replace(/[^0-9.]/g, '');

                      // 소수점이 여러 개 찍히는 것 방지
                      const parts = sanitizedValue.split('.');
                      const result = parts.length > 2
                        ? parts[0] + '.' + parts.slice(1).join('')
                        : sanitizedValue;

                      handleFormChange(name, result);
                    }}

                    placeholder="수량 입력"
                    type="number" // 모바일에서 숫자 키패드 뜨게 유지
                    sx={{ flex: 1 }}

                    /* 키보드 누를 때 아예 입력 차단 (한글, e, +, - 등) */
                    onKeyDown={(e) => {
                      // 백스페이스, 탭, 화살표, Delete 등은 허용
                      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', '.'];
                      if (
                        !allowedKeys.includes(e.key) &&
                        !/^[0-9]$/.test(e.key) &&
                        !e.ctrlKey && // 복사/붙여넣기 허용
                        !e.metaKey    // 맥 커맨드 키 허용
                      ) {
                        e.preventDefault();
                      }

                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>IWC</Typography>
                </Box>
              </GLayoutItem>
            </GLayoutGroup>

            <Box sx={{ mt: 'auto', pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <GButton
                label="코인 전송 (Transfer)"
                auth="Save"
                onClick={handleTransfer}
                disabled={!selectedEmp}
                style={{ width: '100%', height: '40px', fontSize: '14px', fontWeight: 'bold' }}
              />
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: '4px', fontSize: '12px', color: '#e65100' }}>
              ※ 코인 전송은 블록체인 네트워크 상황에 따라 즉각 반영이 되지 않을 수 있습니다.<br />
              ※ 전송 후 취소가 불가능하므로 수량과 대상을 정확히 확인해주세요.
            </Box>
          </Box>

        </Box>

      </Box>
    </Box>
  );
}