import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';

import { http } from '@/libs/TaskHttp';

const WALLET_STATUS = /** @type {const} */ ({
  uncreated: 'uncreated',
  active: 'active',
  frozen: 'frozen',
});

function isHttpUrl(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s.startsWith('http://') || s.startsWith('https://');
}

function toExplorerHref(walletAddress) {
  if (!walletAddress) return null;
  const s = String(walletAddress).trim();

  // SSOT에는 explorer base가 명시되어 있지 않아서:
  // 1) API가 URL을 주면 그대로 사용
  // 2) 주소만 주면 env로 베이스를 받도록 하고, 없으면 etherscan 기본값(초안)
  if (isHttpUrl(s)) return s;

  const base = (import.meta?.env?.VITE_EXPLORER_ADDRESS_URL || '').trim();
  if (base) {
    return base.includes('{address}')
      ? base.replace('{address}', encodeURIComponent(s))
      : `${base.replace(/\/$/, '')}/${encodeURIComponent(s)}`;
  }

  // fallback (draft)
  return `https://etherscan.io/address/${encodeURIComponent(s)}`;
}

function shortAddr(v) {
  if (!v) return '';
  const s = String(v);
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function statusChipProps(status) {
  const s = String(status || '').toLowerCase();
  if (s === WALLET_STATUS.active) return { label: '활성', color: 'success' };
  if (s === WALLET_STATUS.frozen) return { label: '동결', color: 'warning' };
  return { label: '미생성', color: 'default' };
}

export default function IWONCOIN02S1() {
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(null);

  const [items, setItems] = useState([]);
  const [selectedRid, setSelectedRid] = useState([]);

  // 검색조건(SSOT: docs/design/api/web-admin.md ListEmployeesRequest)
  const [keyword, setKeyword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [walletStatus, setWalletStatus] = useState('');
  const [onlyUncreated, setOnlyUncreated] = useState(false);

  // paging (SSOT에 있으나 total이 없어 초안에선 최소만)
  const [page] = useState(1);
  const [size] = useState(100);

  // SSOT: docs/design/api/web-admin.md (webWallet.*)
  // 화면 컴포넌트 내부에 API를 두는 패턴으로 인라인 구성
  const webWallet_listEmployees = useCallback(async (params = {}) => {
    return await http.get('/admin/employees', { params, showSpinner: true });
  }, []);

  const webWallet_createWallets = useCallback(async (employeeIds = []) => {
    return await http.post(
      '/admin/wallets/create',
      { employeeIds },
      { showSpinner: true },
    );
  }, []);

  const kpi = useMemo(() => {
    const total = items.length;
    const uncreatedCount = items.filter((r) => String(r?.walletStatus).toLowerCase() === WALLET_STATUS.uncreated).length;
    const createdCount = total - uncreatedCount;
    return { total, createdCount, uncreatedCount };
  }, [items]);

  const selectedEmployeeIds = useMemo(() => {
    if (!selectedRid?.length) return [];
    const idSet = new Set(selectedRid);
    return items
      .filter((r) => idSet.has(r?.__rid))
      .map((r) => r?.employeeId)
      .filter(Boolean);
  }, [items, selectedRid]);

  const load = useCallback(async (nextQuery) => {
    setLoading(true);
    setWarning(null);

    try {
      const res = await webWallet_listEmployees(nextQuery);

      // 응답형은 SSOT: EmployeeWalletListResponse { items, nextCursor }
      // 백엔드가 바로 배열을 주는 케이스도 대비
      const list = Array.isArray(res)
        ? res
        : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.table) ? res.table : []));

      setItems(list);
      setSelectedRid([]);
    } catch (e) {
      const msg = String(e?.message || e || '');
      if (msg.includes('WALLET_NOT_FOUND')) {
        setWarning('지갑 미생성자만 보기로 전환합니다.');
        setOnlyUncreated(true);
        setWalletStatus(WALLET_STATUS.uncreated);
      }
    } finally {
      setLoading(false);
    }
  }, [webWallet_listEmployees]);

  const buildQuery = useCallback(() => {
    const qs = {
      page,
      size,
    };

    if (keyword?.trim()) qs.keyword = keyword.trim();
    if (name?.trim()) qs.name = name.trim();
    if (department?.trim()) qs.department = department.trim();
    // UI SSOT에는 재직 상태 필터가 있으나 API SSOT에는 파라미터가 명시되어 있지 않아
    // 백엔드가 허용하는 경우에만 사용되는 확장 파라미터로 유지합니다.
    if (employmentStatus) qs.employmentStatus = employmentStatus;
    if (walletStatus) qs.walletStatus = walletStatus;

    return qs;
  }, [department, employmentStatus, keyword, name, page, size, walletStatus]);

  const handleSearch = useCallback(async () => {
    await load(buildQuery());
  }, [buildQuery, load]);

  const handleInitialize = useCallback(() => {
    setKeyword('');
    setName('');
    setDepartment('');
    setEmploymentStatus('');
    setWalletStatus('');
    setOnlyUncreated(false);
    setWarning(null);
    setSelectedRid([]);
  }, []);

  useEffect(() => {
    // 최초 진입: SSOT 플로우에 따라 목록 조회
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // UI: "지갑 미생성자만 보기"는 walletStatus='uncreated'와 동기
  useEffect(() => {
    if (onlyUncreated) {
      setWalletStatus(WALLET_STATUS.uncreated);
    } else if (walletStatus === WALLET_STATUS.uncreated) {
      setWalletStatus('');
    }
  }, [onlyUncreated]); // eslint-disable-line react-hooks/exhaustive-deps

  // SSOT: 필터 변경 시 동일 API 재호출 (초안에서는 walletStatus/미생성 토글에 한해 즉시 반영)
  useEffect(() => {
    // 최초 로드 직후 불필요한 2회 호출을 피하려고 loading 상태일 때는 스킵
    if (loading) return;
    load(buildQuery());
  }, [walletStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo(() => {
    return [
      { field: 'employeeId', headerName: '사번', width: 130 },
      { field: 'name', headerName: '성명', width: 140 },
      { field: 'department', headerName: '부서', width: 180 },
      { field: 'position', headerName: '직급', width: 140 },
      {
        field: 'walletAddress',
        headerName: '지갑 주소',
        flex: 1,
        minWidth: 260,
        renderCell: (params) => {
          const addr = params?.value;
          if (!addr) return <span style={{ opacity: 0.65 }}>-</span>;

          const href = toExplorerHref(addr);

          return (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={String(addr)}
              >
                {shortAddr(addr)}
              </Typography>

              {href && (
                <Button
                  size="small"
                  variant="text"
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    window.open(href, '_blank', 'noopener,noreferrer');
                  }}
                  endIcon={<OpenInNewIcon fontSize="small" />}
                >
                  Explorer
                </Button>
              )}
            </Stack>
          );
        },
      },
      {
        field: 'walletStatus',
        headerName: '지갑 상태',
        width: 140,
        renderCell: (params) => {
          const { label, color } = statusChipProps(params?.value);
          return <Chip size="small" label={label} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
        },
      },
    ];
  }, []);

  const handleCreateWallets = useCallback(async () => {
    if (selectedEmployeeIds.length === 0) {
      await GMessageBox.ShowEx({
        title: '지갑 생성',
        message: '선택된 사번이 없습니다. 목록에서 직원을 선택하세요.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    const confirm = await GMessageBox.ShowEx({
      title: '지갑 생성',
      message: `선택한 ${selectedEmployeeIds.length}명에 대해 지갑을 생성할까요?`,
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '생성', no: '취소' },
    });

    if (confirm !== 'yes') return;

    const res = await webWallet_createWallets(selectedEmployeeIds);

    const requestedCount = res?.requestedCount ?? selectedEmployeeIds.length;
    const createdCount = res?.createdCount ?? 0;
    const failed = Array.isArray(res?.failedEmployeeIds) ? res.failedEmployeeIds : [];

    const message = [
      `요청: ${requestedCount}명`,
      `성공: ${createdCount}명`,
      failed.length ? `실패: ${failed.length}명` : null,
      failed.length ? `실패 사번: ${failed.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    await GMessageBox.ShowEx({
      title: '지갑 생성 결과',
      message,
      type: failed.length ? 'warning' : 'success',
      buttons: 'Ok',
    });

    await handleSearch();
  }, [handleSearch, selectedEmployeeIds]);

  const handleBackupKey = useCallback(async () => {
    await GMessageBox.ShowEx({
      title: '개인키 백업',
      message: 'SSOT에 따라 Approver 전용 기능이며, API 연동은 TBD 입니다.',
      type: 'info',
      buttons: 'Ok',
    });
  }, []);

  return (
    <GPageContainer>
      {warning && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {warning}
        </Alert>
      )}

      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '통합검색',
              content: (
                <TextField
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="사번/이메일 등"
                  fullWidth
                  size="small"
                />
              ),
            },
            {
              header: '이름',
              content: (
                <TextField
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="부분일치"
                  fullWidth
                  size="small"
                />
              ),
            },
            {
              header: '부서',
              content: (
                <TextField
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="부서명"
                  fullWidth
                  size="small"
                />
              ),
            },
            {
              header: '재직상태',
              content: (
                <TextField
                  select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="active">재직</MenuItem>
                  <MenuItem value="inactive">퇴사</MenuItem>
                </TextField>
              ),
            },
            {
              header: '미생성만',
              content: (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Switch
                    checked={onlyUncreated}
                    onChange={(e) => setOnlyUncreated(e.target.checked)}
                    size="small"
                  />
                  <Typography variant="body2">지갑 미생성자만 보기</Typography>
                </Stack>
              ),
            },
          ]}
          buttons={[
            <Button key="init" variant="outlined" onClick={handleInitialize}>
              초기화
            </Button>,
            <Button key="search" variant="contained" onClick={handleSearch}>
              조회
            </Button>,
          ]}
        />

        <Box sx={{ px: 1, pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
              지갑 상태
            </Typography>

            <Chip
              label="전체"
              variant={walletStatus ? 'outlined' : 'filled'}
              color={walletStatus ? 'default' : 'primary'}
              size="small"
              onClick={() => {
                setOnlyUncreated(false);
                setWalletStatus('');
              }}
            />
            <Chip
              label="미생성"
              variant={walletStatus === WALLET_STATUS.uncreated ? 'filled' : 'outlined'}
              color={walletStatus === WALLET_STATUS.uncreated ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setOnlyUncreated(true);
                setWalletStatus(WALLET_STATUS.uncreated);
              }}
            />
            <Chip
              label="활성"
              variant={walletStatus === WALLET_STATUS.active ? 'filled' : 'outlined'}
              color={walletStatus === WALLET_STATUS.active ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setOnlyUncreated(false);
                setWalletStatus(WALLET_STATUS.active);
              }}
            />
            <Chip
              label="동결"
              variant={walletStatus === WALLET_STATUS.frozen ? 'filled' : 'outlined'}
              color={walletStatus === WALLET_STATUS.frozen ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setOnlyUncreated(false);
                setWalletStatus(WALLET_STATUS.frozen);
              }}
            />
          </Stack>
        </Box>
      </GSearchSection>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 220 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">전체 직원 수</Typography>
            <Typography variant="h6" fontWeight={800}>{kpi.total.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 220 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">지갑 생성 완료 수</Typography>
            <Typography variant="h6" fontWeight={800}>{kpi.createdCount.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 220 }}>
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">미생성 수</Typography>
            <Typography variant="h6" fontWeight={800}>{kpi.uncreatedCount.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <GDataGrid
          title="임직원 지갑 목록"
          rows={items}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(m) => {
            const ids = Array.isArray(m)
              ? m
              : (m?.ids instanceof Set ? Array.from(m.ids) : []);

            setSelectedRid(ids);
          }}
          sx={{ flex: 1 }}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            선택: {selectedEmployeeIds.length.toLocaleString()}명
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handleCreateWallets}
              auth="SAVE|CREATE"
            >
              지갑 생성
            </Button>
            <Button
              variant="outlined"
              onClick={handleBackupKey}
              auth="APPROVE"
            >
              개인키 백업
            </Button>
          </Stack>
        </Box>
      </Box>
    </GPageContainer>
  );
}
