import React, { useState, useEffect } from 'react';
import { getItems } from '@/api/codeApi.jsx';
import { Select } from 'antd';

const GSelect = ({
  grpCdId, // 공통코드 그룹 ID
  value,
  onChange,
  includeAll = true,
  allLabel = '-- All --',
  includeSelect = false,
  selectLabel = '-- Select --',
  width = '100%',
  height = 25,
  placeholder,
  disabled = false,
  style = {}
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const loadOptions = async () => {
      if (!grpCdId) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const items = await getItems(grpCdId);
        
        console.log(items);

        // 공통코드 데이터를 옵션 형태로 변환
        const codeOptions = items
          .filter(item => item.useYn === 'Y') // 사용 중인 코드만
          .sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)) // 정렬순서대로
          .map(item => ({
            value: item.cdVal,
            label: item.cdValNm || item.cdVal
          }));

        // 상단 옵션 추가
        const topOptions = [];
        if (includeAll) {
          topOptions.push({ value: 'ALL', label: allLabel });
        }
        if (includeSelect) {
          topOptions.push({ value: '', label: selectLabel });
        }

        setOptions([...topOptions, ...codeOptions]);
      } catch (error) {
        console.error('공통코드 옵션 로드 실패:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [grpCdId, includeAll, allLabel, includeSelect, selectLabel]);

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      loading={loading}
      style ={{
        width: `${width}px`,
        minWidth: `${width}px`,
        height: `${height}px`,
        minHeight: `${height}px`,
      }}
      placeholder={placeholder}
      disabled={disabled || loading}
    />
  );
};

export default GSelect;