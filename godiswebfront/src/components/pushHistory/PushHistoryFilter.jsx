import { useState, useEffect } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "./css/pushHistory.css";

export default function PushHistoryFilter({ filters, setFilters, onSearch }) {
  const [error, setError] = useState(false);

  const start = filters.startDate ? dayjs(filters.startDate) : null;
  const end = filters.endDate ? dayjs(filters.endDate) : null;

  const handleSearchClick = () => {
    if (start && end && start.isAfter(end, "day")) {
      setError(true);
      return;
    }
    setError(false);
    onSearch();
  };

    useEffect(() => {
    if (!error) return; 
    const invalid = start && end && start.isAfter(end, "day");
    if (!invalid) setError(false); 
  }, [start, end, error]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box className="ph-grid">
        <DatePicker
          label="시작일"
          format="YYYY-MM-DD"
          value={start}
          onChange={(value) =>
            setFilters((f) => ({
              ...f,
              startDate: value ? value.format("YYYY-MM-DD") : "",
            }))
          }
          slotProps={{
            textField: {
              size: "small",
              label: "시작일",
              variant: "outlined",
              className: "ph-datefield", // ← CSS로 너비 제어
              InputLabelProps: { shrink: true },
            },
          }}
        />

        <DatePicker
          label="종료일"
          format="YYYY-MM-DD"
          value={end}
          onChange={(value) =>
            setFilters((f) => ({
              ...f,
              endDate: value ? value.format("YYYY-MM-DD") : "",
            }))
          }
          slotProps={{
            textField: {
              size: "small",
              label: "종료일",
              variant: "outlined",
              className: "ph-datefield",
              InputLabelProps: { shrink: true },
            },
          }}
        />

        <Box className="ph-searchBtnCell">
          <Button
            variant="contained"
            onClick={handleSearchClick}
            className="ph-searchBtn"
            disabled={error}
          >
            검색
          </Button>
        </Box>

        {/* 오류 메시지 (검색 클릭 시에만 노출) */}
        {error && (
          <Typography className="ph-errorText">
            시작일이 종료일보다 클 수 없습니다.
          </Typography>
        )}

        {/* 체크박스 */}
        <Box className="ph-checkboxCell">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.includeMsg}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, includeMsg: e.target.checked }))
                }
              />
            }
            label="수신메시지 포함 Total(0)"
            sx={{
              my: 0,
              "& .MuiTypography-root": { fontSize: 12 },
            }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
