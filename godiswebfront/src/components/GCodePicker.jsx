// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import GLayoutItem from '@/components/GLayoutItem';
import GPopup from '@/components/GPopup';
import { cacheCode } from '@/libs/DataUtils';
import { http } from '@/libs/TaskHttp'; //  DB fallback용 (프로젝트에 이미 사용 중) :contentReference[oaicite:1]{index=1}

/**
 * GCodePicker — Cache First + DB Fallback
 *
 * - cacheKey === 'ALL' : 캐시만 사용 (기존 동작 보장)
 * - cacheKey !== 'ALL' : 캐시에서 key 존재 여부 확인
 *    - 있으면 캐시 사용 (빈 배열이어도 "정상 결과 없음"으로 간주)
 *    - 없으면 DB 조회 fallback
 *
 * 캐시를 쓰는 경우가 아니면 서버단에 요청한다.
 * 서버 요청 예:
 *  POST /webcom/getCodePicker - CodePickerController 및 관련 서버 소스 확인
 *  예로 cacheKey를 SEARCH_COMMOMCODEGRP 로 주면 SEARCH_COMMOMCODEGRP 의 DB를 조회한다.
 *
 */
export default function GCodePicker({
  label,                      // GLayoutItem의 이름 지정
  value,                      // 초기 value 값
  display,                    // 초기 display 값
  onChange,                   // onChange 이벤트
  readOnly = false,           // 돋보기 on/off

  // 아래 두 값은 DB 조회를 할 때에 사용.
  valueVar,                   // 코드 피커를 사용할 실 화면에서 가져다 쓸 value.
  displayVar,                 // 코드 피커를 사용할 실 화면에서 가져다 쓸 display.

  labelWidth = 160,           // GLayoutItem 넓이
  cacheKey,                   // Key 값. 캐시의 key 혹은 모두(ALL). DB라면 조회할 쿼리의 id
  title = '사용공통코드',      // GPopUp 타이틀명.
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);         // [{CD_VAL, CD_VAL_NM, ...}]
  const [disp, setDisp] = useState(display || '');
  const [val, setVal]   = useState(value || '');


  //  캐시/DB 로드
  useEffect(() => {
    let alive = true;

    const normalizeRows = (res) => {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.table)) return res.table;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    };

    (async () => {
      try {
        const caches = await cacheCode([cacheKey]);
        // 1) ALL이면 기존처럼 "캐시만"
        if (cacheKey === 'ALL') {
          const cached = Array.isArray(caches?.[cacheKey]) ? caches[cacheKey] : [];
          if (alive) setRows(cached);
          return;
        }
        // 2) ALL이 아니면 캐시 key 존재 여부로 분기
        const hasKey = (caches.hasOwnProperty(cacheKey) && caches[cacheKey]);
        if (hasKey) {
          // key가 있으면 캐시 사용 (빈 배열이어도 그대로 사용)
          const cached = Array.isArray(caches?.[cacheKey]) ? caches[cacheKey] : [];
          if (alive) setRows(cached);
          return;
        }
        

        // 3 - 캐시, selectAllCodes에도 존재하지 않는 value 값이면, DB 조회가 필요한 경우. - ASIS와 동일.
        const param = { code: cacheKey ?? '' };
        
        const res  = await http.post('/webcom/getCodePicker', param, { shape: 'datatable' });

        const dbRows = normalizeRows(res);
        if (alive) setRows(dbRows);
      } catch (e) {
        console.error('[GCodePicker] load failed', e);
        if (alive) setRows([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [cacheKey]);

  // 외부 value/ display 변경 반영 (원본 유지)
  useEffect(() => setVal(value || ''), [value]);
  useEffect(() => setDisp(display || ''), [display]);


/* 조회한 결과 기반하여 column을 세팅.
    만일, DB로 조회 했을 때, 칼럼이 코드ID, 코드명, 설명 이런식이면 이 값들을 그대로 사용.
    때문에, 상위 화면에서는 해당 칼럼을 사용하거나 DB의 알리아스를 수정하여 사용할 것.
*/
const columns = useMemo(() => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const first = rows[0];

  // 키 순서를 유지하려면 Object.keys 사용 (대부분 입력 순서 유지)
  return Object.keys(first).map((k, idx) => ({
    headerName: k,     // 헤더명을 키 그대로
    field: k,          // 값도 해당 키로
    width: idx === 0 ? 180 : 220, // 원하는대로
    flex: idx === 0 ? undefined : 1,
  }));
}, [rows]);
  const handleOpen = useCallback(() => {
    if (readOnly) return;
    setOpen(true);
  }, [readOnly]);

  const handleClose = useCallback(() => setOpen(false), []);

  // 확인 버튼
  const handleConfirm = useCallback((row) => {
    const nextVal  = row?.[valueVar] ?? '';
    const nextText = row?.[displayVar] ?? '';
    setVal(nextVal);
    setDisp(nextText);
    setOpen(false);
    onChange && onChange(nextVal, row);
  }, [onChange]);

  const handleClear = useCallback(() => {
    setVal('');
    setDisp('');
    onChange && onChange('', null);
  }, [onChange]);

  const suffix = useMemo(() => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {val && !readOnly && (
        <Tooltip title="Clear">
          <a onClick={handleClear} style={{ fontSize: 12 }}>⨯</a>
        </Tooltip>
      )}
      <Tooltip title="Search">
        <SearchOutlined onClick={handleOpen} style={{ cursor: readOnly ? 'not-allowed' : 'pointer' }} />
      </Tooltip>
    </div>
  ), [val, readOnly, handleOpen, handleClear]);

  return (
    <div >
      <GLayoutItem label={label ? label : ''} labelWidth={labelWidth}>
        <Input
          size="small"
          value={disp}
          placeholder="-- 선택 --"
          readOnly
          suffix={suffix}
        />

        <GPopup
          open={open}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={title}
          headerTitle="공통코드 목록"
          columns={columns}
          data={rows}
          showTotalCount={true}
          Buttons={{ add: false, delete: false, revert: false, excel: false }}
          showSaveButton={false}
          showOkButton={true}
          showCancelButton={true}
          width="640px"
          height="520px"
        />
      </GLayoutItem>
    </div>
  );
}

GCodePicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  display: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  cacheKey: PropTypes.string,
  title: PropTypes.string,
};
