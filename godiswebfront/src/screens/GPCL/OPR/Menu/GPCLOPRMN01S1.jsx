import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import GSimpleTreeGrid from '@/components/GSimpleTreeGrid';
import GSelectBox from '@/components/GSelectBox';
import GDataGrid from '@/components/GDataGrid';
import GPopup from '@/components/GPopup';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GButton from '@/components/GButton';
import GTextField from '@/components/GTextField';
import GTitleIcon from '@/components/GTitleIcon';
import { http } from '@/libs/TaskHttp';
import { cacheCode } from '@/libs/DataUtils';
import GMessageBox from '@/components/GMessageBox';
import GPageContainer from '@/components/GPageContainer';
import GDetailTitle from '@/components/GDetailTitle';
import GButtonGroup from '@/components/GButtonGroup';
import GContentBox from '@/components/GContentBox';
import GMenuIconSelectPopup from '@/components/GMenuIconSelectPopup';
import { GMenuIcon } from '@/components/GMenuIcon';

/**
 * 메뉴 관리 컴포넌트
 * - 메뉴 트리 관리 (추가, 수정, 삭제)
 * - 프로그램 목록 관리
 * - 프로그램별 권한 버튼 관리
 */
export default function GPCLOPRMN01S1() {
	// ==============================================================  
	//                        변수 정의  
	// ==============================================================  
	// 코드 목록 상태
	const [lstOpenType, setLstOpenType] = useState([]);
	const [lstButtonVariant, setLstButtonVariant] = useState([]);
	
	// 사용여부 목록 (고정값)
	const lstUseYn = [
		{ CD_VAL: 'Y', CD_VAL_NM: 'Yes' },
		{ CD_VAL: 'N', CD_VAL_NM: 'No' }
	];

	// 메뉴 트리 관련 상태
	const [menuTreeData, setMenuTreeData] = useState([]);
	const [originalMenuTreeData, setOriginalMenuTreeData] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [hasChanges, setHasChanges] = useState(false);
	const [nextMenuId, setNextMenuId] = useState(1);

	// 메뉴 상세 정보 상태
	const [detailData, setDetailData] = useState({
		MENU_ID: '',
		MENU_ID_NUM: '',
		MENU_NM: '',
		MENU_ENG_NM: '',
		HELP_URL: '',
		MENU_ORD: '',
		SCREN_NO: '',
		PROGM_ID: '',
		PROGM_NM: '',
		MENU_IMG_ID: '',
		BZ_UPCLSS_ID: '',
		SCREN_EXECUTE_TP_CD: 'E',
		SCREN_PARM_CONTN: '',
		USE_YN: '',
		SYS_TP_CD: 'STO',
	});

	// 프로그램 목록 관련 상태
	const [programListData, setProgramListData] = useState([]);
	const [originalProgramListData, setOriginalProgramListData] = useState([]);
	const [selectedProgram, setSelectedProgram] = useState(null);

	// 권한 버튼 목록 관련 상태
	const [assignedButtonList, setAssignedButtonList] = useState([]);
	const [filteredAssignedButtonList, setFilteredAssignedButtonList] = useState([]);
	const [originalFilteredAssignedButtonList, setOriginalFilteredAssignedButtonList] = useState([]);

	// 팝업 관련 상태
	const [openProgramPopup, setOpenProgramPopup] = useState(false);
	const [openButtonListPopup, setOpenButtonListPopup] = useState(false);
	const [openIconSelectModal, setOpenIconSelectModal] = useState(false);
	const [selectedRowForEdit, setSelectedRowForEdit] = useState(null);
	const [buttonMasterList, setButtonMasterList] = useState([]);
	const [originalButtonMasterList, setOriginalButtonMasterList] = useState([]);
	const [buttonPopupMode, setButtonPopupMode] = useState(null);
	const [buttonPopupKey, setButtonPopupKey] = useState(0);

	// DOM 참조
	const programGridRef = useRef(null);

	// ==============================================================  
	//                        데이터 조회 처리  
	// ==============================================================  

	/**
	 * 컴포넌트 마운트 시 코드 캐시 데이터 조회
	 */
	useEffect(() => {
		(async () => {
			const params = ["SCREN_EXECUTE_TP_CD", "BUTN_VRNT_CD"];
			const result = await cacheCode(params);
			setLstOpenType(result.SCREN_EXECUTE_TP_CD || []);
			setLstButtonVariant(result.BUTN_VRNT_CD || []);
		})();
	}, []);

	/**
	 * 메뉴 데이터 조회
	 */
	const loadMenuData = async () => {
		try {
			const currentSelectedMenuId = selectedMenu?.MENU_ID;
			
			const { tables } = await http.post('/admin/getMenuData', null, {
				params: { systemCode: 'STO' },
				shape: 'dataset'
			});

			const menuWithId = (tables.dtMenu || []).map((menu, idx) => ({
				id: menu.MENU_ID || String(idx),
				...menu,
				UP_MENU_ID: menu.UP_MENU_ID || null
			}));

			setMenuTreeData(menuWithId);
			setOriginalMenuTreeData(menuWithId);
			setProgramListData(tables.dtProgramList || []);
			setOriginalProgramListData(tables.dtProgramList || []);
			
			setAssignedButtonList(tables.dtBtnList || []);
			setFilteredAssignedButtonList(tables.dtBtnList || []);

			const maxId = menuWithId.reduce((max, menu) => {
				const match = menu.MENU_ID?.match(/^GPCLMENU(\d+)$/);
				if (match) {
					const numericId = parseInt(match[1], 10);
					return Math.max(max, numericId);
				}
				return max;
			}, 0);

			setNextMenuId(maxId + 1);

			// 기존에 선택된 메뉴가 있으면 복원
			if (currentSelectedMenuId) {
				const restoredMenu = menuWithId.find(m => m.MENU_ID === currentSelectedMenuId);
				if (restoredMenu) {
					setSelectedMenu(restoredMenu);
					setDetailData({
						MENU_ID: restoredMenu.MENU_ID || '',
						MENU_ID_NUM: restoredMenu.MENU_ID_NUM || '',
						MENU_NM: restoredMenu.MENU_NM || '',
						MENU_ENG_NM: restoredMenu.MENU_ENG_NM || '',
						HELP_URL: restoredMenu.HELP_URL || '',
						MENU_ORD: restoredMenu.MENU_ORD !== undefined && restoredMenu.MENU_ORD !== null ? restoredMenu.MENU_ORD : '',
						SCREN_NO: restoredMenu.SCREN_NO || '',
						PROGM_ID: restoredMenu.PROGM_ID || '',
						PROGM_NM: restoredMenu.PROGM_NM || '',
						MENU_IMG_ID: restoredMenu.MENU_IMG_ID || '',
						BZ_UPCLSS_ID: restoredMenu.BZ_UPCLSS_ID || '',
						SCREN_EXECUTE_TP_CD: restoredMenu.SCREN_EXECUTE_TP_CD || 'E',
						SCREN_PARM_CONTN: restoredMenu.SCREN_PARM_CONTN || '',
						USE_YN: restoredMenu.USE_YN || 'Y',
						SYS_TP_CD: restoredMenu.SYS_TP_CD || 'STO',
					});
				}
			} 
			// 처음 로드 시에는 첫 번째 메뉴 선택
			else if (menuWithId.length > 0) {
				const firstMenu = menuWithId[0];
				handleMenuSelect(firstMenu);
			}

			if (tables.dtProgramList && tables.dtProgramList.length > 0) {
				const firstProgram = tables.dtProgramList[0];
				setSelectedProgram(firstProgram);

				const filtered = (tables.dtBtnList || []).filter(btn => btn.PROGM_ID === firstProgram.PROGM_ID);
				setFilteredAssignedButtonList(filtered);
				setOriginalFilteredAssignedButtonList(filtered);
			}
		} catch (error) {
			console.error('메뉴 데이터 로드 실패:', error);
		}
	};

	/**
	 * 컴포넌트 마운트 시 메뉴 데이터 조회
	 */
	useEffect(() => {
		loadMenuData();
	}, []);

	/**
	 * Detail 영역 필드 변경 시 트리 데이터 실시간 동기화
	 */
	useEffect(() => {
		if (!selectedMenu || !selectedMenu.MENU_ID) return;

		setMenuTreeData(prev => prev.map(menu => 
			menu.MENU_ID === selectedMenu.MENU_ID
				? {
					...menu,
					MENU_ID_NUM: detailData.MENU_ID_NUM,
					MENU_NM: detailData.MENU_NM,
					MENU_ENG_NM: detailData.MENU_ENG_NM,
					HELP_URL: detailData.HELP_URL,
					MENU_ORD: detailData.MENU_ORD,
					SCREN_NO: detailData.SCREN_NO,
					PROGM_ID: detailData.PROGM_ID,
					PROGM_NM: detailData.PROGM_NM,
					MENU_IMG_ID: detailData.MENU_IMG_ID,
					BZ_UPCLSS_ID: detailData.BZ_UPCLSS_ID,
					SCREN_EXECUTE_TP_CD: detailData.SCREN_EXECUTE_TP_CD,
					SCREN_PARM_CONTN: detailData.SCREN_PARM_CONTN,
					USE_YN: detailData.USE_YN,
					SYS_TP_CD: detailData.SYS_TP_CD,
					ROW_STATE: menu.ROW_STATE === 'I' ? 'I' : (hasChanges ? 'U' : menu.ROW_STATE)
				}
				: menu
		));
	}, [detailData, selectedMenu, hasChanges]);

	// ==============================================================  
	//                        데이터 저장 처리  
	// ==============================================================  

	/**
	 * 메뉴 데이터 저장 (상단 Save)
	 */
	const handleSave = async () => {
		const changedMenusFromTree = menuTreeData
			.filter(m => m.ROW_STATE)
			.map(m => ({
				...m,
				SYS_TP_CD: m.SYS_TP_CD || 'STO'
			}));
		
		let allChangedMenus = [...changedMenusFromTree];
		
		if (selectedMenu && selectedMenu.MENU_ID) {
			const existingIndex = allChangedMenus.findIndex(m => m.MENU_ID === selectedMenu.MENU_ID);
			
			let executeType = detailData.SCREN_EXECUTE_TP_CD;
			if (executeType === 'Expand') {
				executeType = 'E';
			} else if (executeType === 'Collapse') {
				executeType = 'C';
			} else if (!executeType || (typeof executeType === 'string' && executeType.trim() === '')) {
				executeType = 'E';
			}

			const saveData = {
				MENU_ID: detailData.MENU_ID,
				MENU_ID_NUM: (detailData.MENU_ID_NUM && String(detailData.MENU_ID_NUM).trim() !== '') ? detailData.MENU_ID_NUM : null,
				MENU_NM: detailData.MENU_NM || '',
				MENU_ENG_NM: detailData.MENU_ENG_NM || '',
				HELP_URL: detailData.HELP_URL || '',
				MENU_ORD: (detailData.MENU_ORD !== null && detailData.MENU_ORD !== undefined && detailData.MENU_ORD !== '') ? detailData.MENU_ORD : null,
				SCREN_NO: (detailData.SCREN_NO && String(detailData.SCREN_NO).trim() !== '') ? detailData.SCREN_NO : null,
				PROGM_ID: detailData.PROGM_ID || null,
				PROGM_NM: detailData.PROGM_NM || '',
				MENU_IMG_ID: detailData.MENU_IMG_ID || '',
				BZ_UPCLSS_ID: detailData.BZ_UPCLSS_ID || '',
				UP_MENU_ID: selectedMenu.UP_MENU_ID || null,
				SCREN_EXECUTE_TP_CD: executeType,
				SCREN_PARM_CONTN: detailData.SCREN_PARM_CONTN || '',
				USE_YN: detailData.USE_YN || 'Y',
				SYS_TP_CD: selectedMenu.ROW_STATE === 'I' ? 'STO' : (detailData.SYS_TP_CD || 'STO'),
				ROW_STATE: selectedMenu.ROW_STATE === 'I' ? 'I' : 'U'
			};

			if (existingIndex >= 0) {
				allChangedMenus[existingIndex] = saveData;
			} else if (hasChanges) {
				allChangedMenus.push(saveData);
			}
		}

		if (allChangedMenus.length === 0) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}

		// 메뉴명이 비어있는지 체크
		for (const menu of allChangedMenus) {
			if (menu.ROW_STATE === 'I' || menu.ROW_STATE === 'U') {
				if (!menu.MENU_NM || menu.MENU_NM.trim() === '') {
					await GMessageBox.Show('MGW00018', 'Ok','메뉴명');
					return;
				}
			}
		}

		const insertCnt = allChangedMenus.filter(m => m.ROW_STATE === 'I').length;
		const updateCnt = allChangedMenus.filter(m => m.ROW_STATE === 'U').length;
		const deleteCnt = allChangedMenus.filter(m => m.ROW_STATE === 'D').length;

		const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
		if (r === 'no') {
			return;
		}

		try {
			const response = await http.post('/admin/savemenudata', allChangedMenus, { 
				shape: 'json',
				showSpinner: true 
			});

			await GMessageBox.Show('MGI00352', 'Ok');
			setHasChanges(false);
			await loadMenuData();
		} catch (error) {
			console.error('메뉴 저장 실패:', error);
			await GMessageBox.Show('저장중 오류가 발생했습니다', 'Ok');
		}
	};

	/**
	 * 프로그램 및 권한 버튼 데이터 저장 (하단 Save)
	 */
	const handleProgramSave = async () => {
		const changedButtons = filteredAssignedButtonList
			.filter(btn => btn.ROW_STATE)
			.map(btn => ({
				BUTN_ID: btn.BUTN_ID || null,
				BUTN_DSC: btn.BUTN_DSC || null,
				PROGM_ID: btn.PROGM_ID || selectedProgram?.PROGM_ID || null,
				SYS_TP_CD: 'STO',
				ROW_STATE: btn.ROW_STATE
			}));
		
		const changedPrograms = programListData
			.filter(prog => prog.ROW_STATE)
			.map(prog => ({
				PROGM_ID: prog.PROGM_ID || null,
				PROGM_NM: prog.PROGM_NM || null,
				CLSS_NM: prog.CLSS_NM || '',
				OBJ_FILE_NM: prog.OBJ_FILE_NM || '',
				SYS_TP_CD: prog.SYS_TP_CD || 'STO',
				ROW_STATE: prog.ROW_STATE
			}));

		if (changedButtons.length === 0 && changedPrograms.length === 0) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}

		if (changedButtons.length > 0) {
			for (const btn of changedButtons) {
				if (!btn.BUTN_ID || btn.BUTN_ID === '') {
					await GMessageBox.Show('MGW00019', 'Ok','Authority');
					return;
				}
			}
		}

		if (changedPrograms.length > 0) {
			for (const prog of changedPrograms) {
				if (!prog.PROGM_ID || prog.PROGM_ID === '') {
					await GMessageBox.Show('MGW00018', 'Ok','Program ID');
					return;
				}
				if (!prog.CLSS_NM || prog.CLSS_NM === '') {
					await GMessageBox.Show('MGW00018', 'Ok','URL');
					return;
				}
			}
		}

		const insertCnt = [...changedButtons, ...changedPrograms].filter(item => item.ROW_STATE === 'I').length;
		const updateCnt = [...changedButtons, ...changedPrograms].filter(item => item.ROW_STATE === 'U').length;
		const deleteCnt = [...changedButtons, ...changedPrograms].filter(item => item.ROW_STATE === 'D').length;

		const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
		if (r === 'no') {
			return;
		}

		try {
			const dataSet = {
				dtBtnList: changedButtons,
				dtProgramList: changedPrograms
			};

			const response = await http.post('/admin/saveprogramlist', dataSet, {
				shape: 'json',
				showSpinner: true
			});

			await GMessageBox.Show('MGI00352', 'Ok');
			await loadMenuData();
			
			if (selectedProgram) {
				setTimeout(() => {
					setAssignedButtonList(prev => {
						const filtered = prev.filter(btn => btn.PROGM_ID === selectedProgram.PROGM_ID);
						setFilteredAssignedButtonList(filtered);
						setOriginalFilteredAssignedButtonList(filtered);
						return prev;
					});
				}, 100);
			}
		} catch (error) {
			console.error('프로그램 권한 저장 실패:', error);
			await GMessageBox.Show('저장 중 오류가 발생했습니다', 'Ok');
		}
	};

	/**
	 * 버튼 마스터 데이터 저장 (팝업 Save)
	 */
	const handleButtonListSave = async (allRows) => {
		const changedButtons = allRows.filter(row => row.ROW_STATE);
		
		if (changedButtons.length === 0) {
			await GMessageBox.Show('MGI00001', 'Ok');
			return;
		}
	
		// ROW_STATE가 'D'가 아닌 행(I, U)만 validation 체크
		for (const btn of changedButtons) {
			if (btn.ROW_STATE === 'I' || btn.ROW_STATE === 'U') {
				if (!btn.BUTN_ID || btn.BUTN_ID === '') {
					await GMessageBox.Show('MGW00018', 'Ok','버튼 ID');
					return;
				}else if(!btn.BUTN_DSC || btn.BUTN_DSC === ''){
					await GMessageBox.Show('MGW00018', 'Ok','버튼 설명');
					return;
				}else if(!btn.BUTN_CLOR || btn.BUTN_CLOR === ''){
					await GMessageBox.Show('MGW00018', 'Ok','버튼 컬러');
					return;
				}else if(!btn.BUTN_VRNT_CD || btn.BUTN_VRNT_CD === ''){
					await GMessageBox.Show('MGW00018', 'Ok','버튼 스타일');
					return;
				}
			}
		}
	
		const insertCnt = changedButtons.filter(btn => btn.ROW_STATE === 'I').length;
		const updateCnt = changedButtons.filter(btn => btn.ROW_STATE === 'U').length;
		const deleteCnt = changedButtons.filter(btn => btn.ROW_STATE === 'D').length;
	
		const r = await GMessageBox.Show('MGQ00002', 'YesNo', insertCnt, updateCnt, deleteCnt);
		if (r === 'no') {
			return;
		}
	
		try {
			const saveData = changedButtons.map(btn => ({
				BUTN_ID: btn.BUTN_ID || null,
				BUTN_DSC: btn.BUTN_DSC || null,
				BUTN_CLOR: btn.BUTN_CLOR || null,
				BUTN_VRNT_CD: btn.BUTN_VRNT_CD || null,
				ROW_STATE: btn.ROW_STATE
			}));
	
			const response = await http.post('/admin/savebuttonlist', saveData, {
				shape: 'json',
				showSpinner: true
			});
	
			await GMessageBox.Show('MGI00352', 'Ok');
			handleCloseButtonListPopup();
			await loadMenuData();
		} catch (error) {
			console.error('버튼 저장 실패:', error);
			await GMessageBox.Show('저장 중 오류가 발생했습니다', 'Ok');
		}
	};

	// ==============================================================  
	//                        이벤트 정의  
	// ==============================================================  

	/**
	 * 프로그램 선택 이벤트
	 */
	const handleProgramSelect = (params) => {
		const program = params.row;
		setSelectedProgram(program);

		if (program?.PROGM_ID) {
			const filtered = assignedButtonList.filter(btn => btn.PROGM_ID === program.PROGM_ID);
			setFilteredAssignedButtonList(filtered);
			setOriginalFilteredAssignedButtonList(filtered);
		} else {
			setFilteredAssignedButtonList([]);
			setOriginalFilteredAssignedButtonList([]);
		}
	};

	/**
	 * 프로그램 행 하이라이트
	 */
	const highlightProgramRow = (programId) => {
		if (!programGridRef.current) return;
		
		const gridElement = programGridRef.current.querySelector('.MuiDataGrid-root');
		if (gridElement) {
			const rowIndex = programListData.findIndex(p => p.PROGM_ID === programId);
			if (rowIndex !== -1) {
				const virtualScroller = gridElement.querySelector('.MuiDataGrid-virtualScroller');
				if (virtualScroller) {
					const rowHeight = 25;
					const scrollTop = rowIndex * rowHeight;
					virtualScroller.scrollTop = scrollTop;
				}
			}
		}
		
		setTimeout(() => {
			const allRows = programGridRef.current.querySelectorAll('.MuiDataGrid-row');
			allRows.forEach(row => {
				row.style.backgroundColor = '';
			});
			
			const targetRow = Array.from(allRows).find(row => {
				const cells = row.querySelectorAll('.MuiDataGrid-cell');
				return Array.from(cells).some(cell => 
					cell.textContent.trim() === programId
				);
			});
			
			if (targetRow) {
				targetRow.style.backgroundColor = '#e3f2fd';
			}
		}, 150);
	};

	/**
	 * 메뉴 선택 이벤트
	 */
	const handleMenuSelect = (menu) => {
		setSelectedMenu(menu);

		setDetailData({
			MENU_ID: menu.MENU_ID || '',
			MENU_ID_NUM: menu.MENU_ID_NUM || '',
			MENU_NM: menu.MENU_NM || '',
			MENU_ENG_NM: menu.MENU_ENG_NM || '',
			HELP_URL: menu.HELP_URL || '',
			MENU_ORD: menu.MENU_ORD || '',
			SCREN_NO: menu.SCREN_NO || '',
			PROGM_ID: menu.PROGM_ID || '',
			PROGM_NM: menu.PROGM_NM || '',
			MENU_IMG_ID: menu.MENU_IMG_ID || '',
			BZ_UPCLSS_ID: menu.BZ_UPCLSS_ID || '',
			SCREN_EXECUTE_TP_CD: menu.SCREN_EXECUTE_TP_CD || 'E',
			SCREN_PARM_CONTN: menu.SCREN_PARM_CONTN || '',
			USE_YN: menu.USE_YN || 'Y',
			SYS_TP_CD: menu.SYS_TP_CD || 'STO',
		});

		if (menu.PROGM_ID) {
			const matchedProgram = programListData.find(p => p.PROGM_ID === menu.PROGM_ID);
			if (matchedProgram) {
				handleProgramSelect({ row: matchedProgram });
				setTimeout(() => {
					highlightProgramRow(matchedProgram.PROGM_ID);
				}, 100);
			} else {
				setFilteredAssignedButtonList([]);
				setOriginalFilteredAssignedButtonList([]);
			}
		} else {
			setFilteredAssignedButtonList([]);
			setOriginalFilteredAssignedButtonList([]);
		}

		setHasChanges(false);
	};

	/**
	 * Detail 영역 필드 값 변경 이벤트
	 */
	const handleFieldChange = (field, value) => {
		setDetailData((prev) => ({ ...prev, [field]: value }));
		setHasChanges(true);
	};

	/**
	 * 프로그램 검색 버튼 클릭 이벤트 핸들러
	 */
	const handleProgramSearch = () => {
		setOpenProgramPopup(true);
	};

	/**
	 * 프로그램 검색 팝업 확인(OK) 버튼 클릭 이벤트 핸들러
	 */
	const handleProgramConfirm = (selectedProgram) => {
		setDetailData((prev) => ({
			...prev,
			PROGM_ID: selectedProgram.PROGM_ID,
			PROGM_NM: selectedProgram.PROGM_NM
		}));
		
		setHasChanges(true);
	};

	/**
	 * 이미지 검색 버튼 클릭
	 */
	const handleImageSearch = () => {
		setOpenIconSelectModal(true);
	};

	/**
	 * 아이콘 선택 확인
	 */
	const handleIconSelect = (iconName) => {
		setDetailData(prev => ({
			...prev,
			MENU_IMG_ID: iconName
		}));
		setHasChanges(true);
	};

	/**
	 * 메뉴 되돌리기
	 */
	const handleMenuRevert = () => {
		setMenuTreeData([...originalMenuTreeData]);
		
		if (selectedMenu) {
			if (selectedMenu.ROW_STATE === 'I') {
				setSelectedMenu(null);
				setDetailData({
					MENU_ID: '',
					MENU_ID_NUM: '',
					MENU_NM: '',
					MENU_ENG_NM: '',
					HELP_URL: '',
					MENU_ORD: '',
					SCREN_NO: '',
					PROGM_ID: '',
					PROGM_NM: '',
					MENU_IMG_ID: '',
					BZ_UPCLSS_ID: '',
					SCREN_EXECUTE_TP_CD: 'E',
					SCREN_PARM_CONTN: '',
					USE_YN: '',
					SYS_TP_CD: 'STO',
				});
			} else {
				const originalMenu = originalMenuTreeData.find(m => m.MENU_ID === selectedMenu.MENU_ID);
				if (originalMenu) {
					setSelectedMenu(originalMenu);
					setDetailData({
						MENU_ID: originalMenu.MENU_ID || '',
						MENU_ID_NUM: originalMenu.MENU_ID_NUM || '',
						MENU_NM: originalMenu.MENU_NM || '',
						MENU_ENG_NM: originalMenu.MENU_ENG_NM || '',
						HELP_URL: originalMenu.HELP_URL || '',
						MENU_ORD: originalMenu.MENU_ORD !== undefined && originalMenu.MENU_ORD !== null ? originalMenu.MENU_ORD : '',
						SCREN_NO: originalMenu.SCREN_NO || '',
						PROGM_ID: originalMenu.PROGM_ID || '',
						PROGM_NM: originalMenu.PROGM_NM || '',
						MENU_IMG_ID: originalMenu.MENU_IMG_ID || '',
						BZ_UPCLSS_ID: originalMenu.BZ_UPCLSS_ID || '',
						SCREN_EXECUTE_TP_CD: originalMenu.SCREN_EXECUTE_TP_CD || 'E',
						SCREN_PARM_CONTN: originalMenu.SCREN_PARM_CONTN || '',
						USE_YN: originalMenu.USE_YN || '',
						SYS_TP_CD: originalMenu.SYS_TP_CD || 'STO',
					});
				}
			}
		}
		setHasChanges(false);
	};

	/**
	 * 프로그램 목록 되돌리기
	 */
	const handleProgramRevert = () => {
		setProgramListData([...originalProgramListData]);
	};

	/**
	 * 권한 버튼 목록 되돌리기
	 */
	const handleButtonRevert = () => {
		setFilteredAssignedButtonList([...originalFilteredAssignedButtonList]);
	};

	/**
	 * 프로그램 추가 버튼 클릭
	 */
	const handleProgramAdd = () => {
		const newProgram = {
			PROGM_ID: '',
			PROGM_NM: '',
			SYS_TP_CD: 'STO',
			CLSS_NM: '',
			OBJ_FILE_NM: '',
			ROW_STATE: 'I'
		};
		setProgramListData(prev => [newProgram, ...prev]);
	};

	/**
	 * Authority 버튼 클릭 (버튼 마스터 관리 모드)
	 */
	const handleAuthorityClick = async () => {
		setButtonPopupMode('AuthorityButton');

		try {
			const response = await http.post('/admin/getBtnAuth', { BUTN_ID: '' });
			setButtonMasterList(response || []);
			setOriginalButtonMasterList(response || []);
		} catch (error) {
			console.error('버튼 목록 조회 실패:', error);
			setButtonMasterList([]);
			setOriginalButtonMasterList([]);
		}

		setOpenButtonListPopup(true);
	};

	/**
	 * 프로그램 검색 팝업 닫기 이벤트 핸들러
	 */
	const handleClosePopup = () => {
		setOpenProgramPopup(false);
	};

	/**
	 * Authority 셀 클릭 (버튼 선택 모드)
	 */
	const handleAuthorityCellClick = async (params) => {
		setSelectedRowForEdit(params.row);
		setButtonPopupMode('AuthorityCell');

		try {
			const response = await http.post('/admin/getBtnAuth', { BUTN_ID: '' });
			setButtonMasterList(response || []);
		} catch (error) {
			console.error('버튼 목록 조회 실패:', error);
			setButtonMasterList([]);
		}

		setOpenButtonListPopup(true);
	};

	/**
	 * 버튼 선택 팝업 확인
	 */
	const handleButtonListConfirm = async (selectedButton) => {
		const targetIndex = filteredAssignedButtonList.findIndex(btn =>
			(btn.BUTN_ID === selectedRowForEdit.BUTN_ID && btn.BUTN_ID) ||
			(btn.__rid && btn.__rid === selectedRowForEdit.__rid)
		);

		if (targetIndex === -1) {
			console.error('수정 대상 행을 찾을 수 없습니다');
			return;
		}

		const isDuplicate = filteredAssignedButtonList.some(
			(btn, idx) => idx !== targetIndex && btn.BUTN_ID === selectedButton.BUTN_ID
		);

		if (isDuplicate) {
			await GMessageBox.Show('MGI00111', 'Ok');
			return;
		}

		const newRowState = selectedRowForEdit.ROW_STATE === 'I' ? 'I' : 'U';

		const updated = filteredAssignedButtonList.map((btn, idx) =>
			idx === targetIndex
				? {
					...btn,
					BUTN_ID: selectedButton.BUTN_ID,
					BUTN_DSC: selectedButton.BUTN_DSC,
					BUTN_CLOR: selectedButton.BUTN_CLOR,
					BUTN_VRNT_CD: selectedButton.BUTN_VRNT_CD,
					PROGM_ID: selectedProgram?.PROGM_ID || btn.PROGM_ID,
					ROW_STATE: newRowState
				}
				: btn
		);

		setFilteredAssignedButtonList(updated);
		handleCloseButtonListPopup();
	};

	/**
	 * 버튼 팝업 닫기
	 */
	const handleCloseButtonListPopup = () => {
		setOpenButtonListPopup(false);
		setSelectedRowForEdit(null);
		setButtonPopupMode(null);
	};

	/**
	 * 버튼 팝업 셀 편집 시작
	 */
	const handleButtonCellEditStart = (params, event) => {
		if (params.field === 'BUTN_ID' && params.row.ROW_STATE !== 'I') {
			event.defaultMuiPrevented = true;
		}
	};

	/**
	 * 프로그램 그리드 셀 편집 시작
	 */
	const handleProgramCellEditStart = (params, event) => {
		if ((params.field === 'PROGM_ID' && params.row.ROW_STATE !== 'I') || (params.field === 'SYS_TP_CD' && params.row.ROW_STATE !== 'I')) {
			event.defaultMuiPrevented = true;
		}
	};

	/**
	 * 버튼 추가 버튼 클릭
	 */
	const handleButtonAdd = () => {
		const newButton = {
			BUTN_ID: '',
			BUTN_DSC: '',
			BUTN_CLOR: '#FFFFFF',
			BUTN_VRNT_CD: null,
			ROW_STATE: 'I'
		};
		setButtonMasterList(prev => [newButton, ...prev]);
	};

	/**
	 * 버튼 마스터 되돌리기
	 */
	const handleButtonMasterRevert = () => {	
		setButtonMasterList([...originalButtonMasterList]);
		setButtonPopupKey(prev => prev + 1);
	};

	/**
	 * 최상위 메뉴 ID 찾기 (재귀)
	 */
	const findRootMenuId = (menuId, currentTreeData = menuTreeData) => {
		if (!menuId) return null;
		const menu = currentTreeData.find(m => m.MENU_ID === menuId);
		if (!menu) return null;
		if (!menu.UP_MENU_ID) return menu.MENU_ID;
		return findRootMenuId(menu.UP_MENU_ID, currentTreeData);
	};

	/**
	 * 다음 메뉴 순서 번호 계산
	 */
	const getNextOrder = (parentMenuId) => {
		const siblings = menuTreeData.filter(m => m.UP_MENU_ID === parentMenuId);
		if (siblings.length === 0) return 1;
		const maxOrder = siblings.reduce((max, menu) => {
			const order = parseInt(menu.MENU_ORD) || 0;
			return Math.max(max, order);
		}, 0);
		return maxOrder + 1;
	};

	/**
	 * 새 메뉴 행 생성
	 */
	const createNewMenuRow = (parentMenu) => {
		const newMenuId = `GPCLMENU${String(nextMenuId).padStart(6, '0')}`;
		setNextMenuId(prev => prev + 1);
		
		let rootMenuId = newMenuId;
		if (parentMenu) {
			rootMenuId = parentMenu.BZ_UPCLSS_ID || parentMenu.MENU_ID;
		}
		
		const nextOrder = getNextOrder(parentMenu?.MENU_ID || null);
		
		return {
			MENU_ID: newMenuId,
			MENU_NM: null,
			UP_MENU_ID: parentMenu?.MENU_ID || null,
			BZ_UPCLSS_ID: rootMenuId,
			MENU_ORD: nextOrder,
			SCREN_EXECUTE_TP_CD: 'E',
			USE_YN: 'Y',
			SYS_TP_CD: 'STO',
			ROW_STATE: 'I'
		};
	};

	/**
	 * 새 메뉴 ID 생성
	 */
	const generateNewMenuId = () => {
		const newMenuId = `GPCLMENU${String(nextMenuId).padStart(6, '0')}`;
		setNextMenuId(prev => prev + 1);
		return newMenuId;
	};

	// ==============================================================  
	//                        필드 정의  
	// ==============================================================  

	/**
	 * 색상 선택 셀 컴포넌트
	 */
	const ColorPickerCell = (params) => {
		const { id, field, value, api } = params;
		const [color, setColor] = useState(value || '#FFFFFF');

		useEffect(() => {
			if (value) {
				setColor(value);
			}
		}, [value]);

		const handleColorChange = (event) => {
			const newColor = event.target.value.toUpperCase();
			setColor(newColor);
			api.setEditCellValue({ id, field, value: newColor });
			api.stopCellEditMode({ id, field });
		};

		if (!value) {
			return (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', height: '100%', padding: '0 4px' }}>
					<input type="color" value={color} onChange={handleColorChange} style={{ width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
					<Box sx={{ flex: 1, fontSize: '11px', color: '#999', fontStyle: 'italic' }}>색상을 선택하세요</Box>
				</Box>
			);
		}

		return (
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', height: '100%', padding: '0 4px' }}>
				<input type="color" value={color} onChange={handleColorChange} style={{ width: '24px', height: '24px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
				<GTextField size="small" value={color} readOnly={true} inputProps={{ style: { fontSize: '11px', textTransform: 'uppercase', padding: '4px 6px' } }} sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: '24px', fontSize: '11px' }, '& .MuiOutlinedInput-input': { padding: '4px 6px' } }} />
			</Box>
		);
	};

	// ==============================================================  
	//                        그리드 컬럼 정의  
	// ==============================================================  

	/** 프로그램 목록 그리드 컬럼 */
	const programColumns = [
		{ headerName: 'System', headerAlign: 'center', field: 'SYS_TP_CD', width: 100, align: 'center', editable: true },
		{ headerName: 'Program ID', headerAlign: 'center', field: 'PROGM_ID', width: 150, align: 'left', editable: true },
		{ headerName: 'Program Name', headerAlign: 'center', field: 'PROGM_NM', flex: 1, align: 'left', editable: true },
		{ headerName: 'Url', headerAlign: 'center', field: 'CLSS_NM', width: 250, align: 'left', editable: true },
	];

	/** 권한 버튼 목록 그리드 컬럼 */
	const buttonColumns = [
		{
			headerName: 'Authority',
			headerAlign: 'center',
			field: 'BUTN_ID',
			width: 150,
			align: 'center',
			renderCell: (params) => (
				<Box onClick={() => handleAuthorityCellClick(params)} sx={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { textDecoration: 'underline', color: 'primary.main', backgroundColor: '#f5f5f5' } }}>
					{params.value || ''}
				</Box>
			)
		},
		{ headerName: '버튼 설명', headerAlign: 'center', field: 'BUTN_DSC', flex: 1, align: 'left' },
	];

	/** 프로그램 검색 팝업 그리드 컬럼 */
	const popupProgramColumns = [
		{ headerName: '프로그램ID', field: 'PROGM_ID', width: 180, headerAlign: 'center', align: 'left' },
		{ headerName: '프로그램명', field: 'PROGM_NM', width: 150, headerAlign: 'center', align: 'left' },
		{ headerName: 'Url', field: 'OBJ_FILE_NM', width: 200, headerAlign: 'center', align: 'left' },
		{ headerName: 'ClassName', field: 'CLSS_NM', flex: 1, headerAlign: 'center', align: 'left' },
	];

	/** 버튼 마스터 팝업 그리드 컬럼 */
	const buttonListColumns = React.useMemo(() => [
		{ headerName: '버튼명', field: 'BUTN_ID', width: 150, headerAlign: 'center', align: 'left', editable: buttonPopupMode === 'AuthorityButton' },
		{ headerName: '설명', field: 'BUTN_DSC', flex: 1, headerAlign: 'center', align: 'left', editable: buttonPopupMode === 'AuthorityButton' },
		{ 
			headerName: '버튼컬러', 
			field: 'BUTN_CLOR', 
			width: 150,
			headerAlign: 'center',
			align: 'left',
			editable: buttonPopupMode === 'AuthorityButton',
			renderCell: (params) => {
				if (!params.value) return null;
				return (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', height: '100%' }}>
						<Box sx={{ width: 20, height: 20, backgroundColor: params.value, border: '1px solid #ddd', borderRadius: '4px' }} />
						<span>{params.value}</span>
					</Box>
				);
			},
			renderEditCell: (params) => <ColorPickerCell {...params} />
		},
		{ 
			headerName: '버튼스타일', 
			field: 'BUTN_VRNT_CD', 
			width: 150,
			headerAlign: 'center',
			align: 'left',
			editable: buttonPopupMode === 'AuthorityButton',
			type: 'singleSelect',
			valueOptions: lstButtonVariant.length > 0 ? lstButtonVariant.map(item => ({ value: item.CD_VAL, label: item.CD_VAL_NM })) : []
		}
	], [lstButtonVariant, buttonPopupMode]);

	// ==============================================================  
	//                          화면 구성  
	// ==============================================================  

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<GPageContainer>
				{/* 상단: 메뉴관리 영역 */}
				<GContentBox flex={false} marginBottom="8px">
					<Stack direction="row" spacing={2} height={345}>
						{/* 왼쪽: 메뉴 트리 그리드 */}
						<Box sx={{ flex: 4, overflow: 'hidden' }}>
							<GSimpleTreeGrid
								rows={menuTreeData}
								onRowsChange={setMenuTreeData}
								idField="MENU_ID"
								parentIdField="UP_MENU_ID"
								labelField="MENU_NM"
								columnLabel="Menu"
								createNewRow={createNewMenuRow}
								generateNewId={generateNewMenuId}
								title="메뉴관리"
								selectedItem={selectedMenu}
								onSelectedItemChange={handleMenuSelect}
								onHasChanges={setHasChanges}
								Buttons={{ add: true, delete: true, revert: true, excel: false }}
								onRevertClick={handleMenuRevert}
								showIconMode={false}
								treeIndent={24} 
								sx={{ height: '100%' }}
							/>
						</Box>

						{/* 오른쪽: 메뉴 상세 정보 패널  */}
						<Stack flex={6}>
							<GDetailTitle title="Detail" />

							<Box sx={{ flex: 1, overflow: 'auto' }}>
								<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="Menu ID">
											<GTextField value={detailData.MENU_ID} readOnly={true} />
										</GLayoutItem>
										<GLayoutItem label="Menu ID (직접입력)">
											<GTextField 
												value={detailData.MENU_ID_NUM} 
												fieldName="MENU_ID_NUM"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="메뉴명">
											<GTextField 
												value={detailData.MENU_NM} 
												fieldName="MENU_NM"
												onFieldChange={handleFieldChange}
												required={true}
											/>
										</GLayoutItem>
										<GLayoutItem label="영문메뉴명">
											<GTextField 
												value={detailData.MENU_ENG_NM} 
												fieldName="MENU_ENG_NM"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="도움말">
											<GTextField 
												value={detailData.HELP_URL} 
												fieldName="HELP_URL"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
										<GLayoutItem label="Order">
											<GTextField 
												value={detailData.MENU_ORD} 
												fieldName="MENU_ORD"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="Screen Number">
											<GTextField 
												value={detailData.SCREN_NO} 
												fieldName="SCREN_NO"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
										<GLayoutItem label="연결프로그램">
											<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
												<GTextField 
													value={detailData.PROGM_NM} 
													fieldName="PROGM_NM"
													onFieldChange={handleFieldChange}
													sx={{ flex: 1 }} 
												/>
												<GButton label="Search" auth="Search" onClick={handleProgramSearch} iconOnly />
											</Box>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="Menu Image">
											<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
												{/* 아이콘이 있을 때만 미리보기 박스 표시 */}
												{detailData.MENU_IMG_ID && (
													<Box
														sx={{
															width: 40,
															height: 40,
															border: '1px solid #ddd',
															borderRadius: 1,
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															backgroundColor: '#fff',
														}}
													>
														<GMenuIcon iconName={detailData.MENU_IMG_ID} size={24} />
													</Box>
												)}
												
												<GTextField 
													value={detailData.MENU_IMG_ID} 
													fieldName="MENU_IMG_ID"
													onFieldChange={handleFieldChange}
													sx={{ flex: 1 }} 
													readOnly={true}
												/>
												<GButton label="Image" auth="Image" onClick={handleImageSearch} iconOnly />
											</Box>
										</GLayoutItem>
										<GLayoutItem label="최상위 메뉴">
											<GTextField value={detailData.BZ_UPCLSS_ID} readOnly={true} />
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutGroup orientation="horizontal">
										<GLayoutItem label="Open 유형">
											<GSelectBox 
												items={lstOpenType} 
												valueKey="CD_VAL" 
												labelKey="CD_VAL_NM" 
												value={detailData.SCREN_EXECUTE_TP_CD}
												fieldName="SCREN_EXECUTE_TP_CD"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
										<GLayoutItem label="사용여부">
											<GSelectBox 
												items={lstUseYn} 
												valueKey="CD_VAL" 
												labelKey="CD_VAL_NM" 
												value={detailData.USE_YN}
												fieldName="USE_YN"
												onFieldChange={handleFieldChange}
											/>
										</GLayoutItem>
									</GLayoutGroup>

									<GLayoutItem label="화면전달정보">
										<GTextField 
											value={detailData.SCREN_PARM_CONTN} 
											fieldName="SCREN_PARM_CONTN"
											onFieldChange={handleFieldChange}
										/>
									</GLayoutItem>
								</GLayoutGroup>
							</Box>

							<GButtonGroup>
								<GButton auth="Save" label="Save" onClick={handleSave} />
							</GButtonGroup>
						</Stack>
					</Stack>
				</GContentBox>

				{/* 하단: 프로그램 & 버튼 영역 */}
				<GContentBox flex={true}>
					<Box sx={{ 
						flex: 1, 
						minHeight: 0, 
						display: 'flex', 
						gap: 2,
						overflow: 'hidden'
					}}>
						{/* 왼쪽: 프로그램 그리드 */}
						<Box sx={{ 
							flex: 5, 
							minHeight: 0, 
							display: 'flex', 
							flexDirection: 'column',
							overflow: 'hidden'
						}} ref={programGridRef}>
							<GDataGrid
								title={`Program List Total (${programListData.length})`}
								showTitle={true}
								rows={programListData}
								columns={programColumns}
								onRowsChange={setProgramListData}
								Buttons={{ add: true, delete: true, revert: true, excel: false }}
								onRevertClick={handleProgramRevert}
								onAddClick={handleProgramAdd}
								onCellEditStart={handleProgramCellEditStart}
								columnHeaderHeight={30}
								rowHeight={25}
								checkboxSelection
								disableRowSelectionOnClick
								pagination={false}
								hideFooter
								onRowClick={handleProgramSelect}
								enableRowState={true}
								localeText={{
									noRowsLabel: '',
								}}
							/>
						</Box>

						{/* 오른쪽: 권한 버튼 패널 */}
						<Box sx={{ 
							flex: 5, 
							minHeight: 0, 
							display: 'flex', 
							flexDirection: 'column',
							overflow: 'hidden',
							position: 'relative'
						}}>
							<GDataGrid
								title="Program Authority Button"
								showTitle={true}
								rows={filteredAssignedButtonList}
								columns={buttonColumns}
								onRowsChange={setFilteredAssignedButtonList}
								Buttons={{ add: true, delete: true, revert: true, excel: false }}
								onRevertClick={handleButtonRevert}
								columnHeaderHeight={30}
								rowHeight={25}
								checkboxSelection
								disableRowSelectionOnClick
								pagination={false}
								hideFooter
								enableRowState={true}
								localeText={{
									noRowsLabel: '',
								}}
							/>
							
							{/* Authority 버튼 - Absolute Positioning */}
							<Box sx={{ position: 'absolute', top: 0, right: 120, zIndex: 10 }}>
								<GButton label="Authority" auth="Authority" onClick={handleAuthorityClick} />
							</Box>

							<GButtonGroup>
								<GButton auth="Save" label="Save" onClick={handleProgramSave} />
							</GButtonGroup>
						</Box>
					</Box>
				</GContentBox>

			{/* 프로그램 검색 팝업 */}
			<GPopup
				open={openProgramPopup}
				onClose={handleClosePopup}
				onConfirm={handleProgramConfirm}
				title="Program List"
				headerTitle="프로그램 목록"
				columns={popupProgramColumns}
				bindingColumn="PROGM_ID"
				data={programListData}
				showTotalCount={true}
				Buttons={{ add: false, delete: false, revert: false, excel: false }}
				showSaveButton={false}
				showOkButton={true}
				showCancelButton={true}
				readOnly={true}
				width="900px"
				height="600px"
			/>

			{/* 버튼 목록 선택 팝업 */}
			<GPopup
				key={buttonPopupKey}
				open={openButtonListPopup}
				onClose={handleCloseButtonListPopup}
				onConfirm={buttonPopupMode === 'AuthorityCell' ? handleButtonListConfirm : undefined}
				onSave={buttonPopupMode === 'AuthorityButton' ? handleButtonListSave : undefined}
				onRevertClick={buttonPopupMode === 'AuthorityButton' ? handleButtonMasterRevert : undefined}
				title="버튼관리"
				headerTitle="Button List"
				columns={buttonListColumns}
				bindingColumn="BUTN_ID"
				data={buttonMasterList}
				showTotalCount={true}
				Buttons={{ add: buttonPopupMode === 'AuthorityButton', delete: buttonPopupMode === 'AuthorityButton', revert: buttonPopupMode === 'AuthorityButton', excel: false }}
				showSaveButton={buttonPopupMode === 'AuthorityButton'}
				showOkButton={buttonPopupMode === 'AuthorityCell'}
				showCancelButton={true}
				readOnly={buttonPopupMode === 'AuthorityCell'}
				checkboxSelection={buttonPopupMode === 'AuthorityButton'}
				hideRowStatus={buttonPopupMode === 'AuthorityCell'}
				onCellEditStart={buttonPopupMode === 'AuthorityButton' ? handleButtonCellEditStart : undefined}
				onAddClick={buttonPopupMode === 'AuthorityButton' ? handleButtonAdd : undefined}
				width="800px"
				height="600px"					
			/>

			{/* 아이콘 선택 팝업 */}
			<GMenuIconSelectPopup
				open={openIconSelectModal}
				currentIconId={detailData.MENU_IMG_ID}
				onClose={() => setOpenIconSelectModal(false)}
				onConfirm={handleIconSelect}
				width="900px"
				height="700px"
			/>
		</GPageContainer>
		</LocalizationProvider>
	);
}