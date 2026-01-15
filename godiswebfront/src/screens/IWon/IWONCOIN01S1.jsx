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

function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function clamp0(n) {
    return Math.max(0, n);
}

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        'M', cx, cy,
        'L', start.x, start.y,
        'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
        'Z',
    ].join(' ');
}

function SimpleDonut({
    data,
    size = 160,
    innerRatio = 0.58,
    centerTop = 'Total',
    centerBottom = '',
}) {
    const safeData = (data || []).map((d) => ({
        name: d?.name ?? '',
        value: clamp0(toNumber(d?.value)),
    }));
    const total = safeData.reduce((acc, d) => acc + d.value, 0);

    const r = size / 2;
    const cx = r;
    const cy = r;
    const outerR = r - 2;
    const innerR = outerR * innerRatio;

    if (!total) {
        return (
            <Box sx={{ width: size, height: size, position: 'relative' }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={cx} cy={cy} r={outerR} fill="rgba(0,0,0,0.06)" />
                    <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
                </svg>
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                        fontSize: 12,
                    }}
                >
                    데이터 수집 중
                </Box>
            </Box>
        );
    }

    // 최소한의 시각 구분용 색상(추후 GODIS 차트 컴포넌트 적용 시 제거)
    const colors = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626'];

    let cursor = 0;
    const slices = safeData.map((d, idx) => {
        const angle = (d.value / total) * 360;
        const start = cursor;
        const end = cursor + angle;
        cursor = end;
        return {
            ...d,
            path: describeArc(cx, cy, outerR, start, end),
            fill: colors[idx % colors.length],
        };
    });

    return (
        <Box sx={{ width: size, height: size, position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((s, i) => (
                    <path key={String(i)} d={s.path} fill={s.fill} />
                ))}
                <circle cx={cx} cy={cy} r={innerR} fill="#fff" />
            </svg>

            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                }}
            >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {centerTop}
                </Typography>
                <Typography variant="subtitle2" fontWeight={900}>
                    {centerBottom}
                </Typography>
            </Box>
        </Box>
    );
}

export default function IWONCOIN01S1() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [supply, setSupply] = useState(null);
    const [daily, setDaily] = useState(null);

    const matched = Boolean(supply?.matched);

    const supplyTotal = useMemo(() => {
        const db = toNumber(supply?.dbTotal);
        const chain = toNumber(supply?.chainTotal);
        return db + chain;
    }, [supply]);

    const supplyDonutData = useMemo(() => {
        if (!supply) return [];
        return [
            { name: 'DB', value: toNumber(supply.dbTotal) },
            { name: '체인', value: toNumber(supply.chainTotal) },
        ];
    }, [supply]);

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
                <Grid container spacing={2}>
                    {/* 왼쪽: SupplySummary + (텍스트/차트 자리) -> md=8 */}
                    <Grid item xs={12} md={8}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderColor: supply ? (matched ? 'success.main' : 'error.main') : 'divider',
                                bgcolor: supply ? (matched ? 'transparent' : 'rgba(211,47,47,0.06)') : 'transparent',
                            }}
                        >
                            <CardContent>
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        SupplySummary
                                    </Typography>

                                    {loading && (
                                        <>
                                            <Skeleton height={34} width="60%" />
                                            <Skeleton height={18} width="40%" />
                                            <Skeleton height={18} width="50%" />
                                        </>
                                    )}

                                    {!loading && supply && (
                                        <>
                                            <Typography variant="h5" fontWeight={900}>
                                                DB {formatNumber(supply.dbTotal)} / 체인 {formatNumber(supply.chainTotal)}
                                            </Typography>

                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 0.5 }}>
                                                <Stack spacing={0.25}>
                                                    <Typography variant="caption" sx={{ opacity: 0.75 }}>차이(diff)</Typography>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        {formatNumber(supply.diff)}
                                                    </Typography>
                                                </Stack>

                                                <Stack spacing={0.25}>
                                                    <Typography variant="caption" sx={{ opacity: 0.75 }}>검증 시각</Typography>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        {formatIso(supply.checkedAt)}
                                                    </Typography>
                                                </Stack>

                                                <Stack spacing={0.25}>
                                                    <Typography variant="caption" sx={{ opacity: 0.75 }}>블록 높이</Typography>
                                                    <Typography variant="body1" fontWeight={700}>
                                                        {formatNumber(supply.blockHeight)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                            <Divider sx={{ my: 1 }} />

                                            {/* ✅ 차트 자리(지금은 비워두고, 나중에 pie 넣을 위치) */}
                                            <Box
                                                sx={{
                                                    height: 140,
                                                    border: '1px dashed rgba(0,0,0,0.15)',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'text.secondary',
                                                    fontSize: 12,
                                                }}
                                            >
                                                (Pie/Donut 차트 영역)
                                            </Box>
                                        </>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 오른쪽: KPI 2x2 -> md=4 */}
                    <Grid item xs={12} md={4}>
                        <Grid container spacing={2}>
                            {[
                                { label: '검증 상태', value: supply ? (matched ? 'OK' : 'Mismatch') : '-' },
                                { label: '차이(diff)', value: supply ? formatNumber(supply.diff) : '-' },
                                { label: 'DB 총합', value: supply ? formatNumber(supply.dbTotal) : '-' },
                                { label: '체인 총합', value: supply ? formatNumber(supply.chainTotal) : '-' },
                            ].map((kpi) => (
                                <Grid key={kpi.label} item xs={12} sm={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                                {kpi.label}
                                            </Typography>
                                            {loading ? (
                                                <Skeleton height={30} width="70%" />
                                            ) : (
                                                <Typography variant="h6" fontWeight={900}>
                                                    {kpi.value}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* ✅ 상세는 아래로 내려서 전체폭(xs=12)으로 */}
                    <Grid item xs={12}>
                        <Card variant="outlined">
                            <CardContent>
                                <Stack spacing={0.75}>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                                        상세
                                    </Typography>
                                    <Divider />

                                    {loading && (
                                        <>
                                            <Skeleton height={20} width="90%" />
                                            <Skeleton height={20} width="85%" />
                                            <Skeleton height={20} width="70%" />
                                            <Skeleton height={20} width="80%" />
                                        </>
                                    )}

                                    {!loading && supply && (
                                        <Stack spacing={0.5}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">DB 총합</Typography>
                                                <Typography variant="body2" fontWeight={700}>{formatNumber(supply.dbTotal)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">체인 총합</Typography>
                                                <Typography variant="body2" fontWeight={700}>{formatNumber(supply.chainTotal)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">차이(diff)</Typography>
                                                <Typography variant="body2" fontWeight={700}>{formatNumber(supply.diff)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">검증 시각</Typography>
                                                <Typography variant="body2" fontWeight={700}>{formatIso(supply.checkedAt)}</Typography>
                                            </Stack>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2">블록 높이</Typography>
                                                <Typography variant="body2" fontWeight={700}>{formatNumber(supply.blockHeight)}</Typography>
                                            </Stack>
                                        </Stack>
                                    )}
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
