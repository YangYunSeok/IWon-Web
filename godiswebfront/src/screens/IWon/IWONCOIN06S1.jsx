import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';

import {
  webMonthlyPayee_bulkDelete,
  webMonthlyPayee_confirm,
  webMonthlyPayee_export,
  webMonthlyPayee_list,
  webMonthlyPayee_upsert,
} from '@/api/IWONCOIN06S1Api.jsx';
import { webWallet_listEmployees } from '@/api/employeeWalletApi.jsx';

const COIN_TYPE_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'welfare', CD_VAL_NM: '복지' },
  { CD_VAL: 'payment', CD_VAL_NM: '결제' },
];

const PAYEE_STATUS_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'scheduled', CD_VAL_NM: 'scheduled' },
  { CD_VAL: 'paid', CD_VAL_NM: 'paid' },
  { CD_VAL: 'cancelled', CD_VAL_NM: 'cancelled' },
];

function toYearMonth(date = dayjs()) {
  return dayjs(date).format('YYYY-MM');
}

function parseYearMonth(ym) {
  const m = String(ym || '').trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) return { year: null, month: null };
  return { year: Number(m[1]), month: Number(m[2]) };
}

function formatAmount(v) {
  if (v == null || v === '') return '';
  const n = Number(String(v).replace(/,/g, ''));
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function parseAmount(v) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function IWONCOIN06S1() {
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  // 기준 월(YYYY-MM)
  const [yearMonth, setYearMonth] = useState(() => toYearMonth());
  const { year, month } = useMemo(() => parseYearMonth(yearMonth), [yearMonth]);

  // 필터
  const [coinType, setCoinType] = useState('welfare');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');

  // 목록
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // 계획 확정 상태(SSOT에 plan 상태 조회 API가 없어서 화면 로컬 상태로만 유지)
  const [confirmedMap, setConfirmedMap] = useState(() => ({}));
  const planStatus = useMemo(() => {
    const key = `${yearMonth}`;
    return confirmedMap[key] || 'draft';
  }, [confirmedMap, yearMonth]);

  // 대상자 추가(직원 검색) 다이얼로그
  const [openPicker, setOpenPicker] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [empItems, setEmpItems] = useState([]);
  const [empSelectedRid, setEmpSelectedRid] = useState([]);
  const [empKeyword, setEmpKeyword] = useState('');
  const [empName, setEmpName] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');

  const loadList = useCallback(async () => {
    if (!year || !month) return;

    setLoading(true);
    setWarning(null);
    try {
      const res = await webMonthlyPayee_list({
        year,
        month,
        coinType: coinType || undefined,
        status: status || undefined,
        department: department?.trim() || undefined,
        name: name?.trim() || undefined,
        keyword: keyword?.trim() || undefined,
        page: 1,
        size: 500,
      });

      const items = Array.isArray(res?.items) ? res.items : [];
      setRows(items);
      setTotal(Number(res?.total ?? items.length ?? 0));
    } catch (e) {
      setRows([]);
      setTotal(0);
      setWarning(String(e?.message || e || '월별 지급 대상자 조회에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [coinType, department, keyword, month, name, status, year]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleInitialize = useCallback(() => {
    setYearMonth(toYearMonth());
    setCoinType('welfare');
    setStatus('');
    setDepartment('');
    setName('');
    setKeyword('');
  }, []);

  const isConfirmed = planStatus === 'confirmed';

  const columns = useMemo(() => {
    return [
      {
        field: 'employeeId',
        headerName: '사번',
        width: 120,
        headerAlign: 'center',
        align: 'center',
        editable: !isConfirmed,
      },
      {
        field: 'name',
        headerName: '성명',
        width: 140,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'coinType',
        headerName: '코인',
        width: 110,
        headerAlign: 'center',
        align: 'center',
      },
      {
        field: 'amount',
        headerName: '지급 금액',
        width: 140,
        headerAlign: 'center',
        align: 'right',
        editable: !isConfirmed,
        valueFormatter: ({ value }) => formatAmount(value),
      },
      {
        field: 'reason',
        headerName: '비고',
        flex: 1,
        minWidth: 220,
        headerAlign: 'center',
        align: 'left',
        editable: !isConfirmed,
      },
      {
        field: 'status',
        headerName: '상태',
        width: 120,
        headerAlign: 'center',
        align: 'center',
      },
      { field: 'id', headerName: 'id', hide: true },
      { field: 'year', headerName: 'year', hide: true },
      { field: 'month', headerName: 'month', hide: true },
    ];
  }, [isConfirmed]);

  const planStatusChip = useMemo(() => {
    if (planStatus === 'confirmed') return { label: 'Confirmed', color: 'success' };
    return { label: 'Draft', color: 'default' };
  }, [planStatus]);

  const openEmployeePicker = useCallback(() => {
    setOpenPicker(true);
    setEmpItems([]);
    setEmpSelectedRid([]);
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    try {
      const res = await webWallet_listEmployees({
        keyword: empKeyword?.trim() || undefined,
        name: empName?.trim() || undefined,
        department: empDepartment?.trim() || undefined,
        onlyUncreated: false,
        page: 1,
        size: 200,
      });

      const items = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
      setEmpItems(items);
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '대상자 추가',
        message: String(e?.message || e || '임직원 목록 조회에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
      setEmpItems([]);
    } finally {
      setEmpLoading(false);
    }
  }, [empDepartment, empKeyword, empName]);

  const selectedEmployeeIds = useMemo(() => {
    const idSet = new Set(empSelectedRid || []);
    return empItems
      .filter((r) => idSet.has(r?.__rid))
      .map((r) => r?.employeeId)
      .filter(Boolean);
  }, [empItems, empSelectedRid]);

  const addSelectedEmployees = useCallback(async () => {
    if (isConfirmed) {
      await GMessageBox.ShowEx({
        title: '대상자 추가',
        message: '확정 상태에서는 편집할 수 없습니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    if (!selectedEmployeeIds.length) {
      await GMessageBox.ShowEx({
        title: '대상자 추가',
        message: '추가할 대상을 선택해주세요.',
        type: 'warning',
        buttons: 'Ok',
      });
      return;
    }

    setRows((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const existsKey = new Set(next.map((r) => `${r?.employeeId}|${r?.coinType || coinType || ''}`));

      selectedEmployeeIds.forEach((employeeId) => {
        const key = `${employeeId}|${coinType || ''}`;
        if (existsKey.has(key)) return;

        next.unshift({
          id: null,
          year,
          month,
          employeeId,
          name: '',
          coinType: coinType || 'welfare',
          amount: 0,
          reason: '',
          status: 'scheduled',
          ROW_STATE: 'I',
        });
        existsKey.add(key);
      });

      return next;
    });

    setOpenPicker(false);
    setEmpSelectedRid([]);
  }, [coinType, isConfirmed, month, selectedEmployeeIds, year]);

  const saveChanges = useCallback(async () => {
    if (isConfirmed) {
      await GMessageBox.ShowEx({
        title: '저장',
        message: '확정 상태에서는 편집/저장을 할 수 없습니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    const changed = (rows || []).filter((r) => r?.ROW_STATE === 'I' || r?.ROW_STATE === 'U' || r?.ROW_STATE === 'D');
    if (!changed.length) {
      await GMessageBox.ShowEx({
        title: '저장',
        message: '변경된 항목이 없습니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    const confirmed = await GMessageBox.ShowEx({
      title: '저장',
      message: `변경사항 ${changed.length}건을 저장하시겠습니까?`,
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '저장', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      // 1) 삭제는 bulk-delete 우선
      const deleteIds = changed.filter((r) => r?.ROW_STATE === 'D').map((r) => r?.id).filter(Boolean);
      if (deleteIds.length) {
        await webMonthlyPayee_bulkDelete(deleteIds);
      }

      // 2) upsert (I/U)
      const upserts = changed.filter((r) => r?.ROW_STATE === 'I' || r?.ROW_STATE === 'U');
      for (const r of upserts) {
        const body = {
          year: Number(r?.year ?? year),
          month: Number(r?.month ?? month),
          employeeId: String(r?.employeeId || '').trim(),
          coinType: String(r?.coinType || coinType || 'welfare').trim(),
          amount: parseAmount(r?.amount),
          reason: r?.reason ? String(r.reason) : undefined,
        };

        if (!body.year || !body.month || !body.employeeId || !body.coinType) {
          throw new Error('필수값(year, month, employeeId, coinType)이 누락된 행이 있습니다.');
        }

        const id = r?.id || 'new';
        await webMonthlyPayee_upsert(id, body);
      }

      await GMessageBox.ShowEx({
        title: '저장',
        message: '저장이 완료되었습니다.',
        type: 'success',
        buttons: 'Ok',
      });

      await loadList();
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '저장 실패',
        message: String(e?.message || e || '저장에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    }
  }, [coinType, isConfirmed, loadList, month, rows, year]);

  const confirmPlan = useCallback(async () => {
    if (!year || !month) return;

    const confirmed = await GMessageBox.ShowEx({
      title: '계획 확정',
      message: [`${yearMonth} 지급 계획을 확정하시겠습니까?`, '', '확정 후 편집은 제한됩니다.'].join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '확정', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webMonthlyPayee_confirm(year, month);
      if (res?.success === false || res?.ok === false) {
        throw new Error(String(res?.message || res?.code || '확정에 실패했습니다.'));
      }

      setConfirmedMap((prev) => ({ ...prev, [yearMonth]: 'confirmed' }));

      await GMessageBox.ShowEx({
        title: '계획 확정',
        message: `확정 완료: ${yearMonth}`,
        type: 'success',
        buttons: 'Ok',
      });
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '계획 확정 실패',
        message: String(e?.message || e || '확정에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    }
  }, [month, year, yearMonth]);

  const exportFile = useCallback(async () => {
    if (!year || !month) return;

    try {
      const res = await webMonthlyPayee_export({
        year,
        month,
        coinType: coinType || undefined,
        format: 'csv',
      });

      const url = res?.downloadUrl;
      if (!url) {
        await GMessageBox.ShowEx({
          title: '내보내기',
          message: 'downloadUrl이 없어 다운로드를 시작할 수 없습니다.',
          type: 'warning',
          buttons: 'Ok',
        });
        return;
      }

      // downloadUrl은 /api prefix 포함/미포함 모두 허용
      const href = String(url).startsWith('http') ? String(url) : String(url).startsWith('/api') ? String(url) : `/api${String(url)}`;
      window.open(href, '_blank', 'noreferrer');
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '내보내기 실패',
        message: String(e?.message || e || '내보내기에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    }
  }, [coinType, month, year]);

  const importPrevMonth = useCallback(async () => {
    if (!year || !month) return;

    if (isConfirmed) {
      await GMessageBox.ShowEx({
        title: '전월 데이터 가져오기',
        message: '확정 상태에서는 편집할 수 없습니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    const prev = dayjs(`${yearMonth}-01`).subtract(1, 'month');
    const prevYm = prev.format('YYYY-MM');
    const { year: py, month: pm } = parseYearMonth(prevYm);

    const confirmed = await GMessageBox.ShowEx({
      title: '전월 데이터 가져오기',
      message: [`${prevYm} 데이터를 ${yearMonth}로 가져옵니다.`, '', '불러온 데이터는 저장 전까지 반영되지 않습니다.'].join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '가져오기', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webMonthlyPayee_list({
        year: py,
        month: pm,
        coinType: coinType || undefined,
        page: 1,
        size: 1000,
      });

      const items = Array.isArray(res?.items) ? res.items : [];
      if (!items.length) {
        await GMessageBox.ShowEx({
          title: '전월 데이터 가져오기',
          message: '전월 데이터가 없습니다.',
          type: 'info',
          buttons: 'Ok',
        });
        return;
      }

      setRows((prevRows) => {
        const next = Array.isArray(prevRows) ? [...prevRows] : [];
        const existsKey = new Set(next.map((r) => `${r?.employeeId}|${r?.coinType}`));

        items.forEach((r) => {
          const employeeId = r?.employeeId;
          const ct = r?.coinType || coinType || 'welfare';
          const key = `${employeeId}|${ct}`;
          if (!employeeId || existsKey.has(key)) return;

          next.unshift({
            id: null,
            year,
            month,
            employeeId,
            name: r?.name || '',
            coinType: ct,
            amount: r?.amount ?? 0,
            reason: r?.reason || '',
            status: 'scheduled',
            ROW_STATE: 'I',
          });
          existsKey.add(key);
        });

        return next;
      });

      await GMessageBox.ShowEx({
        title: '전월 데이터 가져오기',
        message: `불러오기 완료: ${items.length}건 (중복 제외)`,
        type: 'success',
        buttons: 'Ok',
      });
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '전월 데이터 가져오기 실패',
        message: String(e?.message || e || '전월 데이터 조회에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    }
  }, [coinType, isConfirmed, month, year, yearMonth]);

  const employeeColumns = useMemo(() => {
    return [
      { field: 'employeeId', headerName: '사번', width: 120, headerAlign: 'center', align: 'center' },
      { field: 'name', headerName: '성명', width: 140, headerAlign: 'center', align: 'center' },
      { field: 'department', headerName: '부서', flex: 1, minWidth: 180, headerAlign: 'center', align: 'left' },
      { field: 'walletStatus', headerName: '지갑', width: 120, headerAlign: 'center', align: 'center' },
    ];
  }, []);

  return (
    <GPageContainer>
      <Stack spacing={1.5}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">월별 지급 대상자 관리</Typography>
          <Chip size="small" variant="outlined" {...planStatusChip} />
        </Box>

        {warning && <Alert severity="warning">{warning}</Alert>}

        <GSearchSection>
          <GSearchHeader
            fields={[
              {
                header: '기준 월',
                content: (
                  <TextField
                    type="month"
                    size="small"
                    value={yearMonth}
                    onChange={(e) => setYearMonth(e.target.value)}
                    disabled={loading}
                    sx={{ minWidth: 160 }}
                  />
                ),
              },
              {
                header: '코인',
                content: (
                  <GSelectBox
                    items={COIN_TYPE_OPTIONS}
                    valueKey="CD_VAL"
                    labelKey="CD_VAL_NM"
                    toplabel="A"
                    value={coinType}
                    onChange={(v) => setCoinType(v)}
                    disabled={loading}
                  />
                ),
              },
              {
                header: '상태',
                content: (
                  <GSelectBox
                    items={PAYEE_STATUS_OPTIONS}
                    valueKey="CD_VAL"
                    labelKey="CD_VAL_NM"
                    toplabel="A"
                    value={status}
                    onChange={(v) => setStatus(v)}
                    disabled={loading}
                  />
                ),
              },
              {
                header: '부서',
                content: (
                  <TextField
                    size="small"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="부서명"
                    disabled={loading}
                  />
                ),
              },
              {
                header: '이름',
                content: (
                  <TextField
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름(부분일치)"
                    disabled={loading}
                  />
                ),
              },
              {
                header: '키워드',
                content: (
                  <TextField
                    size="small"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="통합 검색"
                    disabled={loading}
                  />
                ),
              },
            ]}
            onSearch={loadList}
            onInitialize={handleInitialize}
          />
        </GSearchSection>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" onClick={importPrevMonth} disabled={loading || isConfirmed}>
            전월 데이터 가져오기
          </Button>
          <Button variant="outlined" onClick={openEmployeePicker} disabled={loading || isConfirmed}>
            대상자 추가
          </Button>
          <Button variant="contained" onClick={saveChanges} disabled={loading || isConfirmed}>
            저장
          </Button>
          <Button variant="outlined" color="success" onClick={confirmPlan} disabled={loading || isConfirmed}>
            계획 확정
          </Button>
          <Button variant="outlined" onClick={exportFile} disabled={loading}>
            내보내기
          </Button>
          <Typography variant="body2" sx={{ alignSelf: 'center', ml: 1, color: 'text.secondary' }}>
            total: {total.toLocaleString()}
          </Typography>
        </Box>

        <GDataGrid
          title="지급 대상자"
          Buttons={{ add: !isConfirmed, delete: !isConfirmed, revert: !isConfirmed, excel: true }}
          rows={rows}
          onRowsChange={setRows}
          columns={columns}
          loading={loading}
          getRowId={(r) => r.__rid}
          disableRowSelectionOnClick={false}
          createNewRow={() => ({
            id: null,
            year,
            month,
            coinType: coinType || 'welfare',
            status: 'scheduled',
            amount: 0,
            reason: '',
          })}
        />

        {isConfirmed && (
          <Alert severity="info">
            확정 상태에서는 편집이 제한됩니다. (SSOT에 plan 상태 조회 API가 없어, 이 화면은 확정 버튼 실행 후에만
            Confirmed로 표시합니다.)
          </Alert>
        )}
      </Stack>

      <Dialog open={openPicker} onClose={() => setOpenPicker(false)} fullWidth maxWidth="md">
        <DialogTitle>대상자 추가</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                size="small"
                label="키워드"
                value={empKeyword}
                onChange={(e) => setEmpKeyword(e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="이름"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="부서"
                value={empDepartment}
                onChange={(e) => setEmpDepartment(e.target.value)}
                fullWidth
              />
              <Button variant="outlined" onClick={loadEmployees} disabled={empLoading}>
                조회
              </Button>
            </Stack>

            <GDataGrid
              title="임직원 목록"
              showTitle={false}
              enableRowState={false}
              rows={empItems}
              columns={employeeColumns}
              loading={empLoading}
              checkboxSelection
              onRowSelectionModelChange={(m) => {
                // GDataGrid 내부에서 __rid 기준으로 선택ID를 저장하고, 여기로도 넘겨줌
                const ids = Array.isArray(m) ? m : Array.from(m?.ids || []);
                setEmpSelectedRid(ids);
              }}
            />

            <Typography variant="body2" color="text.secondary">
              선택됨: {selectedEmployeeIds.length}명
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPicker(false)}>닫기</Button>
          <Button variant="contained" onClick={addSelectedEmployees}>
            추가
          </Button>
        </DialogActions>
      </Dialog>
    </GPageContainer>
  );
}
