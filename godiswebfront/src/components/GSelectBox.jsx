// src/components/GSelectBox.jsx
import React, { forwardRef, useMemo, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  useTheme,
} from '@mui/material';

/**
 * GSelectBox
 * - items: 서버에서 받은 Array<Object>
 * - valueKey: 값 키 (예: 'grp_CD_ID')
 * - labelKey: 표시 키 (예: 'grp_NM')
 * - value: 선택값(제어 컴포넌트) - 미지정 시 비제어 모드로 동작
 * - defaultValue: 비제어 모드 초기값
 * - onChange: (value, item) => void  // 선택 시 value와 원본 item을 함께 콜백(선택)
 * - fieldName: 필드명 (자동 onChange 처리용)
 * - onFieldChange: 필드 변경 핸들러 함수
 * - readOnly: true면 회색 배경
 * - required: true면 형광 노란색 배경
 * - toplabel: 'A' | 'S' | null       // 'A' => -- All --, 'S' => -- Select --
 * - topLabelText: string             // 위 문구를 직접 지정(선택)
 * - label: 상단 라벨 텍스트 (MUI InputLabel)
 * - name: 폼 제출용 name (지정 시 hidden input 자동 생성)
 * - helperText: 하단 도움말
 */
const GSelectBox = forwardRef(function GSelectBox(
  {
    items = [],
    valueKey = 'code',
    labelKey = 'name',
    value,                // 제어모드일 때 값
    defaultValue = '',    // 비제어모드 초기값
    onChange,
    fieldName,
    onFieldChange,
    readOnly = false,
    required = false,
    toplabel = null,
    topLabelText,
    label,
    helperText,
    name,                 // 폼 제출용 hidden input name
    error = false,
    disabled = false,
    size = 'small',
    fullWidth = true,
    variant = 'outlined',
    sx,
    MenuProps,
    id,                   // 선택 id 직접 지정 가능
    ...rest
  },
  ref
) {
  const theme = useTheme();
  // 제어/비제어 판별
  const isControlled = value !== undefined;

  // 비제어 모드 내부 값
  const [innerValue, setInnerValue] = useState(defaultValue ?? '');

  // 상단 기본 항목 문구
  const topLabelResolved = useMemo(() => {
    if (!toplabel) return null;
    if (topLabelText) return topLabelText;
    if (toplabel === 'A') return '-- All --';
    if (toplabel === 'S') return '-- Select --';
    return null;
  }, [toplabel, topLabelText]);

  // 내부용 표준화 [{value, label, raw}]
  const normalized = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((it) => ({
      value: it?.[valueKey],
      label: it?.[labelKey],
      raw: it,
    }));
  }, [items, valueKey, labelKey]);

  // 현재 표시/제출 값
  const currentValue = isControlled ? (value ?? '') : innerValue;

  // 배경색 결정 (우선순위: readOnly > required)
  const getBackgroundColor = () => {
    if (readOnly) {
      return theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.action.disabledBackground;
    }
    if (required) {
      return theme.palette.mode === 'light' ? '#ffff99' : theme.palette.warning.dark;
    }
    return theme.palette.background.paper;
  };

  const handleChange = (evt) => {
    // readOnly일 때는 변경 불가
    if (readOnly) return;

    const nextValue = evt.target.value;
    const found = normalized.find((n) => n.value === nextValue) || null;

    // 비제어 모드면 내부 상태 업데이트
    if (!isControlled) setInnerValue(nextValue);

    // onChange 우선, 없으면 onFieldChange 사용
    if (onChange) {
      onChange(nextValue, found?.raw ?? null);
    } else if (onFieldChange && fieldName) {
      onFieldChange(fieldName, nextValue);
    }
  };

  // ref로 값/아이템 접근 지원
  useImperativeHandle(ref, () => ({
    /** 현재 선택값 반환 */
    value: currentValue,
    getValue: () => currentValue,
    /** 현재 선택된 원본 아이템 반환 (없으면 null) */
    getSelectedItem: () => {
      const found = normalized.find((n) => n.value === currentValue);
      return found?.raw ?? null;
    },
    /** 비제어 모드에서 값 설정 */
    setValue: (v) => {
      if (!isControlled) setInnerValue(v ?? '');
      // 제어 모드에서는 외부에서 value를 바꿔야 반영됩니다.
    },
  }), [currentValue, normalized, isControlled]);

  // InputLabel과 Select 연동용 id
  const selectId = id || `gselect-${(label || 'field')}`.replace(/\s+/g, '').toLowerCase();
  const labelId = `${selectId}-label`;

  return (
    <FormControl
      fullWidth={fullWidth}
      size={size}
      variant={variant}
      error={error}
      disabled={disabled}
      sx={sx}
    >
      {label ? <InputLabel id={labelId}>{label}</InputLabel> : null}

      <Select
        labelId={label ? labelId : undefined}
        id={selectId}
        label={label || undefined}
        value={currentValue}
        onChange={handleChange}
        displayEmpty={Boolean(topLabelResolved)}
        MenuProps={MenuProps}
        inputProps={{
          readOnly: readOnly,
        }}
        sx={{
          backgroundColor: getBackgroundColor(),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: readOnly ? '#ccc' : undefined,
          },
          cursor: readOnly ? 'not-allowed' : 'pointer',
        }}
        {...rest}
      >
        {topLabelResolved && (
          // 상단 기본 항목은 빈 값('')으로 둡니다.
          <MenuItem value="">
            {topLabelResolved}
          </MenuItem>
        )}

        {normalized.map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      {/* name이 있으면 form submit을 위한 hidden input 생성 */}
      {name ? <input type="hidden" name={name} value={currentValue} readOnly /> : null}

      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
});

GSelectBox.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  onChange: PropTypes.func, // (value, item) => void
  fieldName: PropTypes.string,
  onFieldChange: PropTypes.func,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  toplabel: PropTypes.oneOf(['A', 'S', null]),
  topLabelText: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  fullWidth: PropTypes.bool,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  sx: PropTypes.any,
  MenuProps: PropTypes.object,
  id: PropTypes.string,
};

export default GSelectBox;