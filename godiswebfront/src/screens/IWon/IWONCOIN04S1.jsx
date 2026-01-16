import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Chip, Link, Typography } from '@mui/material';
import dayjs from 'dayjs';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GButton from '@/components/GButton.jsx';
import GDateRangePicker from '@/components/GDateRangePicker.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GTextField from '@/components/GTextField.jsx';

import { http } from '@/libs/TaskHttp';

const TX_TYPE_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'mint', CD_VAL_NM: 'Mint' },
  { CD_VAL: 'burn', CD_VAL_NM: 'Burn' },
  { CD_VAL: 'transfer', CD_VAL_NM: 'Transfer' },
];

const COIN_TYPE_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'welfare', CD_VAL_NM: '복지' },
  { CD_VAL: 'payment', CD_VAL_NM: '결제' },
];

function isHttpUrl(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s.startsWith('http://') || s.startsWith('https://');
}

function toTxExplorerHref(txHash) {
  if (!txHash) return null;
  const s = String(txHash).trim();
  if (!s) return null;

  if (isHttpUrl(s)) return s;

  // SSOT에는 explorer base가 명시되어 있지 않아서:
  // 1) env로 tx URL을 받으면 사용
  // 2) 없으면 etherscan 기본값(초안)
  const base = (import.meta?.env?.VITE_EXPLORER_TX_URL || '').trim();
  if (base) {
    return base.includes('{txHash}')
      ? base.replace('{txHash}', encodeURIComponent(s))
      : `${base.replace(/\/$/, '')}/${encodeURIComponent(s)}`;
  }

  return `https://etherscan.io/tx/${encodeURIComponent(s)}`;
}

function formatAmount(v) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function statusChipProps(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return { label: 'success', color: 'success' };
  if (s === 'failed') return { label: 'failed', color: 'error' };
  if (s === 'pending') return { label: 'pending', color: 'warning' };
  return { label: s || '-', color: 'default' };
}

export default function IWONCOIN04S1() {
  // SSOT: 기본 최근 30일
  const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const defaultFrom = useMemo(() => dayjs().subtract(29, 'day').format('YYYY-MM-DD'), []);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);

  const [type, setType] = useState('');
  const [coinType, setCoinType] = useState('');
  const [keyword, setKeyword] = useState('');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // MUI DataGrid server paging
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 100 });

  const webTxHistory_list = useCallback(async (params = {}) => {
    return await http.get('/admin/transactions', { params, showSpinner: true });
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await webTxHistory_list({
        from: fromDate || undefined,
        to: toDate || undefined,
        type: type || undefined,
        coinType: coinType || undefined,
        keyword: keyword?.trim() || undefined,
        page: (paginationModel.page ?? 0) + 1,
        size: paginationModel.pageSize ?? 100,
      });

      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems(nextItems);
      setTotal(Number(res?.total ?? nextItems.length ?? 0));
    } catch (e) {
      setItems([]);
      setTotal(0);
      await GMessageBox.ShowEx({
        title: '거래 이력 조회',
        message: String(e?.message || e || '거래 이력 조회에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    } finally {
      setLoading(false);
    }
  }, [coinType, fromDate, keyword, paginationModel.page, paginationModel.pageSize, toDate, type, webTxHistory_list]);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize]);

  const handleSearch = useCallback(async () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    // page reset 후 즉시 호출(동일 tick에서 page가 안 바뀌면 useEffect가 안 탈 수 있어 직접 호출)
    await loadList();
  }, [loadList]);

  const handleInitialize = useCallback(() => {
    setFromDate(defaultFrom);
    setToDate(today);
    setType('');
    setCoinType('');
    setKeyword('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, [defaultFrom, today]);

  const columns = useMemo(() => {
    return [
      {
        field: 'txHash',
        headerName: 'Tx Hash',
        width: 220,
        headerAlign: 'center',
        align: 'left',
        renderCell: (params) => {
          const txHash = params?.value;
          const href = toTxExplorerHref(txHash);
          if (!txHash) return <span>-</span>;
          if (!href) return <span>{String(txHash)}</span>;
          return (
            <Link href={href} target="_blank" rel="noreferrer" underline="hover">
              {String(txHash)}
            </Link>
          );
        },
      },
      {
        field: 'createdAt',
        headerName: '일시',
        width: 170,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'type',
        headerName: '유형',
        width: 110,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'coinType',
        headerName: '코인',
        width: 110,
        headerAlign: 'center',
        align: 'center',
        valueFormatter: ({ value }) => (value == null || value === '' ? '-' : String(value)),
      },
      {
        field: 'amount',
        headerName: '금액',
        width: 120,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: ({ value }) => formatAmount(value),
      },
      {
        field: 'status',
        headerName: '상태',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const p = statusChipProps(params?.value);
          return <Chip size="small" variant="outlined" {...p} />;
        },
      },
      {
        field: 'txId',
        headerName: 'Tx ID',
        flex: 1,
        minWidth: 220,
        headerAlign: 'center',
        align: 'left',
      },
    ];
  }, []);

  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '기간',
              content: (
                <GDateRangePicker
                  value={[fromDate, toDate]}
                  onChange={(dates) => {
                    setFromDate(dates?.[0] || '');
                    setToDate(dates?.[1] || '');
                  }}
                />
              ),
            },
            {
              header: '유형',
              content: (
                <GSelectBox
                  items={TX_TYPE_OPTIONS}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={type}
                  onChange={(v) => setType(v)}
                />
              ),
            },
            {
              header: '코인 타입',
              content: (
                <GSelectBox
                  items={COIN_TYPE_OPTIONS}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={coinType}
                  onChange={(v) => setCoinType(v)}
                />
              ),
            },
            {
              header: '통합 검색',
              content: (
                <GTextField
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="사번/이름/TxHash"
                />
              ),
            },
          ]}
          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />,
          ]}
        />
      </GSearchSection>

      <Box sx={{ px: 1, pb: 1 }}>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          총 {Number(total || 0).toLocaleString()}건
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
        <GDataGrid
          title="거래 이력"
          rows={items}
          columns={columns}
          Buttons={{ add: false, delete: false, revert: false, excel: true }}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={total}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          pageSizeOptions={[50, 100, 200]}
          columnHeaderHeight={30}
          rowHeight={25}
        />
      </Box>
    </GPageContainer>
  );
}
