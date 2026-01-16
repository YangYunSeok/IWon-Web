import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GTextField from '@/components/GTextField.jsx';

import {
  webFinancialClosing_export,
  webFinancialClosing_getJournalDetail,
  webFinancialClosing_getReport,
  webFinancialClosing_listJournals,
} from '@/api/IWONCOIN07S1Api.jsx';

const PERIOD_TYPE_OPTIONS = [
  { CD_VAL: 'month', CD_VAL_NM: '월' },
  { CD_VAL: 'quarter', CD_VAL_NM: '분기' },
  { CD_VAL: 'half', CD_VAL_NM: '반기' },
  { CD_VAL: 'year', CD_VAL_NM: '년' },
];

const COIN_TYPE_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'welfare', CD_VAL_NM: '복지' },
  { CD_VAL: 'payment', CD_VAL_NM: '결제' },
];

const STATUS_OPTIONS = [
  { CD_VAL: '', CD_VAL_NM: '전체' },
  { CD_VAL: 'pending', CD_VAL_NM: '대기' },
  { CD_VAL: 'approved', CD_VAL_NM: '승인' },
  { CD_VAL: 'rejected', CD_VAL_NM: '반려' },
];

function toInt(v, fallback = null) {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function formatAmount(v) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function safeStr(v) {
  if (v == null) return '';
  return String(v);
}

export default function IWONCOIN07S1() {
  // SSOT: 최근 마감 월(TBD) → MVP는 '이번 달' 기본값
  const now = useMemo(() => dayjs(), []);

  const [tab, setTab] = useState('journal'); // journal | report

  const [periodType, setPeriodType] = useState('month');
  const [year, setYear] = useState(String(now.year()));
  const [month, setMonth] = useState(String(now.month() + 1));
  const [quarter, setQuarter] = useState('1');
  const [half, setHalf] = useState('1');

  const [coinType, setCoinType] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(null);

  // 탭 A: 분개(원천 승인 → 분개 미리보기)
  const [journalSummary, setJournalSummary] = useState(null);
  const [journalItems, setJournalItems] = useState([]);
  const [journalTotal, setJournalTotal] = useState(0);

  // 탭 B: 결산보고서
  const [report, setReport] = useState(null);

  // 상세
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const yearN = useMemo(() => toInt(year, null), [year]);
  const monthN = useMemo(() => toInt(month, null), [month]);
  const quarterN = useMemo(() => toInt(quarter, null), [quarter]);
  const halfN = useMemo(() => toInt(half, null), [half]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { CD_VAL: String(m), CD_VAL_NM: String(m).padStart(2, '0') };
    });
  }, []);

  const quarterOptions = useMemo(() => {
    return [1, 2, 3, 4].map((q) => ({ CD_VAL: String(q), CD_VAL_NM: `${q}분기` }));
  }, []);

  const halfOptions = useMemo(() => {
    return [1, 2].map((h) => ({ CD_VAL: String(h), CD_VAL_NM: `${h}반기` }));
  }, []);

  const buildCommonParams = useCallback(() => {
    if (!yearN) return null;

    const base = {
      periodType,
      year: yearN,
      coinType: coinType || undefined,
    };

    if (periodType === 'month') {
      if (!monthN || monthN < 1 || monthN > 12) return null;
      return { ...base, month: monthN };
    }
    if (periodType === 'quarter') {
      if (!quarterN || quarterN < 1 || quarterN > 4) return null;
      return { ...base, quarter: quarterN };
    }
    if (periodType === 'half') {
      if (!halfN || halfN < 1 || halfN > 2) return null;
      return { ...base, half: halfN };
    }
    return base; // year
  }, [coinType, halfN, monthN, periodType, quarterN, yearN]);

  const handleSearch = useCallback(async () => {
    const params = buildCommonParams();
    if (!params) {
      await GMessageBox.ShowEx({
        title: '조회',
        message: '기간 조건(연/월/분기/반기)을 확인해주세요.',
        type: 'warning',
        buttons: 'Ok',
      });
      return;
    }

    setWarning(null);
    setLoading(true);

    try {
      if (tab === 'journal') {
        const res = await webFinancialClosing_listJournals({
          ...params,
          status: status || undefined,
        });
        setJournalSummary(res?.summary || null);
        const nextItems = Array.isArray(res?.items) ? res.items : [];
        setJournalItems(nextItems);
        setJournalTotal(Number(res?.total ?? nextItems.length ?? 0));
      } else {
        const res = await webFinancialClosing_getReport(params);
        setReport(res || null);
      }
    } catch (e) {
      const msg = String(e?.message || e || '조회에 실패했습니다.');
      setWarning(msg);
      if (tab === 'journal') {
        setJournalSummary(null);
        setJournalItems([]);
        setJournalTotal(0);
      } else {
        setReport(null);
      }
    } finally {
      setLoading(false);
    }
  }, [buildCommonParams, status, tab]);

  const handleReset = useCallback(() => {
    setPeriodType('month');
    setYear(String(now.year()));
    setMonth(String(now.month() + 1));
    setQuarter('1');
    setHalf('1');
    setCoinType('');
    setStatus('');
    setWarning(null);
    setJournalSummary(null);
    setJournalItems([]);
    setJournalTotal(0);
    setReport(null);
  }, [now]);

  const handleDownload = useCallback(async () => {
    const params = buildCommonParams();
    if (!params) {
      await GMessageBox.ShowEx({
        title: '다운로드',
        message: '기간 조건(연/월/분기/반기)을 확인해주세요.',
        type: 'warning',
        buttons: 'Ok',
      });
      return;
    }

    try {
      const res = await webFinancialClosing_export({
        ...params,
        tab: tab === 'journal' ? 'journal' : 'report',
        format: 'csv',
      });

      const url = safeStr(res?.downloadUrl);
      if (!url) {
        await GMessageBox.ShowEx({
          title: '다운로드',
          message: 'downloadUrl 응답이 없습니다.',
          type: 'warning',
          buttons: 'Ok',
        });
        return;
      }

      window.open(url, '_blank');
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '다운로드',
        message: String(e?.message || e || '다운로드에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    }
  }, [buildCommonParams, tab]);

  const openJournalDetail = useCallback(async (approvalId) => {
    if (!approvalId) return;

    setOpenDetail(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await webFinancialClosing_getJournalDetail(approvalId);
      setDetail(res || null);
    } catch (e) {
      setDetail(null);
      await GMessageBox.ShowEx({
        title: '상세',
        message: String(e?.message || e || '상세 조회에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setOpenDetail(false);
    setDetailLoading(false);
    setDetail(null);
  }, []);

  const journalColumns = useMemo(() => {
    return [
      { field: 'approvalId', headerName: '승인ID', width: 260 },
      { field: 'requestedAt', headerName: '승인일시', width: 180 },
      {
        field: 'coinType',
        headerName: '코인',
        width: 90,
        valueFormatter: (p) => {
          const s = safeStr(p?.value);
          if (s === 'welfare') return '복지';
          if (s === 'payment') return '결제';
          return s || '-';
        },
      },
      {
        field: 'eventType',
        headerName: '이벤트',
        width: 90,
        valueFormatter: (p) => {
          const s = safeStr(p?.value).toLowerCase();
          if (s === 'mint') return '발행';
          if (s === 'burn') return '소각';
          return s || '-';
        },
      },
      {
        field: 'amount',
        headerName: '금액',
        width: 140,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (p) => formatAmount(p?.value),
      },
      { field: 'status', headerName: '상태', width: 110 },
      { field: 'title', headerName: '사유/제목', flex: 1, minWidth: 240 },
    ];
  }, []);

  const summary = journalSummary || {};

  return (
    <GPageContainer>
      <GSearchHeader
        title="재무회계결산 관리"
        buttons={[
          <Button key="search" variant="contained" onClick={handleSearch} disabled={loading}>
            조회
          </Button>,
          <Button key="reset" variant="outlined" onClick={handleReset} disabled={loading}>
            초기화
          </Button>,
          <Button key="download" variant="outlined" onClick={handleDownload} disabled={loading}>
            다운로드
          </Button>,
        ]}
      />

      <GSearchSection>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <GSelectBox
            label="기간타입"
            items={PERIOD_TYPE_OPTIONS}
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            value={periodType}
            fieldName="periodType"
            onFieldChange={(k, v) => setPeriodType(String(v || 'month'))}
            sx={{ minWidth: 130 }}
          />

          <GTextField
            label="연도"
            value={year}
            onFieldChange={(k, v) => setYear(String(v ?? ''))}
            fieldName="year"
            sx={{ width: 110 }}
          />

          {periodType === 'month' && (
            <GSelectBox
              label="월"
              items={monthOptions}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              value={month}
              fieldName="month"
              onFieldChange={(k, v) => setMonth(String(v ?? ''))}
              sx={{ width: 110 }}
            />
          )}

          {periodType === 'quarter' && (
            <GSelectBox
              label="분기"
              items={quarterOptions}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              value={quarter}
              fieldName="quarter"
              onFieldChange={(k, v) => setQuarter(String(v ?? ''))}
              sx={{ width: 130 }}
            />
          )}

          {periodType === 'half' && (
            <GSelectBox
              label="반기"
              items={halfOptions}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              value={half}
              fieldName="half"
              onFieldChange={(k, v) => setHalf(String(v ?? ''))}
              sx={{ width: 130 }}
            />
          )}

          <GSelectBox
            label="코인"
            items={COIN_TYPE_OPTIONS}
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            value={coinType}
            fieldName="coinType"
            onFieldChange={(k, v) => setCoinType(String(v ?? ''))}
            sx={{ minWidth: 130 }}
          />

          {tab === 'journal' && (
            <GSelectBox
              label="상태"
              items={STATUS_OPTIONS}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              value={status}
              fieldName="status"
              onFieldChange={(k, v) => setStatus(String(v ?? ''))}
              sx={{ minWidth: 130 }}
            />
          )}
        </Stack>
      </GSearchSection>

      <Box sx={{ mt: 1 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab value="journal" label="재무회계분개" />
          <Tab value="report" label="결산보고서" />
        </Tabs>
      </Box>

      {warning && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {warning}
        </Alert>
      )}

      {tab === 'journal' && (
        <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
            <Card variant="outlined" sx={{ minWidth: 220 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">발행 건수</Typography>
                <Typography variant="h6" fontWeight={800}>{Number(summary.mintCount || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 220 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">소각 건수</Typography>
                <Typography variant="h6" fontWeight={800}>{Number(summary.burnCount || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 260 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">순발행</Typography>
                <Typography variant="h6" fontWeight={900}>{formatAmount(summary.netAmount ?? 0)}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  (발행 {formatAmount(summary.mintAmount ?? 0)} / 소각 {formatAmount(summary.burnAmount ?? 0)})
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 220 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">예상 분개 라인</Typography>
                <Typography variant="h6" fontWeight={800}>{Number(summary.journalLineCount || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Stack>

          <Box sx={{ mt: 1 }}>
            <GDataGrid
              title={`분개 원천(승인) 목록 (총 ${journalTotal.toLocaleString()}건)`}
              rows={journalItems}
              columns={journalColumns}
              loading={loading}
              disableRowSelectionOnClick
              onRowClick={(p) => openJournalDetail(p?.row?.approvalId)}
              height={560}
              Buttons={{ add: 0, delete: 0, revert: 0, excel: 0 }}
            />
          </Box>
        </>
      )}

      {tab === 'report' && (
        <Box sx={{ mt: 1 }}>
          {!report && (
            <Alert severity="info">조건을 선택한 뒤 조회를 실행하세요.</Alert>
          )}

          {report && (
            <Stack spacing={1}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={900}>요약</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">발행 건수</Typography>
                      <Typography variant="h6" fontWeight={800}>{Number(report.mintCount || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">소각 건수</Typography>
                      <Typography variant="h6" fontWeight={800}>{Number(report.burnCount || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">순발행</Typography>
                      <Typography variant="h6" fontWeight={900}>{formatAmount(report.netAmount ?? 0)}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight={900}>준비금 / 발행부채 (TBD)</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">준비금(기초/증감/기말)</Typography>
                      <Typography variant="body1">
                        {formatAmount(report.reserveBeginning)} / {formatAmount(report.reserveChange)} / {formatAmount(report.reserveEnding)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">발행부채(기초/증감/기말)</Typography>
                      <Typography variant="body1">
                        {formatAmount(report.liabilityBeginning)} / {formatAmount(report.liabilityChange)} / {formatAmount(report.liabilityEnding)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Box>
      )}

      <Dialog open={openDetail} onClose={closeDetail} maxWidth="lg" fullWidth>
        <DialogTitle>분개 상세</DialogTitle>
        <DialogContent dividers>
          {detailLoading && <Typography variant="body2">로딩 중...</Typography>}

          {!detailLoading && !detail && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              상세 데이터가 없습니다.
            </Typography>
          )}

          {!detailLoading && detail && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>원천(승인)</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">approvalId: {safeStr(detail?.source?.approval?.approvalId)}</Typography>
                <Typography variant="body2">type: {safeStr(detail?.source?.approval?.type)}</Typography>
                <Typography variant="body2">coinType: {safeStr(detail?.source?.approval?.coinType)}</Typography>
                <Typography variant="body2">amount: {formatAmount(detail?.source?.approval?.amount)}</Typography>
                <Typography variant="body2">status: {safeStr(detail?.source?.approval?.status)}</Typography>
                <Typography variant="body2">requestedAt: {safeStr(detail?.source?.approval?.requestedAt)}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={800}>분개 라인</Typography>
                <Divider sx={{ my: 1 }} />
                <GDataGrid
                  showTitle={false}
                  rows={Array.isArray(detail?.journalLines) ? detail.journalLines.map((r, i) => ({ id: String(i), ...r })) : []}
                  columns={[
                    { field: 'side', headerName: '차/대', width: 120 },
                    { field: 'accountName', headerName: '계정', flex: 1, minWidth: 220 },
                    {
                      field: 'amount',
                      headerName: '금액',
                      width: 160,
                      align: 'right',
                      headerAlign: 'right',
                      valueFormatter: (p) => formatAmount(p?.value),
                    },
                  ]}
                  height={220}
                  Buttons={{ add: 0, delete: 0, revert: 0, excel: 0 }}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </GPageContainer>
  );
}
