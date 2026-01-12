import { Box, Pagination } from "@mui/material";
import "./css/PushPagination.css";

export default function PushPagination({ page, totalCount, pageSize, onChange }) {
  const _total = Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0;
  const _size  = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 10;

  const totalPages = Math.max(1, Math.ceil(_total / _size));
  const current = Number(page) + 1;

  return (
    <Box className="push-pagination__container">
      <Pagination
        className="push-pagination"
        count={totalPages}
        page={current}
        onChange={(_, p1) => onChange(p1 - 1)}
        variant="text"
        shape="rounded"
        siblingCount={2}
        boundaryCount={1}
        showFirstButton
        showLastButton
      />
    </Box>
  );
}