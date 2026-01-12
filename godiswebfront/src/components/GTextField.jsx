import React, { useState, useEffect } from 'react';
import { TextField, useTheme } from '@mui/material';

// ===== 공통 Validation 규칙 =====
export const validationRules = {
	email: {
		regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		message: '유효한 이메일 주소를 입력하세요.'
	},
	phone: {
		regex: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
		message: '유효한 전화번호를 입력하세요. (예: 010-1234-5678)'
	},
	url: {
		regex: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
		message: '유효한 URL을 입력하세요.'
	},
	number: {
		regex: /^\d+$/,
		message: '숫자만 입력 가능합니다.'
	},
	alphanumeric: {
		regex: /^[a-zA-Z0-9]+$/,
		message: '영문과 숫자만 입력 가능합니다.'
	},
	korean: {
		regex: /^[가-힣]+$/,
		message: '한글만 입력 가능합니다.'
	},
};

export default function GTextField({
	readOnly = false,
	required = false,
	numeric = false,
	maxLength,
	minLength,
	transform,
	value = '',
	onChange,
	onFieldChange,
	fieldName,
	fullWidth = true,
	size = 'small',
	inputProps = {},
	InputProps = {},
	sx = {},
	
	// ===== Validation 관련 props =====
	validation,          // 'email' | 'phone' | 'url' 등 또는 커스텀 regex
	validationMessage,   // 커스텀 에러 메시지
	onValidationChange,  // (isValid, errorMessage) => void
	showErrorOnBlur = true,  // blur 시에만 에러 표시
	
	...props
}) {
	const theme = useTheme();
	const [error, setError] = useState(false);
	const [helperText, setHelperText] = useState('');
	const [touched, setTouched] = useState(false);

	// Validation 규칙 가져오기
	const getValidationRule = () => {
		if (!validation) return null;
		
		// 문자열로 전달된 경우 (예: 'email', 'phone')
		if (typeof validation === 'string') {
			return validationRules[validation];
		}
		
		// 정규식으로 직접 전달된 경우
		if (validation instanceof RegExp) {
			return {
				regex: validation,
				message: validationMessage || '유효하지 않은 입력입니다.'
			};
		}
		
		// 객체로 전달된 경우 { regex, message }
		if (typeof validation === 'object' && validation.regex) {
			return validation;
		}
		
		return null;
	};

	// Validation 실행
	const validateValue = (val) => {
		const rule = getValidationRule();
		
		if (!rule) return { isValid: true, message: '' };
		
		// 빈 값은 required가 아니면 통과
		if (!val && !required) {
			return { isValid: true, message: '' };
		}
		
		// 빈 값인데 required인 경우
		if (!val && required) {
			return { isValid: false, message: '필수 입력 항목입니다.' };
		}
		
		// minLength 체크
		if (minLength && val.length < minLength) {
			return { 
				isValid: false, 
				message: `최소 ${minLength}자 이상 입력해야 합니다.` 
			};
		}
		
		// 정규식 검사
		const isValid = rule.regex.test(val);
		return {
			isValid,
			message: isValid ? '' : (validationMessage || rule.message)
		};
	};

	// value 변경 시 validation (실시간)
	useEffect(() => {
		if (!showErrorOnBlur || touched) {
			const { isValid, message } = validateValue(value);
			setError(!isValid);
			setHelperText(message);
			
			// 부모 컴포넌트에 validation 상태 전달
			if (onValidationChange) {
				onValidationChange(isValid, message);
			}
		}
	}, [value, touched, showErrorOnBlur]);

	const getBackgroundColor = () => {
		if (readOnly) {
			return theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.action.disabledBackground;
		}
		if (required) {
			return theme.palette.mode === 'light' ? '#ffff99' : theme.palette.warning.dark;
		}
		return theme.palette.background.paper;
	};

	const handleChange = (e) => {
		let newValue = e.target.value;

		// 숫자만 입력 허용
		if (numeric) {
			newValue = newValue.replace(/\D/g, '');
		}

		// 최대 길이 제한
		if (maxLength && newValue.length > maxLength) {
			newValue = newValue.slice(0, maxLength);
		}

		// 대소문자 변환
		if (transform === 'uppercase') {
			newValue = newValue.toUpperCase();
		} else if (transform === 'lowercase') {
			newValue = newValue.toLowerCase();
		}

		// 핸들러 호출
		if (onChange) {
			const modifiedEvent = {
				...e,
				target: { ...e.target, value: newValue }
			};
			onChange(modifiedEvent);
		} else if (onFieldChange && fieldName) {
			onFieldChange(fieldName, newValue);
		}
	};

	const handleBlur = (e) => {
		setTouched(true);
		
		// blur 시 validation
		if (showErrorOnBlur) {
			const { isValid, message } = validateValue(e.target.value);
			setError(!isValid);
			setHelperText(message);
			
			if (onValidationChange) {
				onValidationChange(isValid, message);
			}
		}
		
		// 기존 onBlur 핸들러 호출
		if (props.onBlur) {
			props.onBlur(e);
		}
	};

	const mergedInputProps = {
		...inputProps,
		...(numeric && {
			inputMode: 'numeric',
			pattern: '[0-9]*',
		}),
		...(maxLength && {
			maxLength: maxLength,
		}),
	};

	return (
		<TextField
			fullWidth={fullWidth}
			size={size}
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			error={error}
			helperText={helperText || props.helperText}
			inputProps={mergedInputProps}
			InputProps={{
				readOnly: readOnly,
				sx: {
					backgroundColor: getBackgroundColor(),
				},
				...InputProps,
			}}
			sx={sx}
			{...props}
		/>
	);
}