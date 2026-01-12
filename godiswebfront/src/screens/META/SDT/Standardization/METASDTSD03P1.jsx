import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Button, Box } from '@mui/material';
import { message } from 'antd';
import GDataGrid from '@/components/GDataGrid.jsx';
import GSelectBox from '@/components/GSelectBox.jsx';
import GButton from '@/components/GButton';
import { http } from '@/libs/TaskHttp';
import METASDTSD01P1 from './METASDTSD01P1';
import GMessageBox from '@/components/GMessageBox.jsx';
import { changes, toValueOptions } from '@/libs/Utils';
import GTextField from '@/components/GTextField';

export default function METASDTSD03P1({ 
  open, 
  onClose, 
  onSuccess, 
  mode, 
  data,
  cacheSystemCd,
  cacheWordSecCd: propsWordSecCd,
  cacheWordTpCd: propsWordTpCd,
  cacheWordDtlTpCd: propsWordDtlTpCd,
  cacheDataTypeCd: propsDataTypeCd
}) {
  // ===== 용어 기본 정보 =====
  const [termKorNm, setTermKorNm] = useState('');
  const [termEngNm, setTermEngNm] = useState('');
  const [termEngFullNm, setTermEngFullNm] = useState('');
  const [systemCd, setSystemCd] = useState('');
  const [termDefinDsc, setTermDefinDsc] = useState('');
  const [termNote, setTermNote] = useState('');
  const [termAplyRsn, setTermAplyRsn] = useState('');

  // ===== 용어 추천 그리드 =====
  const [termSuggestions, setTermSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  // ===== 단어 구성 그리드 =====
  const [wordList, setWordList] = useState([]);
  
  // ===== 도메인 선택 및 정보 =====
  const [domainList, setDomainList] = useState([]);
  const [selectedDomainNo, setSelectedDomainNo] = useState('');
  const [domainInfo, setDomainInfo] = useState({
    DOMAIN_KOR_NM: '',
    DATA_TYPE_CD: '',
    DATA_LEN: '',
    DATA_SCALE: ''
  });

  // ===== 분류단어 정보 (마지막 단어) =====
  const [classWordInfo, setClassWordInfo] = useState({
    WORD_TP_CD: '',
    WORD_DTL_TP_CD: ''
  });

  // ===== Cache 코드 (단어 유형, 소분류) =====
  const [cacheWordSecCd, setCacheWordSecCd] = useState([]);
  const [cacheWordTpCd, setCacheWordTpCd] = useState([]);
  const [cacheWordDtlTpCd, setCacheWordDtlTpCd] = useState([]);
  const [cacheDataTypeCd, setCacheDataTypeCd] = useState([]);
  
  // ===== 동음이의어 선택 팝업 =====
  const [openWordSelectModal, setOpenWordSelectModal] = useState(false);
  const [wordSelectList, setWordSelectList] = useState([]);
  const [targetWordIndex, setTargetWordIndex] = useState(null);

  // ===== 단어 신청 팝업 =====
  const [openWordCreateModal, setOpenWordCreateModal] = useState(false);
  const [wordCreateData, setWordCreateData] = useState(null);

  // ===== 코드 값을 코드명으로 변환하는 헬퍼 함수 =====
  const getCodeName = (codeList, codeValue) => {
    if (!codeValue || !codeList || codeList.length === 0) return '';
    const code = codeList.find(item => item.CD_VAL === codeValue);
    return code ? code.CD_VAL_NM : codeValue;
  };

  // ===== 모달 열릴 때 데이터 초기화 =====
  useEffect(() => {
    if (open) {
      setCacheWordSecCd(propsWordSecCd || []);
      setCacheWordTpCd(propsWordTpCd || []);
      setCacheWordDtlTpCd(propsWordDtlTpCd || []);
      setCacheDataTypeCd(propsDataTypeCd || []);
      
      if (mode === 'add') {
        initializeForm();
      } else if (mode === 'edit' && data) {
        // 약간의 딜레이를 주고 loadTermData 실행
        setTimeout(() => {
          loadTermData();
        }, 100);
      }
    }
  }, [open, mode, data]);

  // ===== 폼 초기화 =====
  const initializeForm = () => {
    setTermKorNm('');
    setTermEngNm('');
    setTermEngFullNm('');
    setSystemCd('');
    setTermDefinDsc('');
    setTermNote('');
    setTermAplyRsn('');
    setTermSuggestions([]);
    setSelectedSuggestion(null);
    setWordList([]);
    setDomainList([]);
    setSelectedDomainNo('');
    setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '', DATA_SCALE: '' });
    setClassWordInfo({ WORD_TP_CD: '', WORD_DTL_TP_CD: '' });
  };

  // ===== 수정 모드: 용어 데이터 로드 =====
  const loadTermData = async () => {
    try {
      const param = { TERM_NO: data.TERM_NO };
      const response = await http.post('/meta/getTermDetail', param, { showSpinner: true });
      
      console.log('=== 용어 상세 응답 ===', response);
      
      setTermKorNm(response.TERM_KOR_NM || '');
      setTermEngNm(response.TERM_ENG_NM || '');
      setTermEngFullNm(response.TERM_ENG_FULL_NM || '');
      setSystemCd(response.SYS_CD || '');
      setTermDefinDsc(response.TERM_DEFIN_DSC || '');
      setTermNote(response.TERM_NOTE || '');
      setTermAplyRsn('');
      
      // 용어를 구성하는 단어 목록 설정
      if (response.WORD_LIST && response.WORD_LIST.length > 0) {
        console.log('단어 목록:', response.WORD_LIST);
        
        // 단어 목록에 WORD_EXISTS 속성 추가 (모두 존재하는 단어로 처리)
        const processedWordList = response.WORD_LIST.map(word => ({
          ...word,
          WORD_EXISTS: true,
          HAS_HOMONYM: false
        }));
        
        setWordList(processedWordList);
        
        // 마지막 단어(분류단어)의 유형/소분류 설정
        const lastWord = processedWordList[processedWordList.length - 1];
        setClassWordInfo({
          WORD_TP_CD: lastWord.WORD_TP_CD || '',
          WORD_DTL_TP_CD: lastWord.WORD_DTL_TP_CD || ''
        });
        
        // 마지막 단어(분류단어)로 도메인 목록 필터링
        if (lastWord.WORD_SEC_CD === 'GW') {
          await loadDomainList(null, lastWord.WORD_TP_CD, lastWord.WORD_DTL_TP_CD);
        }
      } else {
        console.warn('WORD_LIST가 비어있습니다!');
        // 단어 목록이 비어있어도 도메인 정보는 로드
        setWordList([]);
      }
      
      if (response.DOMAIN_NO) {
        setSelectedDomainNo(response.DOMAIN_NO);
        await loadDomainInfo(response.DOMAIN_NO);
      }
    } catch (e) {
      console.error('용어 상세 조회 실패', e);
      message.error('용어 정보를 불러오지 못했습니다.');
    }
  };

  // ===== 용어명 검색: 용어 추천 목록 조회 =====
  const handleSearchTerm = async () => {
    // 띄어쓰기 제거
    const trimmedTermKorNm = termKorNm.replace(/\s+/g, '');
    
    if (!trimmedTermKorNm) {
      message.warning('용어명을 입력해주세요.');
      return;
    }

    // 띄어쓰기 제거된 값으로 상태 업데이트
    setTermKorNm(trimmedTermKorNm);

    // 초기화
    setTermEngNm('');
    setTermEngFullNm('');
    setSystemCd('');
    setTermDefinDsc('');
    setTermNote('');
    setTermAplyRsn('');
    setWordList([]);
    setDomainList([]);
    setSelectedDomainNo('');
    setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '' });
    setClassWordInfo({ WORD_TP_CD: '', WORD_DTL_TP_CD: '' });
    setTermSuggestions([]);
    setSelectedSuggestion(null);

    try {
      const param = { TERM_KOR_NM: trimmedTermKorNm };
      const { table } = await http.post('/meta/suggestTermWords', param, { 
        shape: 'datatable', 
        showSpinner: true 
      });

      // 매칭된 단어 개수(WORD_EXISTS가 true인 개수)가 많은 순으로 정렬
      const sortedTable = (table || []).sort((a, b) => {
        const aMatchCount = (a.WORD_LIST || []).filter(w => w.WORD_EXISTS).length;
        const bMatchCount = (b.WORD_LIST || []).filter(w => w.WORD_EXISTS).length;
        return bMatchCount - aMatchCount;
      });

      setTermSuggestions(sortedTable);
      
      if (sortedTable.length > 0) {
        await handleSuggestionSelect(sortedTable[0]);
      }

    } catch (e) {
      console.error('용어 추천 조회 실패', e);
      message.error('용어 추천 조회에 실패했습니다.');
    }
  };

  // ===== 용어 추천 항목 선택 =====
  const handleSuggestionSelect = async (suggestion) => {
    setSelectedSuggestion(suggestion);
    
    // 초기화
    setTermEngNm('');
    setTermEngFullNm('');
    setSystemCd('');
    setTermDefinDsc('');
    setTermNote('');
    setTermAplyRsn('');
    setDomainList([]);
    setSelectedDomainNo('');
    setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '' });
    setClassWordInfo({ WORD_TP_CD: '', WORD_DTL_TP_CD: '' });
    
    const words = suggestion.WORD_LIST || [];
    
    // 동음이의어가 있는 단어의 영문명을 '*'로 변경하고, 단어구분도 빈 값으로 설정
    const processedWords = words.map(word => ({
      ...word,
      WORD_ENG_NM: word.HAS_HOMONYM ? '*' : word.WORD_ENG_NM,
      WORD_SEC_CD: word.HAS_HOMONYM ? '' : word.WORD_SEC_CD  // 동음이의어면 단어구분 빈 값
    }));
    
    setWordList(processedWords);

    // 용어 영문명 자동 생성 (존재하는 단어는 모두 포함, *도 포함)
    const engNames = processedWords
      .filter(w => w.WORD_ENG_NM && w.WORD_EXISTS)
      .map(w => w.WORD_ENG_NM);
    
    if (engNames.length > 0) {
      setTermEngNm(engNames.join('_'));
    }

    const engFullNames = processedWords
      .filter(w => w.WORD_ENG_FULL_NM && w.WORD_EXISTS)
      .map(w => w.HAS_HOMONYM ? '*' : w.WORD_ENG_FULL_NM);

    if (engFullNames.length > 0) {
      setTermEngFullNm(engFullNames.join('_'));
    }

    // 마지막 단어(분류단어)의 유형/소분류 설정 및 도메인 목록 필터링
    if (processedWords.length > 0) {
      const lastWord = processedWords[processedWords.length - 1];
      
      // 마지막 단어가 동음이의어면 도메인 조회 안 함, 단어구분도 초기화
      if (lastWord.HAS_HOMONYM) {
        setClassWordInfo({
          WORD_TP_CD: '',
          WORD_DTL_TP_CD: ''
        });
        setDomainList([]);
      } else {
        // 동음이의어가 아닌 경우에만 유형/소분류 설정 및 도메인 조회
        setClassWordInfo({
          WORD_TP_CD: lastWord.WORD_TP_CD || '',
          WORD_DTL_TP_CD: lastWord.WORD_DTL_TP_CD || ''
        });
        
        // 마지막 단어(분류단어)의 유형/소분류로 도메인 목록 조회
        if (lastWord.WORD_EXISTS && lastWord.WORD_SEC_CD === 'GW') {
          await loadDomainList(null, lastWord.WORD_TP_CD, lastWord.WORD_DTL_TP_CD);
        } else {
          setDomainList([]);
        }
      }
    }
  };

  // ===== 도메인 리스트 조회 =====
  const loadDomainList = async (wordKorNm = null, wordTpCd = null, wordDtlTpCd = null) => {
    try {
      const param = {};

      if (wordTpCd) {
        param.WORD_TP_CD = wordTpCd;
        if (wordDtlTpCd) {
          param.WORD_DTL_TP_CD = wordDtlTpCd;
        }
      } 
      
      console.log('loadDomainList 호출:', { wordKorNm, wordTpCd, wordDtlTpCd, param });
      
      const { table } = await http.post('/meta/getTermDomainList', param, { 
        shape: 'datatable', 
        showSpinner: false 
      });
      
      console.log('도메인 리스트 조회 결과:', table?.length || 0, '개');
      setDomainList(table || []);
    } catch (e) {
      console.error('도메인 리스트 조회 실패', e);
      setDomainList([]);
    }
  };

  // ===== 도메인 선택 시 도메인 정보 로드 =====
  const handleDomainChange = async (domainNo) => {
    if (domainNo !== selectedDomainNo) {
      setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '', DATA_SCALE: ''});
    }
    
    setSelectedDomainNo(domainNo);
    
    if (domainNo) {
      await loadDomainInfo(domainNo);
    } else {
      setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '', DATA_SCALE: ''});
    }
  };

  // ===== 도메인 정보 조회 =====
  const loadDomainInfo = async (domainNo) => {
    try {
      const param = { DOMAIN_NO: domainNo };
      const response = await http.post('/meta/getDomainDetail', param, { showSpinner: false });
      setDomainInfo({
        DOMAIN_KOR_NM: response.DOMAIN_KOR_NM || '',
        DATA_TYPE_CD: response.DATA_TYPE_CD || '',
        DATA_LEN: response.DATA_LEN || '',
        DATA_SCALE: response.DATA_SCALE
      });
    } catch (e) {
      console.error('도메인 정보 조회 실패', e);
    }
  };

  // ===== 단어신청 버튼 클릭 - 단어 신청 팝업 오픈 =====
  const handleCreateWord = (rowData) => {
    setWordCreateData({
      WORD_KOR_NM: rowData.WORD_KOR_NM,
      WORD_ENG_NM: rowData.WORD_ENG_NM || '',
      WORD_SEC_CD: rowData.WORD_SEC_CD || 'BW',
      RESTRICT_WORD_SEC_CD: true  // 이 플래그가 있으면 WORD_SEC_CD 변경 불가
    });
    setOpenWordCreateModal(true);
  };

  const handleWordCreateSuccess = async () => {
    setOpenWordCreateModal(false);
    
    try {
      // 단어 생성 후 도메인 관련 정보 초기화
      setDomainList([]);
      setSelectedDomainNo('');
      setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '' });
      
      // 용어 추천 재조회하여 최신 단어 정보 반영
      const param = { TERM_KOR_NM: termKorNm };
      const { table } = await http.post('/meta/suggestTermWords', param, { 
        shape: 'datatable', 
        showSpinner: true 
      });

      // 매칭된 단어 개수(WORD_EXISTS가 true인 개수)가 많은 순으로 정렬
      const sortedTable = (table || []).sort((a, b) => {
        const aMatchCount = (a.WORD_LIST || []).filter(w => w.WORD_EXISTS).length;
        const bMatchCount = (b.WORD_LIST || []).filter(w => w.WORD_EXISTS).length;
        return bMatchCount - aMatchCount;
      });

      setTermSuggestions(sortedTable);
      
      // 현재 선택된 추천 항목이 있으면 해당 항목의 최신 단어 구성으로 업데이트
      if (selectedSuggestion) {
        const updatedSuggestion = sortedTable.find(s => 
          s.TERM_COMBINATION === selectedSuggestion.TERM_COMBINATION
        );
        
        if (updatedSuggestion) {
          await handleSuggestionSelect(updatedSuggestion);
        }
      }
      
      message.success('단어가 생성되었습니다.');
    } catch (e) {
      console.error('용어 추천 재조회 실패', e);
      message.error('용어 추천 재조회에 실패했습니다.');
    }
  };

  // ===== 단어선택 버튼 클릭 (동음이의어) =====
  const handleOpenWordSelect = async (rowData) => {
    try {
      const param = { WORD_KOR_NM: rowData.WORD_KOR_NM };
      const { table } = await http.post('/meta/getHomonymWords', param, { 
        shape: 'datatable',
        showSpinner: true 
      });
      
      setWordSelectList(table || []);
      // wordList에서 실제 인덱스 찾기
      const actualIndex = wordList.findIndex(w => w.WORD_KOR_NM === rowData.WORD_KOR_NM);
      console.log('동음이의어 팝업 열기:', {
        wordKorNm: rowData.WORD_KOR_NM,
        actualIndex,
        wordListLength: wordList.length,
        isLastWord: actualIndex === wordList.length - 1
      });
      setTargetWordIndex(actualIndex);
      setOpenWordSelectModal(true);
      
    } catch (e) {
      console.error('동음이의어 조회 실패', e);
      message.error('동음이의어 조회에 실패했습니다.');
    }
  };

  // ===== 동음이의어 선택 완료 =====
  const handleSelectHomonym = async (selectedWord) => {
    console.log('handleSelectHomonym 호출:', {
      targetWordIndex,
      selectedWord: {
        WORD_NO: selectedWord.WORD_NO,
        WORD_KOR_NM: selectedWord.WORD_KOR_NM,
        WORD_SEC_CD: selectedWord.WORD_SEC_CD,
        WORD_TP_CD: selectedWord.WORD_TP_CD,
        WORD_DTL_TP_CD: selectedWord.WORD_DTL_TP_CD
      },
      wordListLength: wordList.length
    });
    if (targetWordIndex === null || targetWordIndex < 0) {
      console.error('targetWordIndex가 유효하지 않습니다:', targetWordIndex);
      setOpenWordSelectModal(false);
      return;
    }
    
    const updatedWordList = [...wordList];
    
    // 인덱스 범위 확인
    if (targetWordIndex >= updatedWordList.length) {
      console.error('targetWordIndex가 범위를 벗어났습니다:', targetWordIndex, updatedWordList.length);
      setOpenWordSelectModal(false);
      return;
    }
    
    const previousWord = updatedWordList[targetWordIndex];
    
    updatedWordList[targetWordIndex] = {
      ...updatedWordList[targetWordIndex],
      WORD_NO: selectedWord.WORD_NO,
      WORD_ENG_NM: selectedWord.WORD_ENG_NM,
      WORD_SEC_CD: selectedWord.WORD_SEC_CD,
      WORD_TP_CD: selectedWord.WORD_TP_CD,
      WORD_DTL_TP_CD: selectedWord.WORD_DTL_TP_CD,
      WORD_EXISTS: true,
      HAS_HOMONYM: false
    };
    setWordList(updatedWordList);
    
    // 용어 영문명 재생성
    const engNames = updatedWordList
      .filter(w => w.WORD_ENG_NM && w.WORD_EXISTS && w.WORD_ENG_NM !== '*')
      .map(w => w.WORD_ENG_NM);
    
    if (engNames.length > 0) {
      setTermEngNm(engNames.join('_'));
    }

    const engFullNames = updatedWordList
      .filter(w => w.WORD_ENG_FULL_NM && w.WORD_EXISTS && w.WORD_ENG_FULL_NM !== '*')
      .map(w => w.WORD_ENG_FULL_NM);

    if (engFullNames.length > 0) {
      setTermEngFullNm(engFullNames.join('_'));
    }

    // 마지막 단어가 선택된 경우 도메인 관련 정보 초기화 후 재조회
    const isLastWord = targetWordIndex === updatedWordList.length - 1;
    
    console.log('동음이의어 선택 처리:', {
      targetWordIndex,
      listLength: updatedWordList.length,
      isLastWord,
      selectedWord: {
        WORD_SEC_CD: selectedWord.WORD_SEC_CD,
        WORD_TP_CD: selectedWord.WORD_TP_CD,
        WORD_DTL_TP_CD: selectedWord.WORD_DTL_TP_CD,
        WORD_NO: selectedWord.WORD_NO
      }
    });
    
    if (isLastWord) {
      // 도메인 선택/정보 공통 초기화
      setSelectedDomainNo('');
      setDomainInfo({ DOMAIN_KOR_NM: '', DATA_TYPE_CD: '', DATA_LEN: '', DATA_SCALE: '' });

      if (selectedWord.WORD_SEC_CD === 'GW') {
        // 분류단어 선택 시: 유형/소분류를 반영하고 해당 값으로 도메인 목록 조회
        const wordTpCd = selectedWord.WORD_TP_CD || '';
        const wordDtlTpCd = selectedWord.WORD_DTL_TP_CD || '';
        
        console.log('분류단어 선택 - 도메인 조회 시작:', { 
          WORD_SEC_CD: selectedWord.WORD_SEC_CD,
          WORD_TP_CD: wordTpCd, 
          WORD_DTL_TP_CD: wordDtlTpCd,
          hasWordTpCd: !!wordTpCd,
          selectedWordFull: selectedWord
        });
        
        // 분류단어유형/소분류 설정
        setClassWordInfo({
          WORD_TP_CD: wordTpCd,
          WORD_DTL_TP_CD: wordDtlTpCd
        });
        
        // 분류단어면 WORD_TP_CD가 있어야 도메인 조회 가능
        if (wordTpCd) {
          console.log('도메인 조회 호출:', { wordTpCd, wordDtlTpCd });
          try {
            await loadDomainList(null, wordTpCd, wordDtlTpCd);
            console.log('도메인 조회 완료');
          } catch (error) {
            console.error('도메인 조회 중 오류:', error);
          }
        } else {
          console.warn('분류단어인데 WORD_TP_CD가 없습니다. 도메인 조회를 건너뜁니다.');
          setDomainList([]);
        }
      } else {
        // 기본단어 등 분류단어가 아닌 경우:
        // - 도메인 그리드/선택
        // - 분류단어유형/소분류
        // - 도메인명/데이터타입/데이터길이
        // 를 모두 초기화
        console.log('기본단어 선택 - 모든 도메인 정보 초기화');
        setDomainList([]);
        setClassWordInfo({
          WORD_TP_CD: '',
          WORD_DTL_TP_CD: ''
        });
      }
    } else {
      console.log('마지막 단어가 아니므로 도메인 조회를 건너뜁니다.');
    }
    
    setOpenWordSelectModal(false);
  };

  // ===== 저장 =====
  const handleSave = async () => {
    // 용어명 체크
    if (!termKorNm.trim()) {
      message.warning('용어명을 입력해주세요.');
      return;
    }
    
    // 시스템 체크
    if (!systemCd) {
      message.warning('시스템을 선택해주세요.');
      return;
    }
    
    // 용어영문명 체크
    if (!termEngNm.trim()) {
      message.warning('용어영문명을 입력해주세요.');
      return;
    }
    
    // 용어영문정식명 체크
    if (!termEngFullNm.trim()) {
      message.warning('용어영문정식명을 입력해주세요.');
      return;
    }

    // 구성 단어 존재 여부 및 마지막 단어 분류단어 여부 체크
    if (!wordList || wordList.length === 0) {
      message.warning('구성 단어가 없습니다. 용어를 구성하는 단어를 확인해주세요.');
      return;
    }

    const lastWord = wordList[wordList.length - 1];
    if (!lastWord || lastWord.WORD_SEC_CD !== 'GW') {
      message.warning('구성 단어의 마지막 단어는 분류단어여야 합니다. (단어구분이 \"분류단어\" 인 단어를 마지막에 위치시키세요)');
      return;
    }
    
    // 도메인 선택 체크
    if (!selectedDomainNo) {
      message.warning('도메인을 선택해주세요.');
      return;
    }

    // // 용어정의 체크
    // if (!termDefinDsc.trim()) {
    //   message.warning('용어정의를 입력해주세요.');
    //   return;
    // }

    // 없는 단어 체크
    const missingWords = wordList.filter(w => !w.WORD_EXISTS);
    if (missingWords.length > 0) {
      message.warning('등록되지 않은 단어가 있습니다. 단어를 먼저 생성해주세요.');
      return;
    }

    // 용어 영문명에 * 포함 여부 체크
    if (termEngNm.includes('*')) {
      message.warning('동음이의어 단어 선택이 필요합니다. 단어를 선택해주세요.');
      return;
    }

    try {

      const msgCode = mode === 'add' ? 'MGQ00004' : 'MGQ00005';
      const r = await GMessageBox.Show(msgCode, 'YesNo', '용어');
      if (r === 'no') return;

      const param = {
        TERM_NO: mode === 'edit' ? data.TERM_NO : null,
        TERM_KOR_NM: termKorNm,
        TERM_ENG_NM: termEngNm,
        TERM_ENG_FULL_NM: termEngFullNm,
        SYS_CD: systemCd,
        TERM_DEFIN_DSC: termDefinDsc,
        TERM_NOTE: termNote,
        TERM_APLY_RSN: termAplyRsn,
        DOMAIN_NO: selectedDomainNo,
        WORD_LIST: wordList.map(w => ({
          WORD_NO: w.WORD_NO,
          WORD_KOR_NM: w.WORD_KOR_NM,
          WORD_ENG_NM: w.WORD_ENG_NM,
          WORD_SEC_CD: w.WORD_SEC_CD,
          WORD_TP_CD: w.WORD_TP_CD,
          WORD_DTL_TP_CD: w.WORD_DTL_TP_CD
        }))
      };

      const endpoint = mode === 'edit' ? '/meta/updateTerm' : '/meta/insertTerm';
      const response = await http.post(endpoint, param, { showSpinner: true });

      if (response.success === false) {
        message.error(response.message);
        return;
      }

      message.success(`용어가 ${mode === 'edit' ? '수정' : '등록'}되었습니다.`);
      onSuccess();
      onClose();

    } catch (e) {
      console.error('용어 저장 실패', e);
      const errorMessage = e.response?.data?.message || e.message || `용어 ${mode === 'edit' ? '수정' : '등록'}에 실패했습니다.`;
      message.error(errorMessage);
    }
  };

  // ===== 삭제 =====
  const handleDelete = async () => {
    if (mode !== 'delete') return;

    try {

      // const r = await GMessageBox.Show('MGQ00065', 'YesNo', '용어');
      // if (r === 'no') return;

      const param = { TERM_NO: data.TERM_NO };
      const response = await http.post('/meta/deleteTerm', param, { showSpinner: true });

      if (response.success === false) {
        message.error(response.message);
        onSuccess();
        onClose();
        return;
      }

      message.success('용어가 삭제되었습니다.');
      onSuccess();
      onClose();

    } catch (e) {
      console.error('용어 삭제 실패', e);
      message.error('용어 삭제에 실패했습니다.');
    }
  };

  // ===== 용어 추천 컬럼 =====
  const suggestionColumns = [
    { 
      headerName: '후보용어명', 
      headerAlign: 'center', 
      field: 'TERM_COMBINATION', 
      flex: 1,
      renderCell: (params) => {
        const words = params.row.WORD_LIST || [];
        return (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {words.map((word, idx) => {
              let color = 'black';
              if (!word.WORD_EXISTS) {
                color = 'red';
              } else if (word.HAS_HOMONYM) {
                color = '#1976d2';
              }
              
              return (
                <span 
                  key={idx}
                  style={{ 
                    color: color,
                    fontWeight: !word.WORD_EXISTS ? 'bold' : 'normal'
                  }}
                >
                  {word.WORD_KOR_NM}
                </span>
              );
            })}
          </div>
        );
      }
    }
  ];

  // ===== 단어 구성 컬럼 =====
  const wordColumns = [
    { 
      headerName: '단어명', 
      headerAlign: 'center', 
      field: 'WORD_KOR_NM', 
      width: mode === 'edit' ? 300 : 250,  // 수정 모드일 때 넓게
      renderCell: (params) => {
        let color = 'black';
        if (mode != 'edit') {
          if (!params.row.WORD_EXISTS) {
            color = 'red';
          } else if (params.row.HAS_HOMONYM) {
            color = '#1976d2';
          }
        }

        return (
          <span style={{ 
            color: color,
            fontWeight: !params.row.WORD_EXISTS ? 'bold' : 'normal'
          }}>
            {params.row.WORD_KOR_NM}
          </span>
        );
      }
    },
    { 
      headerName: '단어영문명', 
      headerAlign: 'center', 
      field: 'WORD_ENG_NM', 
      width: mode === 'edit' ? 300 : 250  // 수정 모드일 때 넓게
    },
    { 
      headerName: '단어구분', 
      headerAlign: 'center', 
      field: 'WORD_SEC_CD',
      type: 'singleSelect',
      valueOptions: toValueOptions(cacheWordSecCd, 'CD_VAL', 'CD_VAL_NM'),
      align: 'center', 
      width: mode === 'edit' ? 170 : 130,  // 수정 모드일 때 넓게
      editable: (params) => !params.row.HAS_HOMONYM  // 동음이의어면 편집 불가
    },
    ...(mode !== 'edit' ? [{  // 수정 모드가 아닐 때만 처리상태 컬럼 표시
      headerName: '처리상태', 
      headerAlign: 'center', 
      field: 'WORK_STATUS', 
      width: 130,
      align: 'center',
      renderCell: (params) => {
        if (!params.row.WORD_EXISTS) {
          return (
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={() => handleCreateWord(params.row)}
              sx={{ 
                height: '20px',
                fontSize: '11px',
                padding: '0 8px',
                minWidth: '60px'
              }}
            >
              단어추가
            </Button>
          );
        } else if (params.row.WORD_ENG_NM === '*') {
          return (
            <Button 
              size="small" 
              variant="outlined" 
              color="primary"
              onClick={() => handleOpenWordSelect(params.row)}
              sx={{ 
                height: '20px',
                fontSize: '11px',
                padding: '0 8px',
                minWidth: '60px'
              }}
            >
              단어선택
            </Button>
          );
        }
        return <span style={{ color: '#52c41a' }}>등록완료</span>;
      }
    }] : [])
  ];

  // ===== 도메인 리스트 컬럼 =====
  const domainColumns = [
    { 
      headerName: '도메인명', 
      headerAlign: 'center', 
      field: 'DOMAIN_KOR_NM', 
      width: 420 
    },
    { 
      headerName: '데이터타입(길이)', 
      headerAlign: 'center', 
      field: 'DATA_TYPE_INFO',
      width: 350,
      align: 'center',
      renderCell: (params) => {
        const typeName = params.row.DATA_TYPE_CD_NM || '';
        const len = params.row.DATA_LEN || '';
        const scale = params.row.DATA_SCALE;
        
        if (!typeName || !len) return '';
        
        if (scale != null && scale !== '' && scale !== 0) {
          return `${typeName}(${len}, ${scale})`;
        }
        
        // ⭐ 소수점이 없으면 (길이)만
        return `${typeName}(${len})`;
      }
    }
  ];

  // ===== 동음이의어 선택 컬럼 =====
  const homonymColumns = [
    { headerName: '단어명', headerAlign: 'center', field: 'WORD_KOR_NM', width: 140 },
    { headerName: '단어영문명', headerAlign: 'center', field: 'WORD_ENG_NM', width: 140 },
    { headerName: '단어구분', headerAlign: 'center', field: 'WORD_SEC_CD', type: 'singleSelect', width: 80 ,align: 'center' , valueOptions: toValueOptions(cacheWordSecCd, 'CD_VAL', 'CD_VAL_NM')},
    { headerName: '단어영문정식명', headerAlign: 'center', field: 'WORD_ENG_FULL_NM', width: 140 }
  ];

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth={mode === 'delete' ? 'sm' : 'md'}
        fullWidth
        PaperProps={{
          style: mode === 'delete' ? {} : { minHeight: '80vh', maxHeight: '90vh' }  // 삭제 모드일 때 높이 제한 없음
        }}
      >
        <DialogTitle>
          {mode === 'add' && '용어추가'}
          {mode === 'edit' && '용어수정'}
          {mode === 'delete' && '용어삭제'}
        </DialogTitle>

        <DialogContent dividers>
          {/* ===== 삭제 모드 ===== */}
          {mode === 'delete' ? (
            <Stack spacing={2} sx={{ p: 2 }}>
              <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                <strong>{data?.TERM_KOR_NM || ''}</strong> 용어를 삭제하시겠습니까?
                <br />
                삭제된 데이터는 복구할 수 없습니다.
              </div>
            </Stack>
          ) : (
            /* ===== 추가/수정 모드 ===== */
            <Stack spacing={2}>
              {/* 용어명 검색 영역 - 추가 모드일 때만 표시 */}
              {mode === 'add' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <GTextField
                    label="용어명"
                    fullWidth
                    value={termKorNm}
                    onChange={(e) => setTermKorNm(e.target.value)}
                    onKeyDown={(e) => {if (e.key === 'Enter') handleSearchTerm(); }}
                    placeholder="용어명 입력"
                    size="small"
                  />
                  <GButton 
                    key="search" 
                    auth="Search" 
                    label="Search"
                    onClick={handleSearchTerm}
                    sx={{ minWidth: 80 }}
                  />
                </Box>
              )}

              {/* 용어추천 - 추가 모드일 때만 표시 */}
              {mode === 'add' && termSuggestions.length > 0 && (
                <Box>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>용어추천</div>
                  <GDataGrid
                    rows={termSuggestions}
                    columns={suggestionColumns}
                    height={110}
                    rowHeight={25}
                    Buttons={[false, false, false, false]}
                    columnHeaderHeight={30}
                    hideFooter
                    disableRowSelectionOnClick
                    onRowClick={(params) => handleSuggestionSelect(params.row)}
                    getRowId={(row, index) => index}
                  />
                </Box>
              )}

              {/* 구성 단어 - 항상 표시 */}
              <Box>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>구성 단어</div>
                <GDataGrid
                  rows={wordList}
                  columns={wordColumns}
                  height={150}
                  rowHeight={25}
                  Buttons={[false, false, false, false]}
                  columnHeaderHeight={30}
                  hideFooter
                  disableRowSelectionOnClick
                  getRowId={(row, index) => index}
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 8, fontWeight: 'bold' }}>도메인목록</div>
                <GDataGrid
                  rows={domainList}
                  columns={domainColumns}
                  height={150}
                  rowHeight={25}
                  Buttons={[false, false, false, false]}
                  columnHeaderHeight={30}
                  hideFooter
                  disableRowSelectionOnClick
                  onRowClick={(params) => handleDomainChange(params.row.DOMAIN_NO)}
                  getRowId={(row) => row.DOMAIN_NO}
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>
                  시스템 <span style={{ color: 'red' }}>*</span>
                </div>
                <GSelectBox
                  items={cacheSystemCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="S"
                  value={systemCd}
                  onChange={(v) => setSystemCd(v)}
                  fullWidth
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>
                  용어한글명 <span style={{ color: 'red' }}>*</span>
                </div>
                <GTextField
                  fullWidth
                  size="small"
                  value={termKorNm}
                  isReadOnly="true"
                  onChange={(e) => setTermKorNm(e.target.value)}
                  placeholder="용어한글명 입력"
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>
                  용어영문명 <span style={{ color: 'red' }}>*</span>
                </div>
                <GTextField
                  fullWidth
                  size="small"
                  value={termEngNm}
                  isReadOnly="true"
                  onChange={(e) => setTermEngNm(e.target.value)}
                  placeholder="용어영문명 입력"
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>
                  용어영문정식명 <span style={{ color: 'red' }}>*</span>
                </div>
                <GTextField
                  fullWidth
                  size="small"
                  value={termEngFullNm}
                  isReadOnly="true"
                  onChange={(e) => setTermEngFullNm(e.target.value)}
                  placeholder="용어영문정식명 입력"
                />
              </Box>

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
                        도메인명 <span style={{ color: 'red' }}>*</span>
                      </div>
                      <GTextField
                        fullWidth
                        size="small"
                        value={domainInfo.DOMAIN_KOR_NM}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                        데이터타입 <span style={{ color: 'red' }}>*</span>
                      </div>
                      <GTextField
                        fullWidth
                        size="small"
                        value={getCodeName(cacheDataTypeCd, domainInfo.DATA_TYPE_CD)}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                        데이터길이 <span style={{ color: 'red' }}>*</span>
                      </div>
                      <GTextField
                        fullWidth
                        size="small"
                        value={(() => {
                          const len = domainInfo.DATA_LEN;
                          const scale = domainInfo.DATA_SCALE;
                          
                          if (!len) return '';
                          
                          if (scale != null && scale !== '' && scale !== 0) {
                            return `${len}, ${scale}`;
                          }
                          
                          return len;
                        })()}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </Box>

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
                        분류단어유형 <span style={{ color: 'red' }}>*</span>
                      </div>
                      <GTextField
                        fullWidth
                        size="small"
                        value={getCodeName(cacheWordTpCd, classWordInfo.WORD_TP_CD)}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>
                        분류단어소분류 <span style={{ color: 'red' }}>*</span>
                      </div>
                      <GTextField
                        fullWidth
                        size="small"
                        value={getCodeName(cacheWordDtlTpCd, classWordInfo.WORD_DTL_TP_CD)}
                        InputProps={{ readOnly: true }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>
                  정의
                </div>
                <GTextField
                  fullWidth
                  multiline
                  rows={3}
                  value={termDefinDsc}
                  onChange={(e) => setTermDefinDsc(e.target.value)}
                  placeholder="정의 입력"
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>비고</div>
                <GTextField
                  fullWidth
                  multiline
                  rows={2}
                  value={termNote}
                  onChange={(e) => setTermNote(e.target.value)}
                  placeholder="비고 입력"
                />
              </Box>

              <Box>
                <div style={{ marginBottom: 4, fontSize: '14px' }}>신청사유</div>
                <GTextField
                  fullWidth
                  multiline
                  rows={2}
                  value={termAplyRsn}
                  onChange={(e) => setTermAplyRsn(e.target.value)}
                  placeholder="신청사유 입력"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          {mode === 'delete' ? (
            <>
              <GButton label="Delete" onClick={handleDelete} color="error" />
              <GButton label="Cancel" onClick={onClose} />
            </>
          ) : (
            <>
              <GButton label="Save" onClick={handleSave} />
              <GButton label="Cancel" onClick={onClose} />
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* 동음이의어 선택 팝업 */}
      <Dialog 
        open={openWordSelectModal} 
        onClose={() => setOpenWordSelectModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>동음이의어선택</DialogTitle>
        <DialogContent dividers>
          <GDataGrid
            rows={wordSelectList}
            columns={homonymColumns}
            height={300}
            rowHeight={25}
            Buttons={[false, false, false, false]}
            columnHeaderHeight={35}
            hideFooter
            disableRowSelectionOnClick
            onRowClick={(params) => handleSelectHomonym(params.row)}
            getRowId={(row) => row.WORD_NO}
          />
        </DialogContent>
        <DialogActions>
          <GButton label="닫기" onClick={() => setOpenWordSelectModal(false)} />
        </DialogActions>
      </Dialog>

      {/* 단어 신청 팝업 */}
      <METASDTSD01P1
        open={openWordCreateModal}
        onClose={() => setOpenWordCreateModal(false)}
        onSuccess={handleWordCreateSuccess}
        mode="add"
        data={wordCreateData}  // 전체 객체를 그대로 전달
        cacheWordSecCd={cacheWordSecCd}
        cacheWordTpCd={cacheWordTpCd}
        cacheWordDtlTpCd={cacheWordDtlTpCd}
        isTerm={true}
      />
    </>
  );
}