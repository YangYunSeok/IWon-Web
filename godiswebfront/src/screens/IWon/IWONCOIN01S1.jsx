import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import GContentBox from '@/components/GContentBox.jsx';
import { IWONCOIN01S1_getDaily, IWONCOIN01S1_getSupply } from '@/api/IWONCOIN01S1Api.jsx';

function formatNumber(v) {
  if (v == null || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function formatIso(v) {
  if (!v) return '-';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

export default function IWONCOIN01S1() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supply, setSupply] = useState(null);
  const [daily, setDaily] = useState(null);

  const matched = Boolean(supply?.matched);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [supplyRes, dailyRes] = await Promise.all([
        IWONCOIN01S1_getSupply(),
        IWONCOIN01S1_getDaily(),
      ]);

      setSupply(supplyRes);
      setDaily(dailyRes);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const supplyRows = useMemo(() => {
    if (!supply) return [];

    return [
      { label: 'DB 총합', value: supply.dbTotal },
      { label: '체인 총합', value: supply.chainTotal },
      { label: '차이(diff)', value: supply.diff },
      { label: '검증 시각', value: formatIso(supply.checkedAt) },
      { label: '블록 높이', value: supply.blockHeight ?? '-' },
    ];
  }, [supply]);

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={800}>대시보드</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {supply && (
            <Chip
              size="small"
              label={matched ? '일치' : '불일치'}
              color={matched ? 'success' : 'error'}
              variant={matched ? 'filled' : 'filled'}
            />
          )}
          <Button variant="contained" onClick={load} disabled={loading}>새로고침</Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          통계 조회 실패: {String(error?.message || error)}
        </Alert>
      )}

      {/* 1) Header KPI */}
      <GContentBox flex={false} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>총 발행량 요약</Typography>
        <Grid container spacing={1.25}>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                borderColor: supply ? (matched ? 'success.main' : 'error.main') : 'divider',
                bgcolor: supply ? (matched ? 'transparent' : 'rgba(211,47,47,0.06)') : 'transparent',
              }}
            >
              <CardContent>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>SupplySummary</Typography>

                  {loading && (
                    <>
                      <Skeleton height={24} width="60%" />
                      <Skeleton height={24} width="80%" />
                      <Skeleton height={24} width="50%" />
                    </>
                  )}

                  {!loading && supply && (
                    <>
                      <Typography variant="h5" fontWeight={900}>
                        DB {formatNumber(supply.dbTotal)} / 체인 {formatNumber(supply.chainTotal)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        diff: {formatNumber(supply.diff)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        checkedAt: {formatIso(supply.checkedAt)}
                      </Typography>
                    </>
                  )}

                  {!loading && !supply && (
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>데이터 수집 중</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>상세</Typography>
                  <Divider />

                  {loading && (
                    <>
                      <Skeleton height={20} width="90%" />
                      <Skeleton height={20} width="85%" />
                      <Skeleton height={20} width="70%" />
                      <Skeleton height={20} width="80%" />
                    </>
                  )}

                  {!loading && supplyRows.map((r) => (
                    <Stack key={r.label} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>{r.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {typeof r.value === 'number' ? formatNumber(r.value) : String(r.value ?? '-')}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </GContentBox>

      {/* 2) Daily Metrics */}
      <GContentBox flex={false} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>금일 주요 지표</Typography>
        <Grid container spacing={1.25}>
          {[
            { label: '신규 지갑', value: daily?.newWalletCount },
            { label: '금일 발행', value: daily?.mintedAmount },
            { label: '금일 회수', value: daily?.burnedAmount },
            { label: '승인 대기', value: daily?.pendingApprovalCount },
          ].map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>{item.label}</Typography>
                  {loading ? (
                    <Skeleton height={34} width="60%" />
                  ) : (
                    <Typography variant="h6" fontWeight={900}>
                      {formatNumber(item.value)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {!loading && daily?.date && (
          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.75 }}>
            기준일: {daily.date}
          </Typography>
        )}
      </GContentBox>

      {/* 3) Placeholder sections from SSOT */}
      <GContentBox flex={false}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Alert & System Status</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          SSOT 기준으로 Alert/Health, 트랜잭션 모니터링 영역은 추후 확장(TBD)입니다.
        </Typography>
      </GContentBox>
    </Box>
  );
}
