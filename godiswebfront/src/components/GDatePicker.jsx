import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const GDatePicker = ({
  value,
  onChange,
  width = '100%',
  height = 25,
  placeholder = '날짜 선택',
  disabled = false,
  format = 'YYYY-MM-DD',
  showCalendarIcon = false,
  allowClear = true,
  style = {}
}) => {
  const handleChange = (date, dateString) => {
    if (onChange) {
      onChange(dateString);
    }
  };

  const getDayjsValue = () => {
    return value ? dayjs(value, format) : undefined;
  };

  const commonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    minWidth: typeof width === 'number' ? `${width}px` : width,
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    height: `${height}px`,
    minHeight: `${height}px`,
    ...style
  };

  const pickerProps = {
    value: getDayjsValue(),
    onChange: handleChange,
    format,
    style: commonStyle,
    placeholder,
    disabled,
    allowClear,
    className: 'g-date-picker',
  };

  if (!showCalendarIcon) {
    pickerProps.suffixIcon = null;
  }

  return (
    <>
      <style>{`
        .g-date-picker.ant-picker {
          border-color: #c3c3c3 !important;
        }
        .g-date-picker.ant-picker:hover {
          border-color: #000000 !important;
        }
        .g-date-picker.ant-picker-focused {
          border-color: #c3c3c3 !important;
          box-shadow: 0 0 0 2px rgba(195, 195, 195, 0.2) !important;
        }
      `}</style>
      <DatePicker {...pickerProps} />
    </>
  );
};

export default GDatePicker;