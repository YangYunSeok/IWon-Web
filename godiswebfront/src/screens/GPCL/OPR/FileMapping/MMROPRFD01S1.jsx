import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Input, Button, Space, message, Table } from 'antd';
import { Box, TextField, MenuItem, RadioGroup, FormControlLabel, Radio, Select, Grid, Stack } from '@mui/material';
import GSelectBox  from '@/components/GSelectBox.jsx';

// SearchHeader 컴포넌트
import GSearchHeader from '@/components/GSearchHeader.jsx';

// CustomGrid 컴포넌트
import CustomGrid from '@/components/GCustomGrid.jsx';

// GButton 컴포넌트
import GButton from '@/components/GButton';

export default function MMROPRFD01S1() {
  // 검색바 상태
  const [grpNm, setGrpNm] = useState('');
  const [grpType, setGrpType] = useState('ALL'); // UI 필터 (백엔드 파라미터 아님)
  const [status, setStatus] = useState('Y'); // 초기값 'Y'
  
  // 누락된 상태 변수들 추가
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGrpId, setSelectedGrpId] = useState(null);

  // SearchHeader용 폼 상태
  const [filters, setFilters] = useState({
    email: '',
    role: '',
    status: 'active',
    gender: '',
  });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleInitialize = () => {
    setFilters({ email: '', role: '', status: 'active', gender: '' });
  };

  const handleSearch = () => {
    console.log('조회 조건:', filters);
  };

  const ROLE_OPTIONS = [
    { label: '전체', value: '' },
    { label: '관리자', value: 'admin' },
    { label: '사용자', value: 'user' },
  ];

  const STATUS_OPTIONS = [
    { label: '활성', value: 'active' },
    { label: '비활성', value: 'inactive' },
  ];

  const GENDER_OPTIONS = [
    { label: '전체', value: '' },
    { label: '남성', value: 'M' },
    { label: '여성', value: 'F' },
  ];

  // CustomGrid용 데이터
  const items = [
    { header: '이메일', content: <TextField size="small" fullWidth /> },
    { header: '권한', content: (
        <Select size="small" fullWidth defaultValue="">
          <MenuItem value="">전체</MenuItem>
          <MenuItem value="admin">관리자</MenuItem>
          <MenuItem value="user">사용자</MenuItem>
        </Select>
      )
    },
    { header: '상태1', content: (
        <RadioGroup row defaultValue="active">
          <FormControlLabel value="active" control={<Radio size="small" />} label="활성" />
          <FormControlLabel value="inactive" control={<Radio size="small" />} label="비활성" />
        </RadioGroup>
      )
    },
    { header: '상태2', content: (
        <RadioGroup row fullWidth defaultValue="active">
          <FormControlLabel value="active" control={<Radio size="small" />} label="활성" />
          <FormControlLabel value="inactive" control={<Radio size="small" />} label="비활성" />
        </RadioGroup>
      )
    },
  ];

  const fields = [
      { label: '이메일', type: 'text', name: 'email', value: filters.email, onChange: handleChange },
      { label: '권한', type: 'select', name: 'role', value: filters.role, onChange: handleChange, options: ROLE_OPTIONS },
      { label: '상태', type: 'radio', name: 'status', value: filters.status, onChange: handleChange, options: STATUS_OPTIONS },
      { label: '성별', type: 'select', name: 'gender', value: filters.gender, onChange: handleChange, options: GENDER_OPTIONS },
      {},
      {}
  ];


  const getGroups = async () => {
    try {
      setLoadingGroups(true);
      const q = grpNm ? `?grpNm=${encodeURIComponent(grpNm)}` : '';
      const res = await fetch(`/api/admin/getgroups${q}`);

      console.log(res);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();

      console.log(list);

      // 프론트 단 그룹유형 필터
      const filtered = (grpType && grpType !== 'ALL')
        ? list.filter(g => (g.grpTypeCd || '').toUpperCase() === grpType)
        : list;

      const mapped = filtered.map((g, idx) => ({
        key: g.grpCdId || String(idx),
        ...g,
      }));
      setGroups(mapped);

      // 최초 로드 시 선택 없으면 첫 행 기준으로 하단 조회
      if (!selectedGrpId && mapped.length > 0) {
        setSelectedGrpId(mapped[0].grpCdId ?? mapped[0].key);
      }
    } catch (e) {
      console.error('[공통코드] 그룹 조회 실패', e);
      message.error('그룹 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [emailError, setEmailError] = useState(false);

  const emailHandleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      setEmailError(value && !emailRegex.test(value)); // 형식 오류 검사
    }
  };

  const handleClick = (type) => {
    console.log(`${type} 버튼 클릭`);
  };

  return (
    <div>
      <GSearchHeader
        fields={[
          {
            header: '이메일',
            content: (
              <TextField
              fullWidth
                name="email"
                value={filters.email}
                onChange={emailHandleChange}
                placeholder="이메일 입력"
                error={emailError}
                helperText={emailError ? '올바른 이메일 주소를 입력하세요.' : ''}
              />
            ),
          },
          {
            header: '권한',
            content: (
              <Select
                fullWidth
                name="role"
                value={filters.role}
                onChange={handleChange}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
          {
            header: '상태',
            content: (
              <RadioGroup
                row
                name="status"
                value={filters.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={opt.label}
                  />
                ))}
              </RadioGroup>
            ),
          },
          {
            header: '성별',
            content: (
              <Select
                fullWidth
                name="gender"
                value={filters.gender}
                onChange={handleChange}
              >
                {GENDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
        ]}
      />

      <GSearchHeader
        fields={[
          {
            header: '이메일',
            content: (
              <TextField
                fullWidth
                name="email"
                value={filters.email}
                onChange={emailHandleChange}
                placeholder="이메일 입력"
                error={emailError}
                helperText={emailError ? '올바른 이메일 주소를 입력하세요.' : ''}
              />
            ),
          },
          {
            header: '권한',
            content: (
              <Select
                fullWidth
                name="role"
                value={filters.role}
                onChange={handleChange}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
          {
            header: '상태',
            content: (
              <RadioGroup
                row
                name="status"
                value={filters.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={opt.label}
                  />
                ))}
              </RadioGroup>
            ),
          },
          {
            header: '성별',
            content: (
              <Select
                fullWidth
                name="gender"
                value={filters.gender}
                onChange={handleChange}
              >
                {GENDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
          {
            header: '성별2',
            content: (
              <Select
                fullWidth
                name="gender"
                value={filters.gender}
                onChange={handleChange}
              >
                {GENDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
          {},
          {},
          {}
        ]}
      />

      <Stack>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <GButton auth="Init" label="Initialize" onClick={() => handleClick('Init')} />
          <GButton auth="Search" label="Search" onClick={() => handleClick('Search')} />
          <GButton auth="Save" label="Save" onClick={() => handleClick('Save')} />
          <GButton auth="Cancel" label="Cancel" onClick={() => handleClick('Cancel')} />
          <GButton auth="Ok" label="OK" onClick={() => handleClick('Ok')} />
          <GButton auth="Revert" label="Revert" onClick={() => handleClick('Revert')} />
          <GButton auth="Apply" label="Apply" onClick={() => handleClick('Apply')} />
          <GButton auth="Upload" label="Upload" onClick={() => handleClick('Upload')} />
          <GButton auth="CacheDeploy" label="Cache Deploy" onClick={() => handleClick('CacheDeploy')} />
        </div>
      </Stack>
    </div>

    
  );
}
