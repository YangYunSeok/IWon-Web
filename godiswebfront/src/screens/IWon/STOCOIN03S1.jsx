import React, { useMemo, useState } from 'react';
import { TextField } from '@mui/material';

import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GSearchHeader from '@/components/GSearchHeader';
import GContentBox from '@/components/GContentBox';
import GDataGrid from '@/components/GDataGrid';
import GDetailTitle from '@/components/GDetailTitle';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GButtonGroup from '@/components/GButtonGroup';
import GButton from '@/components/GButton';

export default function STOCOIN03S1() {
  const [searchParams, setSearchParams] = useState({ keyword: '' });
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const columns = useMemo(
    () => [
      { headerName: '직원ID', headerAlign: 'center', field: 'employeeId', width: 140, align: 'left' },
      { headerName: '지갑주소', headerAlign: 'center', field: 'walletAddress', flex: 1, align: 'left' },
      { headerName: '잔액', headerAlign: 'center', field: 'balance', width: 120, align: 'right' },
      { headerName: '상태', headerAlign: 'center', field: 'status', width: 120, align: 'center' },
    ],
    []
  );

  const handleInitialize = () => {
    setSearchParams({ keyword: '' });
    setSelectedRow(null);
  };

  const handleSearch = async () => {
    // TODO: Backend/API 연동 확정 시 조회 로직 구현
    // 현재는 화면 골격(SSOT 레이아웃)만 제공합니다.
    console.log('Search triggered with params:', searchParams);
  };

  return (
    <GPageContainer>
      {/* 1) 조회 영역 */}
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '검색어',
              content: (
                <TextField
                  fullWidth
                  value={searchParams.keyword}
                  onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="직원ID/지갑주소 등"
                />
              ),
            },
            {},
            {},
            {},
          ]}
          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />,
          ]}
        />
      </GSearchSection>

      {/* 2) 그리드 영역 */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid
          title="Employee Wallet"
          rows={rows}
          columns={columns}
          height={345}
          pagination={true}
          pageSizeOptions={[50, 100]}
          disableRowSelectionOnClick
          onRowsChange={setRows}
          onRowClick={(params) => setSelectedRow(params.row)}
        />
      </GContentBox>

      {/* 3) 상세 영역 */}
      <GContentBox flex={true}>
        <GDetailTitle title="상세 정보" />
        <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
          <GLayoutItem label="직원ID">
            <TextField fullWidth value={selectedRow?.employeeId ?? ''} inputProps={{ readOnly: true }} />
          </GLayoutItem>
          <GLayoutItem label="지갑주소">
            <TextField fullWidth value={selectedRow?.walletAddress ?? ''} inputProps={{ readOnly: true }} />
          </GLayoutItem>
          <GLayoutItem label="잔액">
            <TextField fullWidth value={selectedRow?.balance ?? ''} inputProps={{ readOnly: true }} />
          </GLayoutItem>
          <GLayoutItem label="상태">
            <TextField fullWidth value={selectedRow?.status ?? ''} inputProps={{ readOnly: true }} />
          </GLayoutItem>
        </GLayoutGroup>

        <GButtonGroup>
          <GButton
            auth="Save"
            label="Save"
            onClick={() => {
              // TODO: 상세 저장 로직(Backend/API 연동 확정 시) 구현
              console.log('Save clicked', selectedRow);
            }}
          />
        </GButtonGroup>
      </GContentBox>
    </GPageContainer>
  );
}
