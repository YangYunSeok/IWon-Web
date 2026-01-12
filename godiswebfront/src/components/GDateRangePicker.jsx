import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const GDateRangePicker = ({
  value,
  onChange,
  width = '100%',
  height = 25,
  placeholder = ['시작일', '종료일'],
  disabled = false,
  format = 'YYYY-MM-DD',
  style = {}
}) => {
  const handleChange = (dates, dateStrings) => {
    if (onChange) {
      onChange(dateStrings);
    }
  };

  const getDayjsValue = () => {
    if (!value) return undefined;
    
    if (Array.isArray(value) && value.length === 2) {
      return [
        value[0] ? dayjs(value[0], format) : null,
        value[1] ? dayjs(value[1], format) : null
      ];
    }
    return undefined;
  };

  const commonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    minWidth: typeof width === 'number' ? `${width}px` : width,
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    height: `${height}px`,
    minHeight: `${height}px`,
    ...style
  };

  return (
    <>
      <style>{`
        .g-range-picker.ant-picker {
          border-color: #c3c3c3 !important;
        }
        .g-range-picker.ant-picker:hover {
          border-color: #000000 !important;
        }
        .g-range-picker.ant-picker-focused {
          border-color: #c3c3c3 !important;
          box-shadow: 0 0 0 2px rgba(195, 195, 195, 0.2) !important;
        }
      `}</style>
      <RangePicker
        value={getDayjsValue()}
        onChange={handleChange}
        format={format}
        style={commonStyle}
        placeholder={placeholder}
        disabled={disabled}
        separator="~"
        suffixIcon={null}
        allowClear={false}
        className="g-range-picker"
      />
    </>
  );
};

export default GDateRangePicker;

// 사용 예시:
/*
import GDateRangePicker from './GDateRangePicker';

// 1. 기본 사용
<GDateRangePicker
  value={[startDate, endDate]}
  onChange={(dates) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  }}
  width={300}
/>

// 2. 포맷 변경
<GDateRangePicker
  value={[startDate, endDate]}
  onChange={(dates) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  }}
  width={300}
  format="YYYY/MM/DD"
/>

// 3. placeholder 커스터마이징
<GDateRangePicker
  value={[startDate, endDate]}
  onChange={(dates) => {
    setStartDate(dates[0]);
    setEndDate(dates[1]);
  }}
  width={300}
  placeholder={['시작', '종료']}
/>
*/