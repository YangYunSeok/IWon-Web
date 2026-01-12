import React from 'react';
import { Box, Typography, TextField, Select, MenuItem, RadioGroup, FormControlLabel, Radio, Button } from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import GSelectBox from '@/components/GSelectBox';

export default function CustomGrid({ columns = 4, fields = [] }) {
  // 한 줄에 columns 개수로 나누고, 빈 칸 처리
  const rows = [];
  for (let i = 0; i < fields.length; i += columns) {
    const row = fields.slice(i, i + columns);
    while (row.length < columns) row.push(null); // 빈 칸
    rows.push(row);
  }

  const renderField = (field) => {
    if (!field) return null;

    // content가 있으면 바로 렌더링
    if (field.content) {
      return field.content;
    }

    switch (field.type) {
      case 'select':
        return (
          <Select 
            size="small" 
            fullWidth
            name={field.name}
            value={field.value || ''}
            onChange={(e) => field.onChange?.(e.target.value)}
            disabled={field.disabled}
          >
            {field.options?.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        );
      
      case 'codeselect':
        return (
          <GSelectBox
            grpCdId={field.grpCdId}
            value={field.value || ''}
            onChange={field.onChange}
            includeAll={false}
            includeSelect={false}
            width="100%"
            height={32}
            disabled={field.disabled}
            readOnly={field.readOnly}
            style={{ width: '100%' }}
          />
        );
      
      case 'dataselect':
        return (
          <GSelectBox
            data={field.options}
            valueKey="value"
            labelKey="label"
            value={field.value || ''}
            onChange={field.onChange}
            includeAll={false}
            includeSelect={false}
            width="100%"
            height={32}
            disabled={field.disabled}
            readOnly={field.readOnly}
            style={{ width: '100%' }}
          />
        );

      case 'radio':
        return (
          <RadioGroup 
            row 
            name={field.name}
            value={field.value || ''}
            onChange={(e) => field.onChange?.(e.target.value)}
            sx={{ width: '100%', ml: 1}}
          >
            {field.options?.map((opt) => (
              <FormControlLabel 
                key={opt.value} 
                value={opt.value} 
                control={<Radio size="small" />} 
                label={opt.label} 
              />
            ))}
          </RadioGroup>
        );
      
      case 'date':
        return (
          <DatePicker
            value={field.value ? dayjs(field.value, 'YYYYMMDD') : null}
            onChange={(date) => {
              if (date) {
                const dateStr = dayjs(date).format('YYYYMMDD');
                field.onChange?.(dateStr);
              } else {
                field.onChange?.('');
              }
            }}
            format="YYYY-MM-DD"
            disabled={field.disabled || field.readOnly}
            minDate={dayjs('1900-01-01')}
            maxDate={dayjs('9999-12-31')}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                InputProps: { 
                  style: { fontSize: '13px', height: '32px' }
                },
                sx: { '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#d0d0d0' } } }
              }
            }}
            sx={{ width: '100%' }}
          />
        );

      case 'text':
      default:
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
            <TextField
              fullWidth
              size="small"
              name={field.name}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={field.placeholder || ''}
              disabled={field.disabled}
              InputProps={{
                readOnly: field.readOnly,
                style: { fontSize: '13px', height: '32px' }
              }}
              sx={{ '& .MuiOutlinedInput-root': { height: '32px' } }}
            />
            {field.actionButton && (
              <Button
                variant="contained"
                size="small"
                onClick={field.actionButton.onClick}
                disabled={field.actionButton.disabled}
                style={{ 
                  whiteSpace: 'nowrap', 
                  height: 32, 
                  fontSize: '12px', 
                  minWidth: 110, 
                  backgroundColor: '#1976d2', 
                  color: '#fff' 
                }}
              >
                {field.actionButton.label}
              </Button>
            )}
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        p: 1,
        border: `0.5px solid ${blueGrey[100]}`,
        borderRadius: 1,
        backgroundColor: '#f9f9f9'
      }}
    >
      {rows.map((row, rowIdx) => (
        <Box key={rowIdx} sx={{ display: 'flex', width: '100%'}}>
          {row.map((field, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 0',
                minWidth: 150,
                border: field?.label ? '0.5px solid #ddd' : 'none',
                borderRadius: 1,
                backgroundColor: field?.label ? '#fff' : 'transparent',
                p: field ? 0.5 : 0,
              }}
            >
              {field?.label && (
                <>
                  <Typography
                    sx={{
                      flex: '0 0 30%',
                      backgroundColor: '#f5f5f5',
                      fontSize: 14,
                      fontWeight: 400,
                      textAlign: 'right',
                      p: 1,
                      borderRight: '0.5px solid #ddd',
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0, pl: 0.5 }}>{renderField(field)}</Box>
                </>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}