import React, { useState, useEffect, useMemo } from 'react';
import { Stack, TextField, Radio, RadioGroup, FormControlLabel, Button, Box } from '@mui/material';
import { message } from 'antd';
import GModal from '@/components/GModal.jsx';
import GSelectBox from '@/components/GSelectBox';
import GTextField from '@/components/GTextField';
import GMessageBox from '@/components/GMessageBox.jsx';
import { http } from '@/libs/TaskHttp';

export default function METASDTSD02P1({
  open,
  onClose,
  onSuccess,
  mode = 'add',
  data = null,
  cacheWordTpCd = [],
  cacheWordDtlTpCd = [],
  cacheDataTypeCd = [],
  cacheDomainSysCd = [],
}) {
  const [formData, setFormData] = useState({
    DOMAIN_NO: ''
  , WORD_TP_CD : ''       			/*유형*/
  , WORD_DTL_TP_CD : ''       	/*소분류*/
  , DATA_TYPE_CD : ''       		/*데이터타입*/
  , DATA_LEN : null       				/*길이*/
  , DATA_SCALE : null       			/*소수점*/
  , DOMAIN_KOR_NM : ''       	/*도메인명*/
  , DOMAIN_ENG_NM : ''       	/*도메인영문명*/
  , SYS_CD : ''
  , DOMAIN_DEFN_DSC : ''				/*도메인정의*/
  , DOMAIN_NOTE : ''						/*도메인비고*/
  , DOMAIN__APLY_RSN : ''			/*도메인신청사유*/
  });

  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);

  // 단어유형에 따라 단어소분류 필터링
  const filteredWordDtlTpCd = useMemo(() => {
    if (!formData.WORD_TP_CD || !cacheWordDtlTpCd || cacheWordDtlTpCd.length === 0) {
      return [];
    }
    
    return cacheWordDtlTpCd.filter(item => item.UP_CD_VAL === formData.WORD_TP_CD);
  }, [formData.WORD_TP_CD, cacheWordDtlTpCd]);


  // ===== mode와 data 변경 시 폼 초기화 =====
  useEffect(() => {
    if (!open) return; // 모달이 닫혀있으면 실행 안 함

    if (mode === 'add') {
      setFormData({
        DOMAIN_NO: ''
       , WORD_TP_CD : ''       			/*유형*/
       , WORD_DTL_TP_CD : ''       	/*소분류*/
       , DATA_TYPE_CD : ''       		/*데이터타입*/
       , DATA_LEN : null       				/*길이*/
       , DATA_SCALE : null       			/*소수점*/
       , DOMAIN_KOR_NM : ''       	/*도메인명*/
       , DOMAIN_ENG_NM : ''       	/*도메인영문명*/
       , SYS_CD : ''
       , DOMAIN_DEFN_DSC : ''				/*도메인정의*/
       , DOMAIN_NOTE : ''						/*도메인비고*/
       , DOMAIN__APLY_RSN : ''			/*도메인신청사유*/
      });
      setIsDuplicateChecked(false);
    } else if ((mode === 'edit' || mode === 'delete') && data) {
      setFormData({
        DOMAIN_NO :					data.DOMAIN_NO				|| ''
       , WORD_TP_CD :				data.WORD_TP_CD				|| ''		/*유형*/
       , WORD_DTL_TP_CD :		data.WORD_DTL_TP_CD		|| ''		/*소분류*/
       , DATA_TYPE_CD :			data.DATA_TYPE_CD			|| ''		/*데이터타입*/
       , DATA_LEN :					data.DATA_LEN					?? null		/*길이*/
       , DATA_SCALE :				data.DATA_SCALE				?? null		/*소수점*/
       , DOMAIN_KOR_NM :		data.DOMAIN_KOR_NM		|| ''		/*도메인명*/
       , DOMAIN_ENG_NM :		data.DOMAIN_ENG_NM		|| ''		/*도메인영문명*/
       , SYS_CD :						data.SYS_CD						|| ''
       , DOMAIN_DEFN_DSC :	data.DOMAIN_DEFN_DSC	|| ''		/*도메인정의*/
       , DOMAIN_NOTE :			data.DOMAIN_NOTE			|| ''		/*도메인비고*/
       , DOMAIN__APLY_RSN :	data.DOMAIN__APLY_RSN	|| ''		/*도메인신청사유*/
      });
      setIsDuplicateChecked(true);
    }
  }, [mode, data, open]);

  // ===== 입력 변경 핸들러 =====
  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = {
        ...prev,
        [field]: value,
      };

      // 데이터타입이 바뀌면 길이/소수점 초기화
      if (field === 'DATA_TYPE_CD' && mode === 'add') {
        next.DATA_LEN = null;
        next.DATA_SCALE = null;
      }
      
      if (field === 'WORD_TP_CD') {
        next.WORD_DTL_TP_CD = '';
      }

      return next;
    });

    // 도메인명 변경 시 중복검사 초기화
    if (field === 'DOMAIN_KOR_NM' && mode === 'add') {
      setIsDuplicateChecked(false);
    }

  };

  // ===== 필수값 검증 =====
  const validate = () => {
    // 도메인명 검증
    if (!formData.DOMAIN_KOR_NM.trim()) {
      message.warning('도메인명을 입력해주세요.');
      return false;
    }
    if (!/^[0-9a-zA-Z가-힣]+$/.test(formData.DOMAIN_KOR_NM)) {
      message.warning('도메인명은 한글, 영어, 숫자만 입력 가능합니다. (띄어쓰기, 특수문자 불가)');
      return false;
    }

    if (mode === 'add' && !isDuplicateChecked) {
      message.warning('도메인명 중복검사를 진행해주세요.');
      return false;
    }

    // 도메인영문명 검증 (선택사항이지만 입력했다면 검증)
    if (formData.DOMAIN_ENG_NM.trim() && !/^[0-9a-zA-Z_]+$/.test(formData.DOMAIN_ENG_NM)) {
      message.warning('도메인영문명은 영어, 숫자, _만 입력 가능합니다. (띄어쓰기, 한글, 기타 특수문자 불가)');
      return false;
    }

    if (!formData.WORD_TP_CD) {
      message.warning('도메인유형을 선택해주세요.');
      return false;
    }
    
    if (!formData.WORD_DTL_TP_CD) {
      message.warning('도메인소분류를 선택해주세요.');
      return false;
    }

    if (!formData.DATA_TYPE_CD) {
      message.warning('데이터 타입을 선택해주세요.');
      return false;
    }

    // 길이 검증
    if (!formData.DATA_LEN || !/^[0-9]+$/.test(formData.DATA_LEN)) {
      message.warning('데이터 길이는 숫자만 입력 가능합니다.');
      return false;
    }
    
    // 데이터가 실수인 경우 소수점 검증
    if(formData.DATA_TYPE_CD == 'N') {
      if (!formData.DATA_SCALE || !/^[0-9]+$/.test(formData.DATA_SCALE)) {
        message.warning('소수점은 숫자만 입력 가능합니다.');
        return false;
      }
      
      if(parseInt(formData.DATA_SCALE) > parseInt(formData.DATA_LEN)){
        message.warning('전체 길이보다 소수점 아래 길이가 클 수 없습니다.');
        return false;
      }
    }

    if (!formData.SYS_CD) {
      message.warning('시스템을 선택해주세요.');
      return false;
    }
    
    return true;
  };

  const handleDuplicateCheck = async () => {
    if (!formData.DOMAIN_KOR_NM.trim()) {
      message.warning('도메인명을 입력해주세요.');
      return;
    }

    try {
      const response = await http.post(
        '/meta/checkDomainEngNmDuplicate',
        { DOMAIN_KOR_NM: formData.DOMAIN_KOR_NM },
        { shape: 'datarow', showSpinner: true }
      );

      console.log('===== 중복검사 응답 =====', response);

      if (response && response.row.isDuplicate === true) {
        message.error('이미 사용 중인 도메인명입니다.');
        setIsDuplicateChecked(false);
      } else {
        message.success('사용 가능한 도메인명입니다.');
        setIsDuplicateChecked(true);
      }
    } catch (e) {
      console.error(e);
      message.error(e.message || '중복검사 중 오류가 발생했습니다.');
      setIsDuplicateChecked(false);
    }
  };
  
  // ===== 저장/삭제 핸들러 =====
  const handleSave = async () => {
    if (!validate()) return;

    try {
      const confirmMsg = '도메인';
      const msgCode = mode === 'add' ? 'MGQ00004' : 'MGQ00005';
      const r = await GMessageBox.Show(msgCode, 'YesNo', confirmMsg);
      if (r === 'no') return;

      const endpoint = mode === 'add' ? '/meta/insertDomain' : '/meta/updateDomain';
      await http.post(endpoint, formData, { shape: 'datarow', showSpinner: true });

      message.success(mode === 'add' ? '도메인이 추가되었습니다.' : '도메인이 수정되었습니다.');
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    try {
      await http.post(
        '/meta/deleteDomain',
        {
          DOMAIN_NO: formData.DOMAIN_NO 
         , DOMAIN_ENG_NM: formData.DOMAIN_ENG_NM 
        },
        { shape: 'datarow', showSpinner: true }
      );

      message.success('도메인이 삭제되었습니다.');
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add': return '도메인 추가';
      case 'edit': return '도메인 수정';
      case 'delete': return '도메인 삭제';
      default: return '도메인 관리';
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

  // ===== 삭제 모드 =====
  if (mode === 'delete') {
    return (
      <GModal open={open} onClose={onClose} title={getTitle()} maxWidth="sm" buttons={getButtons()}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
            <strong>{formData.DOMAIN_KOR_NM}</strong> 도메인을 삭제하시겠습니까?
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

        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            시스템 <span style={{ color: 'red' }}>*</span>
          </div>
          <GSelectBox
            items={cacheDomainSysCd}
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            toplabel="선택"
            value={formData.SYS_CD}
            onChange={(v) => handleChange('SYS_CD', v)}
          />
        </Stack>

        {/* 도메인명 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            도메인명 <span style={{ color: 'red' }}>*</span>
          </div>
          <Stack direction="row" spacing={1}>
            <GTextField
              size="small"
              fullWidth
              value={formData.DOMAIN_KOR_NM}
              onChange={(e) => handleChange('DOMAIN_KOR_NM', e.target.value)}
              placeholder="도메인명 입력"
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

        {/* 도메인영문명 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>
            도메인영문명
          </div>
          <Stack direction="row" spacing={1}>
            <GTextField
              size="small"
              fullWidth
              value={formData.DOMAIN_ENG_NM}
              onChange={(e) => handleChange('DOMAIN_ENG_NM', e.target.value)}
              placeholder="도메인영문명 입력"
              isReadOnly={mode === 'edit'}
            />
          </Stack>
        </Stack>

        {/* 유형/소분류 박스 */}
        <Box sx={{ 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          p: 2,
          backgroundColor: '#fafafa'
        }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                  유형 <span style={{ color: 'red' }}>*</span>
                </div>
                <GSelectBox
                  items={cacheWordTpCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="선택"
                  value={formData.WORD_TP_CD}
                  onChange={(v) => handleChange('WORD_TP_CD', v)}
                  isReadOnly={mode === 'edit'}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                  소분류 <span style={{ color: 'red' }}>*</span>
                </div>
                <GSelectBox
                  items={filteredWordDtlTpCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="선택"
                  value={formData.WORD_DTL_TP_CD}
                  onChange={(v) => handleChange('WORD_DTL_TP_CD', v)}
                />
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* 데이터타입/길이/소수점 박스 */}
        <Box sx={{ 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          p: 2,
          backgroundColor: '#fafafa'
        }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                  데이터타입 <span style={{ color: 'red' }}>*</span>
                </div>
                <GSelectBox
                  items={cacheDataTypeCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="선택"
                  value={formData.DATA_TYPE_CD}
                  onChange={(v) => handleChange('DATA_TYPE_CD', v)}
                />
              </Box>
              {formData.DATA_TYPE_CD != "CB" && (
                <>
                  <Box sx={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                      길이 <span style={{ color: 'red' }}>*</span>
                    </div>
                    <GTextField
                      size="small"
                      fullWidth
                      value={formData.DATA_LEN}
                      onChange={(e) => handleChange('DATA_LEN', e.target.value)}
                      placeholder="길이 입력"
                      inputProps={{ style: { textAlign: 'right' } }}
                    />
                  </Box>
                  {formData.DATA_TYPE_CD == "N" && (
                    <Box sx={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                        소수점
                      </div>
                      <GTextField
                        size="small"
                        fullWidth
                        value={formData.DATA_SCALE}
                        onChange={(e) => handleChange('DATA_SCALE', e.target.value)}
                        placeholder="소수점 입력"
                        inputProps={{ style: { textAlign: 'right' } }}
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Stack>
        </Box>

        {/* 정의 */}
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>정의</div>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={3}
            value={formData.DOMAIN_DEFN_DSC}
            onChange={(e) => handleChange('DOMAIN_DEFN_DSC', e.target.value)}
            placeholder="정의 입력"
          />
        </Stack>
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>비고</div>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={2}
            value={formData.DOMAIN_NOTE}
            onChange={(e) => handleChange('DOMAIN_NOTE', e.target.value)}
            placeholder="비고 입력"
          />
        </Stack>
        <Stack>
          <div style={{ marginBottom: 4, fontSize: '14px', fontWeight: 500 }}>신청사유</div>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={2}
            value={formData.DOMAIN__APLY_RSN}
            onChange={(e) => handleChange('DOMAIN__APLY_RSN', e.target.value)}
            placeholder="신청사유 입력"
          />
        </Stack>
      </Stack>
    </GModal>
  );
}