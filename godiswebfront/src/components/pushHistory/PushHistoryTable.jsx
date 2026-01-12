import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Typography,
} from "@mui/material";
import "./css/pushHistory.css";

export default function PushHistoryTable({ rows }) {
  return (
    <TableContainer
      component={Paper}
      className="ph-tableContainer"
    >
      <Table
        stickyHeader
        size="small"
        aria-label="push-history-table"
        sx={{ tableLayout: "fixed" }}   // ✅ 셀 너비 고정
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "120px"}}>발신자</TableCell>
            <TableCell>메시지</TableCell>
            <TableCell sx={{width: "300px"}}>발송 시각</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" className="ph-emptyText">
                  조회 결과가 없습니다.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell className="ph-cell">{r.sender}</TableCell>
                <TableCell className="ph-cell ph-msgCell">{r.msg}</TableCell>
                <TableCell className="ph-cell">{r.time}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
