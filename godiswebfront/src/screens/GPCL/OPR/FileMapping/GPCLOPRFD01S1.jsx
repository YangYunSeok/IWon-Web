import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Input, Button, Space, message, Table } from 'antd';
import { Box, MenuItem, RadioGroup, FormControlLabel, Radio, Select, Grid, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles'

import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import GDataGrid from '@/components/GDataGrid.jsx';
import GSelectBox  from '@/components/GSelectBox.jsx';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GDynamicTreeTest from '@/components/GDynamicTreeTest.jsx';
import http from '@/libs/TaskHttp';

// GGridHeader 컴포넌트
import GGridHeader from '@/components/GGridHeader.jsx';

// SearchHeader 컴포넌트
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import Editor from "@monaco-editor/react";
import { cacheCode } from '@/libs/DataUtils';

// CustomGrid 컴포넌트
import CustomGrid from '@/components/GCustomGrid.jsx';

// GButton 컴포넌트
import GButton from '@/components/GButton';
import { blue } from '@mui/material/colors';
import { Visibility } from '@mui/icons-material';

// 트리구조 랜더링을 위한 객체 만들기
const buildTreeFromBatchList = (flatList) => {
  if (!flatList || flatList.length === 0) {
      return [];
  }
  const nodeMap = new Map();
  flatList.forEach(item => {
      nodeMap.set(item.FILE_MAP_ID, {
          id: item.FILE_MAP_ID,
          label: item.MAP_INFO_NM,
          children: []
      });
  });

  const treeRoots = [];

  flatList.forEach(item => {
      const node = nodeMap.get(item.FILE_MAP_ID);
      const parentId = item.UP_FILE_MAP_ID;

      if (parentId && nodeMap.has(parentId)) {
          const parentNode = nodeMap.get(parentId);
          parentNode.children.push(node);
      } else {
          // This is a root node
          treeRoots.push(node);
      }
  });

  return treeRoots;
};

//////////////////////
// Tab Panel
////////////////////////////
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: 1 }}>
        {children}
      </Box>
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function GPCLOPRFD01S1() {
  const [filters, setFilters] = useState({
    email: '',
    role: '',
    status: 'active',
    gender: ''
  });

  const [mappingDetail, setMappingDetail] = useState([]);
  const [hasChanges, setHasChanges] = useState(false); // 변경사항 존재 여부
  const [visibilityFlags, setVisibilityFlags] = useState({
    fileToDb: true, // Default to show File > DB fields
    dbToFile: false,
  });

  const [isReadOnly, setIsReadOnly] = useState(true);
  
  // 매핑파일위치코드
  const [lstMapInfoLocCd, setLstMapInfoLocCd] = useState([]);    // 파일위치
  const [lstMapExtentionCd, setLstMapxtentionCd] = useState([]); // 파일형식
  const [lstMapSepCd, setLstMapSepCd] = useState([]);            // 구분자
  const [mapTpCd, setMapTpCd] = useState([]);                    // 매핑유형
  const [lstDbNm, setLstDbNm] = useState([]);                    // DB명
  const [tableList, setTableList] = useState([])                 // table명
  const [targetTableList, setTargetTableList] = useState([])     // 타겟 table명
  const [mapSrcTpCd, setMapSrcTpCd] = useState([]);              // 매핑소스타입코드


  //배치 데이터
  const [batchList, setBatchList] = useState([]);
  const [treeData, setTreeData] = useState([]);

  //테마
  const theme = useTheme();


  useEffect(() => {
    (async () => {
      const params = ["MAP_INFO_LOC_CD", "MAP_EXTENTION_CD", "MAP_SEP_CD", "MAP_TP_CD", "MAP_SRC_TP_CD"];
      const result = await cacheCode(params);
      setLstMapInfoLocCd(result.MAP_INFO_LOC_CD || []);
      setLstMapxtentionCd(result.MAP_EXTENTION_CD || []);
      setLstMapSepCd(result.MAP_SEP_CD || []);
      setMapTpCd(result.MAP_TP_CD || []);
      setMapSrcTpCd(result.MAP_SRC_TP_CD || []);
      await getDb();
    })();
    // Set initial visibility based on default mapping type if available
    componentVisible(initialMappingData.MAP_TP_CD);
  }, []);

  ///////// 고정값
  const lstSrcHeaderYn = [
		{ CD_VAL: 'Y', CD_VAL_NM: 'Yes' },
		{ CD_VAL: 'N', CD_VAL_NM: 'No' }
	];

  const mapSrc = [
    {value : "aa", lable: "bb"},
    {value : "aa2", lable: "bb2"}
  ];

  const handleChange = (e) => {
    // setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFieldChange = (field, value) => {
    setMappingData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const componentVisible = (mapTypeCode) => {
    
    if (mapTypeCode === '01') { // File -> DB

    } else if (mapTypeCode === '02') { // DB -> File
      
    } else if (mapTypeCode === '') {
      setMappingData(initialMappingData);
    }
  };

  const handleSelectChange = (field, value) => {
    console.log("change field: "+ field + " value : " + value);
		setMappingData((prev) => ({ ...prev, [field]: value }));
		setHasChanges(true);
    if (field === 'SRC_DB_NM') {
      getTable(value);
    } else if (field === 'TAR_DB_NM') {
      getTargetTable(value);
    } else if (field === 'MAP_TP_CD') {
      componentVisible(value);
    } else if (field === 'TAR_SEP_CD') {
      value === '99' ? setIsReadOnly(false) : setIsReadOnly(true);
    }
	};


  const handleInitialize = () => {
    // setFilters({ email: '', role: '', status: 'active', gender: '' });
  };

  /**
   * 매뉴 트리 node 클릭시 동작
   * @param {*} node 
   */
  const handleTreeNodeClick = (node) => {
    const originalItem = batchList.find(item => item.FILE_MAP_ID === node.id);
    if (originalItem) {
      const clickedNodeData = { ...originalItem }; 

      if (clickedNodeData.MAP_GRP_TP_CD === "01") {
        clickedNodeData.MAP_INFO_ID = clickedNodeData.FILE_MAP_ID;
      }
      console.log(clickedNodeData);

      setMappingData({
        ...initialMappingData, // Reset to defaults
        ...clickedNodeData     // Apply new data
      });
      mapInfoSearch(clickedNodeData.MAP_INFO_ID);
    }
    
  };

  const mapInfoSearch = async (value) => {
    try {
      const param = {mapInfoId : value};
      const result = await http.get('/admin/fileMapping/getMapCol', {params: param});
      setMappingDetail(result);
    } catch (e) {

    }
  }

  const handleSearch = async () => {
    try {
      const result = await http.get('/admin/fileMapping/getBatchListMap', {});      
      setBatchList(result);
      setTreeData(buildTreeFromBatchList(result));
    } catch(e) {
      console.log("err");
    }
  };
  
  const getDb = async () => {
    try {
      const result = await http.get('/admin/fileMapping/getDb', {});
      setLstDbNm(result);
    } catch (e) {

    }
  }

  const getTable = async (value) => {
    try {
      const param = {dbName : value};
      const result = await http.get('/admin/fileMapping/getTable', {params : param});
      setTableList(result);
    } catch (e) {

    }
  
  }

  const getTargetTable = async (value) => {
    try {
      const param = {dbName : value};
      const result = await http.get('/admin/fileMapping/getTable', {params : param}); // Assuming same endpoint
      setTargetTableList(result);
    } catch (e) {

    }
  }

  //========================================

  const initialMappingData = {
    MAP_INFO_ID: '',
    MAP_INFO_NM: '',
    MAP_DSC: '',
    MAP_TP_CD: '00',
    MENU_ENG_NM: '',
    SRC_LOC_CD: '01',
    SRC_WAIT_MIN: '',
    SRC_FILE_NM: '',
    MAP_NM: '',
    SRC_HEADER_YN: 'Y',
    SRC_EXTENTION_CD: '01',
    SRC_SEP_CD: '01',
    DB_NM: '01',
    MAP_EXTENTION_CD: '01',
    MAP_SEP_CD: '00',
    SRC_DB_NM: '',
    SRC_TABLE_NM: '',
    SRC_SEP_CHAR: '',
    HELP_URL: '',
    MENU_ORD: '',
    SCREN_NO: '',
    PROGM_ID: '',
    PROGM_NM: '',
    MENU_IMG_ID: '',
    BZ_UPCLSS_ID: '',
    SCREN_EXECUTE_TP_CD: 'E',
    SCREN_PARM_CONTN: '',
    USE_YN: 'Y',
    SYS_TP_CD: 'STO',
    TAR_LOC_CD: '',
    TAR_WAIT_MIN: '',
    TAR_HEADER_YN: 'Y',
    TAR_FILE_NM: '',
    TAR_EXTENTION_CD: '',
    TAR_SEP_CD: '',
    TAR_SEP_CHAR: '으아아ㅏ 이거 리액트 맞나',
    TAR_DB_NM: '',
    TAR_TABLE_NM: '',
  };

  const [mappingData, setMappingData] = useState(initialMappingData);
  const handleProgramSearch = () => {
		setOpenProgramPopup(true);
	};

  const addGroupRow = () => ({
    ROW_STATE: 'I',
    GRP_CD_ID: `_NEW_${Date.now()}`,
    GRP_NM: '',
    GRP_CD_DSC: '',
    GRP_TYPE_CD: '01',
    MEM_CREAT_OBJ_YN: 'Y',
    VALID_STRT_DD: '20240101',
    VALID_END_DD: '99991231',
  });

  const addItemRow = () => ({
    ROW_STATE: 'I',
    CD_VAL: `_NEW_${Date.now()}`,
    CD_VAL_NM: '',
    USE_YN: 'Y',
  });

  const getItems = (row) => {
    console.log("=====row=======");
    console.log(row);
  };

  /////////////////////////////
  // ===== 매핑상세 컬럼 ===== //
  /////////////////////////////
  const groupColumns = [
      { headerName: '소스순번'   , headerAlign: 'center', field: 'MAP_SRC_ORD', width: 80, editable: true },
      { headerName: '소스필드'   , headerAlign: 'center', field: 'MAP_SRC_FIELD_NM', flex: 1, editable: true },
      { headerName: '타입'      , headerAlign: 'center', field: 'MAP_SRC_TP_CD', width: 80, editable: true, type: 'singleSelect', valueOptions: mapSrc, Change: handleChange},
      { headerName: '값'        , headerAlign: 'center', field: 'MAP_SRC_VALUE', flex: 1, editable: true },

      { headerName: '변환식'    , headerAlign: 'center', field: 'MAP_TF_FORM', flex: 1, editable: true },
      { headerName: '사용여부'  , headerAlign: 'center', field: 'MAP_COL_USE_YN', width: 80, editable: true, type: 'checkbox' },
      { headerName: '타겟순번'  , headerAlign: 'center', field: 'MAP_TAR_ORD', width: 80, editable: true },
      { headerName: '타겟필드'  , headerAlign: 'center', field: 'MAP_TAR_FIELD_NM', flex: 1, editable: true }
    ];

  const [value, setValue] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    console.log("tab change");
    setValue(newValue);
  };


  const saveGroup = async () => {
    const data = changes(groups);

    if (data.length === 0) {
      await await GMessageBox.Show('MGI00001', 'Ok');
      return;
    }

    const r = await GMessageBox.Show('MGQ00067', 'YesNo', '매핑을');
    // r: 'ok' | 'cancel' | 'yes' | 'no'
    if (r === 'no') {
      return;
    }

    try {
      setSavingGroup(true);
      await http.post('/admin/savegroup', data, { shape: 'datarow' });
      message.success('매핑이 저장되었습니다.');
      getGroups();
    } catch (e) {
      console.error(e);
      message.error(e.message || '매핑 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingGroup(false);
    }
  };

  const getValidatedSelectValue = (options, value, valueKey = 'CD_VAL') => {
    if (!Array.isArray(options) || !value) return '';
    const isValid = options.some(option => option && option[valueKey] === value);
    return isValid ? value : '';
  };

  const mapTpCdValue = getValidatedSelectValue(mapTpCd, mappingData.MAP_TP_CD);
  const srcLocCd = getValidatedSelectValue(lstMapInfoLocCd, mappingData.SRC_LOC_CD);
  const srcExtentionCd = getValidatedSelectValue(lstMapExtentionCd, mappingData.SRC_EXTENTION_CD);
  const srcSepCd = getValidatedSelectValue(lstMapSepCd, mappingData.SRC_SEP_CD);

  const tarLocCd = getValidatedSelectValue(lstMapInfoLocCd, mappingData.TAR_LOC_CD);
  const tarExtentionCd = getValidatedSelectValue(lstMapExtentionCd, mappingData.TAR_EXTENTION_CD);
  const tarSepCd = getValidatedSelectValue(lstMapSepCd, mappingData.TAR_SEP_CD);

  return (
    <div style={{height: 'calc(100vh - 158px)', overflow: 'auto', display: "flex", flexDirection: "column"}}>
      <Stack>
        <GSearchHeader
          fields={[
            {},{},{},{}
          ]}

          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={handleSearch} />,
          ]}
        />
      </Stack>
        
      <GLayoutGroup orientation="horizontal" spacing={1} height={'calc(100vh - 220px)'}>
        <div style={{ display: "flex", 
                      flexDirection: "column", 
                      minWidth: '340px', 
                      width: '20%', 
                      gap:12, 
                      border:"1px solid #ddd", 
                      padding:12, 
                      boxSizing:"border-box", 
                      height: '100%',
                      minHeight: 0
                    }}>
          <div style={{ flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
            <GDynamicTreeTest data={treeData} onNodeClick={handleTreeNodeClick} />
          </div>
        </div>

        <div style={{ display: "flex", 
                      flex: 1,
                      width: '76%'
                      }}>
            <GLayoutGroup orientation="vertical" spacing={1}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '8px', 
              }}>
                <GGridHeader 
                  title="매핑정보"
                />
                {/* <Box fontSize="13px" fontWeight="600" color="#333">● 매핑정보</Box> */}
              </Box>     
              <GLayoutGroup orientation="vertical" spacing={0}>
                <GLayoutGroup orientation="horizontal" spacing={0}>
                  <GLayoutItem
                    label="매핑ID"
                    height={30}
                    border="1px solid"
                    borderRadius={0}
                    borderVariant="cells"
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={mappingData.MAP_INFO_ID || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input:read-only' : { backgroundColor: theme.palette.grey[100], cursor: 'default', } ,}}
                    />
                  </GLayoutItem>

                  <GLayoutItem
                    label="매핑명"
                    height={30}
                    border="1px solid"
                    borderRadius={0}
                    borderVariant="cells"
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={mappingData.MAP_INFO_NM || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input:read-only' : { backgroundColor: theme.palette.grey[100], cursor: 'default', } ,}}
                    />
                  </GLayoutItem>
                </GLayoutGroup> 
                <GLayoutGroup orientation="horizontal" spacing={0}>
                  <GLayoutItem
                    label="매핑설명"
                    height={30}
                    border="1px solid"
                    borderRadius={0}
                    borderVariant="cells"
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={mappingData.MAP_DSC || ''}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiInputBase-input:read-only' : { backgroundColor: theme.palette.grey[100], cursor: 'default', } ,}}
                    />
                  </GLayoutItem>
                </GLayoutGroup>
              </GLayoutGroup>

              <GLayoutGroup orientation="horizontal" spacing={0} marginTop={2}>
                <GLayoutItem
                  height={30}
                  border="4px solid"
                  borderColor={'#1976D2'}
                  backgroundColor={'#90CAF9'}>
                  <GLayoutItem
                    label="매핑유형"
                    height={30}
                    border="1px solid"
                    borderRadius={0}
                    borderVariant="cells"
                  >
                    <GSelectBox
                      items={mapTpCd}
                      valueKey="CD_VAL"
                      labelKey="CD_VAL_NM"
                      toplabel='S'                    // 'A' : All , 'S' : Select
                      value={mapTpCdValue}
                      onChange={(v) => handleSelectChange('MAP_TP_CD', v)}
                    />
                  </GLayoutItem>
                  <GLayoutItem></GLayoutItem>
                  <GLayoutItem></GLayoutItem>
                  <GLayoutItem></GLayoutItem>
                </GLayoutItem>
              </GLayoutGroup>

              {/* 소스/타겟 데이터 매핑 정보 */}
              <GLayoutGroup orientation="horizontal" spacing={1} marginTop={1} sx={{flexGrow: 1, minHeight: 0}}>
                {/* 소스 데이터 매핑 정보 */}
                <GLayoutGroup orientation="vertical" spacing={0} flex={1} sx={{height: '100%'}}>
                  {(mappingData.MAP_TP_CD === '01' || mappingData.MAP_TP_CD === '00') && ( // File -> DB: Source is File
                    <>
                      <GLayoutItem label="소스파일위치" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox items={lstMapInfoLocCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={srcLocCd} onChange={(v) => handleSelectChange('SRC_LOC_CD', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="소스대기시간(분)" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <TextField fullWidth size="small" value={mappingData.SRC_WAIT_MIN || ''} onChange={(e) => handleFieldChange('SRC_WAIT_MIN', e.target.value)} />
                      </GLayoutItem>
                      <GLayoutItem label="소스헤더포함여부" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox items={lstSrcHeaderYn} valueKey="CD_VAL" labelKey="CD_VAL_NM" value={mappingData.SRC_HEADER_YN} onChange={(v) => handleSelectChange('SRC_HEADER_YN', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="소스파일명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <TextField fullWidth size="small" value={mappingData.SRC_FILE_NM || ''} onChange={(e) => handleFieldChange('SRC_FILE_NM', e.target.value)} />
                      </GLayoutItem>
                      <GLayoutItem label="소스파일형식" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={lstMapExtentionCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={srcExtentionCd} onChange={(v) => handleSelectChange('SRC_EXTENTION_CD', v)} />
                      </GLayoutItem>
                      <GLayoutGroup orientation="horizontal" spacing={0}>
                        <GLayoutItem label="소스구분자" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                          <GSelectBox fullWidth items={lstMapSepCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={srcSepCd} onChange={(v) => handleSelectChange('SRC_SEP_CD', v)} />
                        </GLayoutItem>
                        <GLayoutItem height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                          <TextField fullWidth size="small" value={mappingData.SRC_SEP_CHAR} onChange={(e) => handleFieldChange('SRC_SEP_CHAR', e.target.value)} />
                        </GLayoutItem>
                      </GLayoutGroup>
                    </>
                  )}
                  { mappingData.MAP_TP_CD === '02' && ( // DB -> File: Source is DB
                    <>
                      <GLayoutItem label="소스DB명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={lstDbNm} valueKey="cd" labelKey="name" toplabel="S" value={mappingData.SRC_DB_NM || ''} onChange={(v) => handleSelectChange('SRC_DB_NM', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="소스테이블명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={tableList} valueKey="cd" labelKey="name" toplabel="S" value={mappingData.SRC_TABLE_NM} onChange={(v) => handleSelectChange('SRC_TABLE_NM', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="Where" height={90} width="100%" border="1px solid" borderRadius={0} borderVariant="cells">
                      <Stack sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>                     
                        <CustomTabPanel>
                          <Editor height="90px" width="430px" defaultLanguage="sql" options={{ lineNumbers: "on", wordWrap: "on", lineHeight: 24, wrappingIndent: "indent", minimap: { enabled: false }}} />
                        </CustomTabPanel>
                      </Stack>
                      </GLayoutItem>
                      <GLayoutItem height={30} contentAlign="right" sx={{ mt: 1 }}>
                        <GButton label="소스Apply" onClick={() => console.log('소스 Apply 클릭')} />
                      </GLayoutItem>
                    </>
                  )}
                  {mappingData.MAP_TP_CD === '04' && ( // SQL -> File
                    <>
                      <GLayoutItem label="SQL" border="1px solid" borderRadius={0} borderVariant="cells" height={"100%"} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
                      <Stack sx={{ border: 1, borderColor: 'divider', borderRadius: 1, flexGrow: 1 }}>
                        <CustomTabPanel sx={{ height: '100%'}}>
                          <Editor height="200px" width="100%" defaultLanguage="sql" options={{ lineNumbers: "on", wordWrap: "on", lineHeight: 24, wrappingIndent: "indent", minimap: { enabled: false }}} />
                        </CustomTabPanel>
                      </Stack>
                      </GLayoutItem>
                    </>
                  )}
                </GLayoutGroup>

                {/* 타겟 데이터 매핑 정보 */}
                <GLayoutGroup orientation="vertical" spacing={0} flex={1}>
                  {(mappingData.MAP_TP_CD === '01' || mappingData.MAP_TP_CD === '00') && ( // File -> DB: Target is DB
                    <>
                      <GLayoutItem label="타겟DB명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={lstDbNm} valueKey="cd" labelKey="name" toplabel="S" value={mappingData.TAR_DB_NM || ''} onChange={(v) => handleSelectChange('TAR_DB_NM', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="타겟테이블명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={targetTableList} valueKey="cd" labelKey="name" toplabel="S" value={mappingData.TAR_TABLE_NM} onChange={(v) => handleSelectChange('TAR_TABLE_NM', v)} />
                      </GLayoutItem>
                      <GLayoutItem height={30} contentAlign="right" sx={{ mt: 1 }}>
                        <GButton label="타겟Apply" onClick={() => console.log('타겟 Apply 클릭')} />
                      </GLayoutItem>
                    </>
                  )}
                  { (mappingData.MAP_TP_CD === '02' || mappingData.MAP_TP_CD === '04') && ( // DB -> File: Target is File
                    <>
                      <GLayoutItem label="타겟파일위치" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox items={lstMapInfoLocCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={tarLocCd} onChange={(v) => handleSelectChange('TAR_LOC_CD', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="타겟대기시간(분)" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <TextField fullWidth size="small" value={mappingData.TAR_WAIT_MIN || ''} onChange={(e) => handleFieldChange('TAR_WAIT_MIN', e.target.value)} />
                      </GLayoutItem>
                      <GLayoutItem label="타겟헤더포함여부" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox items={lstSrcHeaderYn} valueKey="CD_VAL" labelKey="CD_VAL_NM" value={mappingData.TAR_HEADER_YN} onChange={(v) => handleSelectChange('TAR_HEADER_YN', v)} />
                      </GLayoutItem>
                      <GLayoutItem label="타겟파일명" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <TextField fullWidth size="small" value={mappingData.TAR_FILE_NM || ''} onChange={(e) => handleFieldChange('TAR_FILE_NM', e.target.value)} />
                      </GLayoutItem>
                      <GLayoutItem label="타겟파일형식" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                        <GSelectBox fullWidth items={lstMapExtentionCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={tarExtentionCd} onChange={(v) => handleSelectChange('TAR_EXTENTION_CD', v)} />
                      </GLayoutItem>
                      <GLayoutGroup orientation="horizontal" spacing={0}>
                        <GLayoutItem label="타겟구분자" height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                          <GSelectBox fullWidth items={lstMapSepCd} valueKey="CD_VAL" labelKey="CD_VAL_NM" toplabel="S" value={tarSepCd} onChange={(v) => handleSelectChange('TAR_SEP_CD', v)} />
                        </GLayoutItem>
                        <GLayoutItem height={30} border="1px solid" borderRadius={0} borderVariant="cells">
                          <TextField fullWidth size="small" value={mappingData.TAR_SEP_CHAR} onChange={(e) => handleFieldChange('TAR_SEP_CHAR', e.target.value)} InputProps={{readOnly: isReadOnly}} 
                              sx={{ '& .MuiInputBase-input:read-only' : { backgroundColor: theme.palette.grey[100], cursor: 'default', } ,}}
                            />
                        </GLayoutItem>
                      </GLayoutGroup>
                    </>
                  )}
                </GLayoutGroup>
              </GLayoutGroup>

              <Stack sx={{ 
                border: 1, 
                borderColor: 'divider',
                borderRadius: 1
              }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={value} onChange={handleTabChange} sx={{ minHeight: 32, height: 32}}> 
                    <Tab label="수행 전 SQL" {...a11yProps(0)} sx={{ minHeight: 32, height: 32, py: 0}}/>
                    <Tab label="수행 후 SQL" {...a11yProps(1)} sx={{ minHeight: 32, height: 32, py: 0 }}/>
                  </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                  <Editor
                      height="100px"
                      defaultLanguage="sql"
                      options={{ lineNumbers: "on", wordWrap: "on", lineHeight: 24, wrappingIndent: "indent", minimap: { enabled: false }}}
                    />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                  <Editor
                      height="100px"
                      defaultLanguage="sql"
                      options={{ lineNumbers: "on", wordWrap: "on", lineHeight: 24, wrappingIndent: "indent", minimap: { enabled: false }}}
                    />
                </CustomTabPanel>
              </Stack>

              <Stack>
                <GDataGrid
                  title="매핑상세"
                  rows={mappingDetail}
                  columns={groupColumns}
                  Buttons={[true, true, true, true]}
                  columnHeaderHeight={30}
                  rowHeight={25}
                  checkboxSelection
                  height={220}
                  pagination={false}
                  hideFooter
                  disableRowSelectionOnClick
                  onRowsChange={setMappingDetail}        // 데이터변경사항 반영
                  // onRowClick={(params) => getItems(params.row)}
                  createNewRow={addGroupRow}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <GButton key="save" auth="Save" label="Save" onClick={saveGroup} />
                </div>
              </Stack>
            </GLayoutGroup>
        </div>
                  

      </GLayoutGroup>
    </div>

    
  );
}
