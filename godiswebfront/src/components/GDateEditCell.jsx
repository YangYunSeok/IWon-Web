import * as React from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

dayjs.extend(customParseFormat);

export default function GDateEditCell(props) {
  const { id, field, value, api } = props;

  const current = React.useMemo(() => {
    if (!value) return null;
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 8) {
      const d = dayjs(digits, 'YYYYMMDD', true);
      return d.isValid() ? d : null;
    }
    let d = dayjs(value, 'YYYY-MM-DD', true);
    if (!d.isValid()) d = dayjs(value);
    return d.isValid() ? d : null;
  }, [value]);

  const commit = (newDayjs) => {
    const nextStr =
      newDayjs && newDayjs.isValid() ? newDayjs.format('YYYYMMDD') : '';
    api.setEditCellValue({ id, field, value: nextStr });
    api.stopCellEditMode({ id, field });
  };

  const MIN = dayjs('0001-01-01');       // 필요에 맞게 조정
  const MAX = dayjs('9999-12-31');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* 셀 padding을 제거하고 DatePicker가 정확히 들어가도록 */}
      <Box
        sx={{
          mx: -1,
          my: -0.5, // 🔹 위아래 패딩 제거
          width: 'calc(100% + 16px)',
          height: '100%',
          display: 'flex',
          alignItems: 'center', // 수직 중앙 정렬
        }}
      >
        <DatePicker
          value={current}
          onChange={commit}
          format="YYYY-MM-DD"
          minDate={MIN}
          maxDate={MAX}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              sx: {
                height: 26,
                '& .MuiInputBase-input': {
                  py: 0, // 🔹 내부 여백 완전 제거
                  fontSize: 13,
                  textAlign: 'center',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent', // 🔹 border도 얇게
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
