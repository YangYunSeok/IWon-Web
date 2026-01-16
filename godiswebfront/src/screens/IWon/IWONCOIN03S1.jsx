import React, { useCallback, useMemo, useState } from 'react';
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import { http } from '@/libs/TaskHttp';

const COIN_TYPE = /** @type {const} */ ({
  welfare: 'welfare',
  payment: 'payment',
});

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmployeeIds(text) {
  if (!text) return [];
  return String(text)
    .split(/[\s,;]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function IWONCOIN03S1() {
  const [tab, setTab] = useState('mint');
  const [warning, setWarning] = useState(null);

  const [loading, setLoading] = useState(false);

  // 대상 선택(SSOT: 조직도/검색은 TBD → 최소 구현으로 임직원 목록 API 기반 검색/선택 제공)
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [employeeIds, setEmployeeIds] = useState([]); // 최종 요청 대상 사번 목록

  // /admin/employees 검색
  const [items, setItems] = useState([]);
  const [selectedRid, setSelectedRid] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [onlyCreatedWallets, setOnlyCreatedWallets] = useState(true);

  // Mint/Burn 입력 (SSOT: MintRequest/BurnRequest)
  const [coinType, setCoinType] = useState(COIN_TYPE.welfare);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [burnAmount, setBurnAmount] = useState('');
  const [burnReason, setBurnReason] = useState('');

  const [logs, setLogs] = useState([]);

  // SSOT: docs/design/api/web-admin.md (webMint.request, webBurn.request)
  // 이전과 동일하게 화면 컴포넌트 내부에 API 호출을 인라인으로 둡니다.
  const webMint_request = useCallback(async (body) => {
    return await http.post('/admin/mint/request', body, { showSpinner: true });
  }, []);

  const webBurn_request = useCallback(async (body) => {
    return await http.post('/admin/burn/request', body, { showSpinner: true });
  }, []);

  const webWallet_listEmployees = useCallback(async (params = {}) => {
    return await http.get('/admin/employees', { params, showSpinner: true });
  }, []);

  const selectedEmployeeIdsFromGrid = useMemo(() => {
    if (!selectedRid?.length) return [];
    const idSet = new Set(selectedRid);
    return items
      .filter((r) => idSet.has(r?.__rid))
      .map((r) => r?.employeeId)
      .filter(Boolean);
  }, [items, selectedRid]);

  const selectedCount = employeeIds.length;
  const mintPerPersonAmount = useMemo(() => {
    const n = Number(String(amount).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amount]);
  const burnPerPersonAmount = useMemo(() => {
    const n = Number(String(burnAmount).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [burnAmount]);

  const mintTotal = useMemo(() => selectedCount * mintPerPersonAmount, [selectedCount, mintPerPersonAmount]);
  const burnTotal = useMemo(() => selectedCount * burnPerPersonAmount, [selectedCount, burnPerPersonAmount]);

  const addEmployeeIds = useCallback(async () => {
    const ids = normalizeEmployeeIds(employeeIdInput);
    if (!ids.length) return;

    setEmployeeIds((prev) => {
      const set = new Set(prev);
      ids.forEach((id) => set.add(id));
      return Array.from(set);
    });
    setEmployeeIdInput('');
  }, [employeeIdInput]);

  const removeEmployeeId = useCallback((id) => {
    setEmployeeIds((prev) => prev.filter((v) => v !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEmployeeIds([]);
    setEmployeeIdInput('');
    setWarning(null);
    setSelectedRid([]);
  }, []);

  const pushLog = useCallback((entry) => {
    setLogs((prev) => [{ at: nowIso(), ...entry }, ...prev].slice(0, 20));
  }, []);

  const validateCommon = useCallback(async (perPersonAmount, ids) => {
    if (!ids.length) {
      await GMessageBox.ShowEx({
        title: '대상 선택',
        message: '대상 사번이 없습니다. 좌측에서 사번을 추가하세요.',
        type: 'info',
        buttons: 'Ok',
      });
      return false;
    }
    if (!perPersonAmount || perPersonAmount <= 0) {
      await GMessageBox.ShowEx({
        title: '금액 입력',
        message: '금액을 0보다 크게 입력하세요.',
        type: 'info',
        buttons: 'Ok',
      });
      return false;
    }
    return true;
  }, []);

  const handleMintRequest = useCallback(async () => {
    setWarning(null);

    if (!(await validateCommon(mintPerPersonAmount, employeeIds))) return;

    const confirmed = await GMessageBox.ShowEx({
      title: '지급 기안',
      message: [
        `대상: ${employeeIds.length}명`,
        `코인: ${coinType}`,
        `1인 금액: ${mintPerPersonAmount}`,
        `총액: ${mintTotal}`,
        reason?.trim() ? `사유: ${reason.trim()}` : null,
        '',
        '지급(Mint) 요청을 생성할까요?',
      ].filter(Boolean).join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '기안', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webMint_request({
        employeeIds,
        coinType,
        amount: mintPerPersonAmount,
        reason: reason?.trim() || undefined,
      });

      if (res?.ok === false) {
        const msg = String(res?.message || '요청 생성에 실패했습니다.');
        setWarning(msg);
        pushLog({ kind: 'mint', ok: false, message: msg });
        return;
      }

      pushLog({ kind: 'mint', ok: true, approvalId: res?.approvalId, amount: mintTotal, coinType });

      await GMessageBox.ShowEx({
        title: '지급 기안 완료',
        message: [
          `approvalId: ${res?.approvalId || '-'}`,
          `status: ${res?.status || 'pending'}`,
          `총액: ${mintTotal}`,
        ].join('\n'),
        type: 'success',
        buttons: 'Ok',
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      setWarning(msg);
      pushLog({ kind: 'mint', ok: false, message: msg });
    }
  }, [coinType, employeeIds, mintPerPersonAmount, mintTotal, pushLog, reason, validateCommon, webMint_request]);

  const handleBurnRequest = useCallback(async () => {
    setWarning(null);

    if (!(await validateCommon(burnPerPersonAmount, employeeIds))) return;

    const confirmed = await GMessageBox.ShowEx({
      title: '회수 기안',
      message: [
        `대상: ${employeeIds.length}명`,
        `코인: ${coinType}`,
        `1인 차감: ${burnPerPersonAmount}`,
        `총액: ${burnTotal}`,
        burnReason?.trim() ? `사유: ${burnReason.trim()}` : null,
        '',
        '회수(Burn) 요청을 생성할까요?',
      ].filter(Boolean).join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '기안', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webBurn_request({
        employeeIds,
        coinType,
        amount: burnPerPersonAmount,
        reason: burnReason?.trim() || undefined,
      });

      if (res?.ok === false) {
        const msg = String(res?.message || '요청 생성에 실패했습니다.');
        setWarning(msg);
        pushLog({ kind: 'burn', ok: false, message: msg });
        return;
      }

      pushLog({ kind: 'burn', ok: true, approvalId: res?.approvalId, amount: burnTotal, coinType });

      await GMessageBox.ShowEx({
        title: '회수 기안 완료',
        message: [
          `approvalId: ${res?.approvalId || '-'}`,
          `status: ${res?.status || 'pending'}`,
          `총액: ${burnTotal}`,
        ].join('\n'),
        type: 'success',
        buttons: 'Ok',
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      setWarning(msg);
      pushLog({ kind: 'burn', ok: false, message: msg });
    }
  }, [burnPerPersonAmount, burnReason, burnTotal, coinType, employeeIds, pushLog, validateCommon, webBurn_request]);

  const tabs = useMemo(() => {
    return [
      { key: 'mint', label: '지급(Mint)' },
      { key: 'burn', label: '회수(Burn)' },
      { key: 'upload', label: '일괄 업로드(TBD)' },
    ];
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setWarning(null);

    try {
      const params = {};
      if (keyword?.trim()) params.keyword = keyword.trim();
      if (name?.trim()) params.name = name.trim();
      if (department?.trim()) params.department = department.trim();
      if (onlyCreatedWallets) params.walletStatus = 'active';

      const res = await webWallet_listEmployees(params);
      const list = Array.isArray(res)
        ? res
        : (Array.isArray(res?.items) ? res.items : (Array.isArray(res?.table) ? res.table : []));

      setItems(list);
      setSelectedRid([]);
    } catch (e) {
      const msg = String(e?.message || e || '');
      setWarning(msg);
    } finally {
      setLoading(false);
    }
  }, [department, keyword, name, onlyCreatedWallets, webWallet_listEmployees]);

  const applySelectionToTargets = useCallback(() => {
    if (!selectedEmployeeIdsFromGrid.length) return;
    setEmployeeIds((prev) => {
      const set = new Set(prev);
      selectedEmployeeIdsFromGrid.forEach((id) => set.add(id));
      return Array.from(set);
    });
  }, [selectedEmployeeIdsFromGrid]);

  const removeSelectedFromTargets = useCallback(() => {
    if (!selectedEmployeeIdsFromGrid.length) return;
    const removeSet = new Set(selectedEmployeeIdsFromGrid);
    setEmployeeIds((prev) => prev.filter((id) => !removeSet.has(id)));
  }, [selectedEmployeeIdsFromGrid]);

  const columns = useMemo(() => {
    return [
      { field: 'employeeId', headerName: '사번', width: 120 },
      { field: 'name', headerName: '성명', width: 140 },
      { field: 'department', headerName: '부서', width: 160 },
      {
        field: 'walletAddress',
        headerName: '지갑',
        flex: 1,
        minWidth: 160,
        renderCell: (p) => {
          const addr = p?.value;
          if (!addr) return <span style={{ opacity: 0.65 }}>-</span>;
          return <span style={{ fontFamily: 'monospace' }}>{String(addr)}</span>;
        },
      },
      {
        field: 'walletStatus',
        headerName: '상태',
        width: 110,
        renderCell: (p) => {
          const s = String(p?.value || '').toLowerCase();
          if (s === 'active') return <Chip size="small" label="활성" color="success" />;
          if (s === 'frozen') return <Chip size="small" label="동결" color="warning" />;
          return <Chip size="small" label="미생성" variant="outlined" />;
        },
      },
    ];
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
          title="코인 지급 관리"
          onSearch={loadEmployees}
          onInitialize={() => {
            setKeyword('');
            setName('');
            setDepartment('');
            setOnlyCreatedWallets(true);
            setItems([]);
            setSelectedRid([]);
            setWarning(null);
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              label="키워드"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사번/성명/부서/지갑"
              sx={{ width: { xs: '100%', md: 280 } }}
            />
            <TextField
              size="small"
              label="성명"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ width: { xs: '100%', md: 200 } }}
            />
            <TextField
              size="small"
              label="부서"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              sx={{ width: { xs: '100%', md: 220 } }}
            />
            <TextField
              select
              size="small"
              label="지갑 필터"
              value={onlyCreatedWallets ? 'created' : 'all'}
              onChange={(e) => setOnlyCreatedWallets(e.target.value === 'created')}
              sx={{ width: { xs: '100%', md: 200 } }}
            >
              <MenuItem value="created">지갑 생성자만</MenuItem>
              <MenuItem value="all">전체(미생성 포함)</MenuItem>
            </TextField>
          </Stack>
        </GSearchHeader>
      </GSearchSection>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* 좌측: 대상 선택 */}
        <Box sx={{ width: { xs: '100%', md: 420 } }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">대상 선택</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                SSOT의 조직도 트리는 TBD라서, 임직원 목록 검색/선택 + 사번 수기 추가를 함께 제공합니다.
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                  placeholder="사번 입력 (쉼표/공백/줄바꿈 구분)"
                  size="small"
                  fullWidth
                />
                <Button variant="contained" onClick={addEmployeeIds}>
                  추가
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ height: 360 }}>
                <GDataGrid
                  title="임직원 목록"
                  rows={items}
                  columns={columns}
                  loading={loading}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={(m) => {
                    const ids = Array.isArray(m) ? m : (m?.ids instanceof Set ? Array.from(m.ids) : []);
                    setSelectedRid(ids);
                  }}
                  sx={{ height: '100%' }}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  onClick={applySelectionToTargets}
                  disabled={selectedEmployeeIdsFromGrid.length === 0}
                >
                  선택 추가
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={removeSelectedFromTargets}
                  disabled={selectedEmployeeIdsFromGrid.length === 0}
                >
                  선택 제거
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {employeeIds.length === 0 && (
                  <Typography variant="body2" sx={{ opacity: 0.65 }}>
                    선택된 대상이 없습니다.
                  </Typography>
                )}
                {employeeIds.map((id) => (
                  <Chip
                    key={id}
                    label={id}
                    onDelete={() => removeEmployeeId(id)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Typography variant="body2">선택 인원: {selectedCount}명</Typography>
                <Button variant="text" color="inherit" onClick={clearAll}>
                  초기화
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* 우측: 제어 패널 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">코인 지급/회수</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                권한 표시(Operator/Approver)는 인증 컨텍스트가 TBD라서 추후 연동합니다.
              </Typography>

              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }}>
                {tabs.map((t) => (
                  <Tab key={t.key} value={t.key} label={t.label} />
                ))}
              </Tabs>

              <Divider sx={{ my: 2 }} />

              {/* 공통 입력 */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  select
                  label="코인 타입"
                  value={coinType}
                  onChange={(e) => setCoinType(e.target.value)}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 240 } }}
                >
                  <MenuItem value={COIN_TYPE.welfare}>복지(welfare)</MenuItem>
                  <MenuItem value={COIN_TYPE.payment}>결제(payment)</MenuItem>
                </TextField>
              </Stack>

              {tab === 'mint' && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="1인 지급 금액(IWC)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="총액"
                      value={String(mintTotal)}
                      size="small"
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Stack>

                  <TextField
                    label="지급 사유(선택)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ mt: 2 }}
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleMintRequest}
                      disabled={selectedCount === 0 || mintPerPersonAmount <= 0}
                    >
                      지급 기안
                    </Button>
                  </Stack>
                </>
              )}

              {tab === 'burn' && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="1인 회수 금액(IWC)"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="총액"
                      value={String(burnTotal)}
                      size="small"
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Stack>

                  <TextField
                    label="회수 사유(선택)"
                    value={burnReason}
                    onChange={(e) => setBurnReason(e.target.value)}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ mt: 2 }}
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleBurnRequest}
                      disabled={selectedCount === 0 || burnPerPersonAmount <= 0}
                    >
                      회수 기안
                    </Button>
                  </Stack>
                </>
              )}

              {tab === 'upload' && (
                <Alert severity="info">
                  SSOT에 업로드 전용 API가 아직 정의되지 않아(TBD) 화면은 placeholder만 제공합니다.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 하단 처리 로그 */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6">처리 로그</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                최근 20건
              </Typography>

              <Divider sx={{ my: 2 }} />

              {logs.length === 0 && (
                <Typography variant="body2" sx={{ opacity: 0.65 }}>
                  아직 처리 내역이 없습니다.
                </Typography>
              )}

              <Stack spacing={1}>
                {logs.map((l, idx) => (
                  <Box key={`${l.at}-${idx}`} sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {l.kind === 'mint' ? '지급(Mint)' : '회수(Burn)'}
                      </Typography>
                      <Chip
                        size="small"
                        label={l.ok ? 'OK' : 'FAIL'}
                        color={l.ok ? 'success' : 'error'}
                        variant={l.ok ? 'filled' : 'outlined'}
                      />
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {l.at}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {l.ok
                        ? `approvalId=${l.approvalId || '-'} / coinType=${l.coinType || '-'} / amount=${l.amount ?? '-'}`
                        : String(l.message || 'error')}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </GPageContainer>
  );
}
