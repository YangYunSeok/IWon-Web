import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Button,
} from '@mui/material';

import GPageContainer from '@/components/GPageContainer.jsx';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GSearchSection from '@/components/GSearchSection.jsx';
import GDataGrid from '@/components/GDataGrid.jsx';
import GMessageBox from '@/components/GMessageBox.jsx';
import { http } from '@/libs/TaskHttp';

const STATUS = /** @type {const} */ ({
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
});

function formatAmount(v) {
  if (v == null) return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString();
}

function safeString(v) {
  if (v == null) return '';
  return String(v);
}

function toPrettyJson(obj) {
  try {
    return JSON.stringify(obj ?? {}, null, 2);
  } catch {
    return String(obj ?? '');
  }
}

export default function IWONCOIN05S1() {
  const [warning, setWarning] = useState(null);

  const [status, setStatus] = useState(STATUS.pending);
  const [keyword, setKeyword] = useState('');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // SSOT: webApproval.* (docs/design/ui/admin/web-approval.md)
  // 화면 컴포넌트 내부에 API 호출을 인라인으로 둡니다.
  const webApproval_list = useCallback(async (params = {}) => {
    return await http.get('/admin/approvals', { params, showSpinner: true });
  }, []);

  const webApproval_get = useCallback(async (approvalId) => {
    return await http.get(`/admin/approvals/${approvalId}`, { showSpinner: true });
  }, []);

  const webApproval_confirm = useCallback(async (approvalId) => {
    return await http.post(`/admin/approvals/${approvalId}/confirm`, {}, { showSpinner: true });
  }, []);

  const webApproval_reject = useCallback(async (approvalId, body) => {
    return await http.post(`/admin/approvals/${approvalId}/reject`, body, { showSpinner: true });
  }, []);

  const loadList = useCallback(async () => {
    setWarning(null);
    try {
      const res = await webApproval_list({
        status,
        keyword: keyword?.trim() || undefined,
        page: 1,
        size: 100,
      });

      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems(nextItems);
      setTotal(Number(res?.total ?? nextItems.length ?? 0));
    } catch (e) {
      setWarning(String(e?.message || e || '목록 조회에 실패했습니다.'));
      setItems([]);
      setTotal(0);
    }
  }, [keyword, status, webApproval_list]);

  const openApprovalDetail = useCallback(
    async (approvalId) => {
      setWarning(null);
      setOpenDetail(true);
      setRejectReason('');
      setDetail(null);
      setDetailLoading(true);
      try {
        const res = await webApproval_get(approvalId);
        setDetail(res || null);
      } catch (e) {
        setWarning(String(e?.message || e || '상세 조회에 실패했습니다.'));
      } finally {
        setDetailLoading(false);
      }
    },
    [webApproval_get]
  );

  const closeDetail = useCallback(() => {
    setOpenDetail(false);
    setDetail(null);
    setRejectReason('');
    setDetailLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    const approvalId = detail?.approval?.approvalId;
    if (!approvalId) return;

    const isPending = safeString(detail?.approval?.status).toLowerCase() === STATUS.pending;
    if (!isPending) {
      await GMessageBox.ShowEx({
        title: '승인 실행',
        message: '이미 처리된 승인입니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    const confirmed = await GMessageBox.ShowEx({
      title: '승인 실행',
      message: ['승인 실행(Confirm) 하시겠습니까?', '', `approvalId: ${approvalId}`].join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '실행', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webApproval_confirm(approvalId);

      if (res?.success === false || res?.ok === false) {
        await GMessageBox.ShowEx({
          title: '승인 실행 실패',
          message: safeString(res?.message || res?.code || '승인 실행에 실패했습니다.'),
          type: 'warning',
          buttons: 'Ok',
        });
        await loadList();
        return;
      }

      await GMessageBox.ShowEx({
        title: '승인 완료',
        message: [
          `txId: ${res?.txId || '-'}`,
          `status: ${res?.status || 'success'}`,
          res?.txHash ? `txHash: ${res.txHash}` : null,
        ].filter(Boolean).join('\n'),
        type: 'success',
        buttons: 'Ok',
      });

      await loadList();
      await openApprovalDetail(approvalId);
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '승인 실행 실패',
        message: String(e?.message || e || '승인 실행에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
      await loadList();
    }
  }, [detail, loadList, openApprovalDetail, webApproval_confirm]);

  const handleReject = useCallback(async () => {
    const approvalId = detail?.approval?.approvalId;
    if (!approvalId) return;

    const isPending = safeString(detail?.approval?.status).toLowerCase() === STATUS.pending;
    if (!isPending) {
      await GMessageBox.ShowEx({
        title: '반려',
        message: '이미 처리된 승인입니다.',
        type: 'info',
        buttons: 'Ok',
      });
      return;
    }

    if (!rejectReason?.trim()) {
      await GMessageBox.ShowEx({
        title: '반려',
        message: '반려 사유를 입력해주세요.',
        type: 'warning',
        buttons: 'Ok',
      });
      return;
    }

    const confirmed = await GMessageBox.ShowEx({
      title: '승인 반려',
      message: ['승인 반려(Reject) 하시겠습니까?', '', `사유: ${rejectReason.trim()}`].join('\n'),
      type: 'question',
      buttons: 'YesNo',
      buttonLabels: { yes: '반려', no: '취소' },
    });
    if (confirmed !== 'yes') return;

    try {
      const res = await webApproval_reject(approvalId, { reason: rejectReason.trim() });

      if (res?.success === false || res?.ok === false) {
        await GMessageBox.ShowEx({
          title: '반려 실패',
          message: safeString(res?.message || res?.code || '반려 처리에 실패했습니다.'),
          type: 'warning',
          buttons: 'Ok',
        });
        await loadList();
        return;
      }

      await GMessageBox.ShowEx({
        title: '반려 완료',
        message: `approvalId: ${approvalId}`,
        type: 'success',
        buttons: 'Ok',
      });

      setRejectReason('');
      await loadList();
      await openApprovalDetail(approvalId);
    } catch (e) {
      await GMessageBox.ShowEx({
        title: '반려 실패',
        message: String(e?.message || e || '반려 처리에 실패했습니다.'),
        type: 'error',
        buttons: 'Ok',
      });
      await loadList();
    }
  }, [detail, loadList, openApprovalDetail, rejectReason, webApproval_reject]);

  // 최초 진입 시 1회만 자동 조회 (이후에는 조회 버튼/Enter로 재조회)
  const loadListRef = useRef(loadList);
  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);
  useEffect(() => {
    loadListRef.current();
  }, []);

  const kpiPending = status === STATUS.pending ? total : 0;

  const columns = useMemo(() => {
    return [
      {
        field: 'type',
        headerName: '요청 유형',
        width: 120,
      },
      {
        field: 'requesterName',
        headerName: '요청 주체',
        width: 140,
      },
      {
        field: 'subjectName',
        headerName: '가맹점/대상자',
        width: 220,
        flex: 1,
      },
      {
        field: 'amount',
        headerName: '요청 금액',
        width: 140,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (p) => formatAmount(p?.value),
      },
      {
        field: 'requestedAt',
        headerName: '요청 일시',
        width: 180,
      },
      {
        field: 'status',
        headerName: '상태',
        width: 110,
        renderCell: (p) => {
          const s = safeString(p?.value).toLowerCase();
          if (s === 'approved') return <Chip size="small" label="승인" color="success" />;
          if (s === 'rejected') return <Chip size="small" label="반려" color="warning" />;
          return <Chip size="small" label="대기" variant="outlined" />;
        },
      },
      {
        field: 'actions',
        headerName: '상세',
        width: 110,
        sortable: false,
        filterable: false,
        renderCell: (p) => {
          const approvalId = p?.row?.approvalId;
          return (
            <Button
              size="small"
              variant="outlined"
              onClick={() => openApprovalDetail(approvalId)}
            >
              상세
            </Button>
          );
        },
      },
    ];
  }, [openApprovalDetail]);

  const approval = detail?.approval || null;
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const mintBurn = detail?.mintBurn || {};
  const targets = Array.isArray(mintBurn?.targets) ? mintBurn.targets : [];

  const canAction = safeString(approval?.status).toLowerCase() === STATUS.pending;

  return (
    <GPageContainer>
      {warning && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {warning}
        </Alert>
      )}

      <GSearchSection>
        <GSearchHeader
          title="승인 관리"
          onSearch={loadList}
          onInitialize={() => {
            setStatus(STATUS.pending);
            setKeyword('');
            setWarning(null);
            setItems([]);
            setTotal(0);
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <TextField
              select
              size="small"
              label="상태"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ width: { xs: '100%', md: 200 } }}
            >
              <MenuItem value={STATUS.pending}>대기</MenuItem>
              <MenuItem value={STATUS.approved}>승인</MenuItem>
              <MenuItem value={STATUS.rejected}>반려</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="키워드"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadList();
              }}
              placeholder="approvalId/대상자/요청자/사유"
              sx={{ width: { xs: '100%', md: 360 } }}
            />
          </Stack>
        </GSearchHeader>
      </GSearchSection>

      {/* KPI */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              승인 대기 건수
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {kpiPending.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              경고 발생 건수
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              0
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              (사전 검증/잔액 부족 등: TBD)
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              승인 후 예상 준비금 비율
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              TBD
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              (계산식/서버 제공: TBD)
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* 목록 */}
      <Box sx={{ width: '100%' }}>
        <GDataGrid
          title={`승인 목록 (총 ${total.toLocaleString()}건)`}
          rows={items}
          columns={columns}
          height={560}
          Buttons={{ add: 0, delete: 0, revert: 0, excel: 0 }}
          disableRowSelectionOnClick
        />
      </Box>

      {/* 상세 팝업 */}
      <Dialog
        open={openDetail}
        onClose={closeDetail}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>승인 상세</DialogTitle>
        <DialogContent dividers>
          {detailLoading && (
            <Typography variant="body2">로딩 중...</Typography>
          )}

          {!detailLoading && !approval && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              상세 데이터가 없습니다.
            </Typography>
          )}

          {!detailLoading && approval && (
            <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                요약
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">approvalId</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {approval?.approvalId}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">유형</Typography>
                  <Typography variant="body1">{approval?.type}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">상태</Typography>
                  <Typography variant="body1">{approval?.status}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">요청 금액</Typography>
                  <Typography variant="body1">{formatAmount(approval?.amount)}</Typography>
                </Box>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Mint/Burn 상세
              </Typography>
              <Divider sx={{ my: 1 }} />
              <TextField
                value={toPrettyJson(mintBurn)}
                fullWidth
                multiline
                minRows={6}
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Box>

            {targets.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  대상 목록
                </Typography>
                <Divider sx={{ my: 1 }} />
                <GDataGrid
                  showTitle={false}
                  rows={targets}
                  columns={[
                    { field: 'employeeId', headerName: '사번', width: 140 },
                    {
                      field: 'amount',
                      headerName: '금액',
                      width: 140,
                      align: 'right',
                      headerAlign: 'right',
                      valueFormatter: (p) => formatAmount(p?.value),
                    },
                    { field: 'note', headerName: '비고', flex: 1, minWidth: 240 },
                  ]}
                  height={320}
                  Buttons={{ add: 0, delete: 0, revert: 0, excel: 0 }}
                  disableRowSelectionOnClick
                />
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                반려 사유
              </Typography>
              <Divider sx={{ my: 1 }} />
              <TextField
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                size="small"
                placeholder="반려 사유를 입력해주세요 (반려 시 필수)"
                disabled={!canAction}
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                타임라인
              </Typography>
              <Divider sx={{ my: 1 }} />
              {timeline.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  타임라인 데이터가 없습니다.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {timeline.map((t, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={safeString(t?.status)} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {safeString(t?.at)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        {safeString(t?.by)}
                      </Typography>
                      {t?.reason ? (
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                          ({safeString(t?.reason)})
                        </Typography>
                      ) : null}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 2, py: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={!canAction}
            data-auth="Approve"
          >
            승인 실행
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleReject}
            disabled={!canAction}
            data-auth="Reject"
          >
            반려
          </Button>
          <Button
            variant="outlined"
            onClick={closeDetail}
            data-auth="PUBLIC"
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </GPageContainer>
  );
}
