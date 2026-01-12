import React, { useState, useEffect, useMemo } from 'react';
import { Stack, TextField, Radio, RadioGroup, FormControlLabel, Button } from '@mui/material';
import { message } from 'antd';
import GModal from '@/components/GModal.jsx';
import GSelectBox from '@/components/GSelectBox';
import GMessageBox from '@/components/GMessageBox.jsx';
import { http } from '@/libs/TaskHttp';
import GTextField from '@/components/GTextField';

export default function METASDTSD01P1({
  open,
  onClose,
  onSuccess,
  mode = 'add',
  isTerm = false,
  data = null,
  cacheWordSecCd = [],
  cacheWordTpCd = [],
  cacheWordDtlTpCd = [],
}) {
  //  초기값을 함수로 분리
  const getInitialFormData = () => ({
    WORD_NO: '',
    WORD_KOR_NM: '',
    WORD_ENG_NM: '',
    WORD_ENG_FULL_NM: '',
    WORD_SEC_CD: 'BW',
    WORD_TP_CD: '',
    WORD_DTL_TP_CD: '',
    WORD_DEFIN_DSC: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);

  // 단어유형에 따라 단어소분류 필터링
  const filteredWordDtlTpCd = useMemo(() => {
    if (!formData.WORD_TP_CD || !cacheWordDtlTpCd || cacheWordDtlTpCd.length === 0) {
      return [];
    }
    
    return cacheWordDtlTpCd.filter(item => item.UP_CD_VAL === formData.WORD_TP_CD);
  }, [formData.WORD_TP_CD, cacheWordDtlTpCd]);

  // ===== mode와 open 변경 시 폼 초기화 =====
  useEffect(() => {
    if (!open) {
      //  모달이 닫힐 때 상태 초기화 (다음 열림을 위해)
      setFormData(getInitialFormData());
      setIsDuplicateChecked(false);
      return;
    }

    //  모달이 열릴 때 mode에 따라 초기화
    if (mode === 'add') {
      setFormData({
        WORD_NO: '',
        WORD_KOR_NM: isTerm? data.WORD_KOR_NM|| '' : '',
        WORD_ENG_NM: '',
        WORD_ENG_FULL_NM: '',
        WORD_SEC_CD: data?.WORD_SEC_CD || 'BW',
        WORD_TP_CD: '',
        WORD_DTL_TP_CD: '',
        WORD_DEFIN_DSC: '',
      });
      setIsDuplicateChecked(false);
    } else if ((mode === 'edit' || mode === 'delete') && data) {
      setFormData({
        WORD_NO: data.WORD_NO || '',
        WORD_KOR_NM: data.WORD_KOR_NM || '',
        WORD_ENG_NM: data.WORD_ENG_NM || '',
        WORD_ENG_FULL_NM: data.WORD_ENG_FULL_NM || '',
        WORD_SEC_CD: data.WORD_SEC_CD || 'BW',
        WORD_TP_CD: data.WORD_TP_CD || '',
        WORD_DTL_TP_CD: data.WORD_DTL_TP_CD || '',
        WORD_DEFIN_DSC: data.WORD_DEFIN_DSC || '',
      });
      setIsDuplicateChecked(true);
    }
  }, [open, mode]);

  // ===== 입력 변경 핸들러 =====
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 단어영문명 변경 시 중복검사 초기화
    if (field === 'WORD_ENG_NM' && mode === 'add') {
      setIsDuplicateChecked(false);
    }

    //  단어구분 변경 시 관련 필드만 초기화 (전체 초기화 X)
    if (field === 'WORD_SEC_CD') {
      setFormData((prev) => ({
        ...prev,
        WORD_SEC_CD: value,
        WORD_TP_CD: '',
        WORD_DTL_TP_CD: '',
        //  이미 입력한 단어명/영문명은 유지
      }));
    }

    // 단어유형 변경 시 단어소분류 초기화
    if (field === 'WORD_TP_CD') {
      setFormData((prev) => ({
        ...prev,
        WORD_TP_CD: value,
        WORD_DTL_TP_CD: '', // 소분류 초기화
      }));
    }
  };

  // ===== 중복검사 핸들러 =====
  const handleDuplicateCheck = async () => {
    if (!formData.WORD_ENG_NM.trim()) {
      message.warning('단어영문명을 입력해주세요.');
      return;
    }

    try {
      const response = await http.post(
        '/meta/checkWordEngNmDuplicate',
        { WORD_ENG_NM: formData.WORD_ENG_NM },
        { shape: 'datarow', showSpinner: true }
      );

      console.log('===== 중복검사 응답 =====', response);

      if (response && response.row.isDuplicate === true) {
        message.error('이미 사용 중인 단어영문명입니다.');
        setIsDuplicateChecked(false);
      } else {
        message.success('사용 가능한 단어영문명입니다.');
        setIsDuplicateChecked(true);
      }
    } catch (e) {
      console.error(e);
      message.error(e.message || '중복검사 중 오류가 발생했습니다.');
      setIsDuplicateChecked(false);
    }
  };

  // ===== 필수값 검증 =====
  const validate = () => {
    // 단어명 검증
    if (!formData.WORD_KOR_NM.trim()) {
      message.warning('단어명을 입력해주세요.');
      return false;
    }
    if (!/^[0-9a-zA-Z가-힣]+$/.test(formData.WORD_KOR_NM)) {
      message.warning('단어명은 한글, 영어, 숫자만 입력 가능합니다. (띄어쓰기, 특수문자 불가)');
      return false;
    }
    
    // 단어영문명 검증
    if (!formData.WORD_ENG_NM.trim()) {
      message.warning('단어영문명을 입력해주세요.');
      return false;
    }
    if (!/^[0-9a-zA-Z]+$/.test(formData.WORD_ENG_NM)) {
      message.warning('단어영문명은 영어, 숫자만 입력 가능합니다. (띄어쓰기, 특수문자, 한글 불가)');
      return false;
    }
    
    // 단어영문정식명 검증
    if (!formData.WORD_ENG_FULL_NM.trim()) {
      message.warning('단어영문정식명을 입력해주세요.');
      return false;
    }
    if (!/^[0-9a-zA-Z가-힣\s]+$/.test(formData.WORD_ENG_FULL_NM)) {
      message.warning('단어영문정식명은 한글, 영어, 숫자, 띄어쓰기만 입력 가능합니다. (특수문자 불가)');
      return false;
    }
    
    if (mode === 'add' && !isDuplicateChecked) {
      message.warning('단어영문명 중복검사를 진행해주세요.');
      return false;
    }
    
    if (!formData.WORD_SEC_CD) {
      message.warning('단어구분을 선택해주세요.');
      return false;
    }

    if (formData.WORD_SEC_CD === 'GW') {
      if (!formData.WORD_TP_CD) {
        message.warning('단어유형을 선택해주세요.');
        return false;
      }
      if (!formData.WORD_DTL_TP_CD) {
        message.warning('단어소분류를 선택해주세요.');
        return false;
      }
    }

    return true;
  };

  // ===== 저장/삭제 핸들러 =====
  const handleSave = async () => {
    if (!validate()) return;

    try {
      const msgCode = mode === 'add' ? 'MGQ00004' : 'MGQ00005';
      const r = await GMessageBox.Show(msgCode, 'YesNo', '단어');
      if (r === 'no') return;

      const endpoint = mode === 'add' ? '/meta/insertWord' : '/meta/updateWord';
      await http.post(endpoint, formData, { shape: 'datarow', showSpinner: true });

      message.success(mode === 'add' ? '단어가 추가되었습니다.' : '단어가 수정되었습니다.');
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      // const r = await GMessageBox.Show('MGQ00065', 'YesNo', '단어');
      // if (r === 'no') return;

      const response = await http.post(
        '/meta/deleteWord',
        { WORD_NO: formData.WORD_NO },
        { shape: 'datarow', showSpinner: true }
      );

      if (response.row.success === false) {
        message.error(response.row.message);
        onSuccess();
        onClose();
        return;
      }

      message.success('단어가 삭제되었습니다.');
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add': return '단어 추가';
      case 'edit': return '단어 수정';
      case 'delete': return '단어 삭제';
      default: return '단어 관리';
    }
  };

  const getButtons = () => {
    if (mode === 'delete') {
      return [
        { label: 'Delete', onClick: handleDelete, auth: 'Delete' },
        { label: 'Cancel', onClick: onClose, auth: 'Cancel' },
      ];
    }
    return [
      { label: 'Save', onClick: handleSave, auth: 'Save' },
      { label: 'Cancel', onClick: onClose, auth: 'Cancel' },
    ];
  };

  const isBasicWord = formData.WORD_SEC_CD === 'BW';

  // ===== 삭제 모드 =====
  if (mode === 'delete') {
    return (
      <GModal open={open} onClose={onClose} title={getTitle()} maxWidth="sm" buttons={getButtons()}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
            <strong>{formData.WORD_KOR_NM}</strong> 단어를 삭제하시겠습니까?
            <br />
            삭제된 데이터는 복구할 수 없습니다.
          </div>
        </Stack>
      </GModal>
    );
  }

  // ===== 신규/수정 모드 폼 =====
  return (
    <GModal open={open} onClose={onClose} title={getTitle()} maxWidth="md" buttons={getButtons()}>
      <Stack spacing={2} sx={{ p: 2 }}>
        {/* 단어구분 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            단어구분 <span style={{ color: 'red' }}>*</span>
          </div>
          <RadioGroup
            row
            value={formData.WORD_SEC_CD}
            onChange={(e) => handleChange('WORD_SEC_CD', e.target.value)}
          >
            <FormControlLabel 
              value="BW" 
              control={<Radio disabled={mode === 'edit' || (mode === 'add' && data?.RESTRICT_WORD_SEC_CD)} />}
              label="기본단어" 
            />
            <FormControlLabel 
              value="GW" 
              control={<Radio disabled={mode === 'edit' || (mode === 'add' && data?.RESTRICT_WORD_SEC_CD)} />}
              label="분류단어" 
            />
          </RadioGroup>
        </Stack>

        {/* 유형 - 분류단어일 때만 표시 */}
          <Stack>
            <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
              단어유형 <span style={{ color: 'red' }}>*</span>
            </div>
            <GSelectBox
              items={cacheWordTpCd}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              toplabel="선택"
              value={formData.WORD_TP_CD}
              onChange={(v) => handleChange('WORD_TP_CD', v)}
              isReadOnly={mode === 'edit' || isBasicWord}
            />
          </Stack>

        {/* 소분류 - 분류단어일 때만 표시 */}
          <Stack>
            <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
              단어소분류 <span style={{ color: 'red' }}>*</span>
            </div>
            <GSelectBox
              items={filteredWordDtlTpCd}
              valueKey="CD_VAL"
              labelKey="CD_VAL_NM"
              toplabel="선택"
              value={formData.WORD_DTL_TP_CD}
              onChange={(v) => handleChange('WORD_DTL_TP_CD', v)}
              isReadOnly={mode === 'edit' || isBasicWord}
            />
          </Stack>

        {/* 단어명 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            단어명 <span style={{ color: 'red' }}>*</span>
          </div>
          <GTextField
            size="small"
            fullWidth
            value={formData.WORD_KOR_NM}
            onChange={(e) => handleChange('WORD_KOR_NM', e.target.value)}
            placeholder="단어명 입력"
            isReadOnly={mode === 'edit'}
          />
        </Stack>

        {/* 단어영문명 + 중복검사 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            단어영문명 <span style={{ color: 'red' }}>*</span>
          </div>
          <Stack direction="row" spacing={1}>
            <GTextField 
              size="small"
              fullWidth
              value={formData.WORD_ENG_NM}
              onChange={(e) => handleChange('WORD_ENG_NM', e.target.value)}
              placeholder="단어영문명 입력"
              isReadOnly={mode === 'edit' || (mode === 'add' && isDuplicateChecked)}
            />
            {mode === 'add' && (
              <Button
                variant="outlined"
                onClick={isDuplicateChecked ? () => setIsDuplicateChecked(false) : handleDuplicateCheck}
                sx={{ minWidth: '100px', whiteSpace: 'nowrap' }}
              >
                {isDuplicateChecked ? '취소' : '중복검사'}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* 단어영문정식명 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            단어영문정식명 <span style={{ color: 'red' }}>*</span>
          </div>
          <GTextField
            size="small"
            fullWidth
            value={formData.WORD_ENG_FULL_NM}
            onChange={(e) => handleChange('WORD_ENG_FULL_NM', e.target.value)}
            placeholder="단어영문정식명 입력"
          />
        </Stack>

        {/* 정의 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>정의</div>
          <GTextField
            size="small"
            fullWidth
            multiline
            rows={4}
            value={formData.WORD_DEFIN_DSC}
            onChange={(e) => handleChange('WORD_DEFIN_DSC', e.target.value)}
            placeholder="정의 입력"
          />
        </Stack>
      </Stack>
    </GModal>
  );
}