import React, { useState, useEffect, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	IconButton,
	Box,
	Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import Draggable from 'react-draggable';
import GDataGrid from '@/components/GDataGrid';
import GButton from '@/components/GButton';
import GMessageBox from '@/components/GMessageBox';
import GSearchHeader from '@/components/GSearchHeader.jsx';
import GButtonGroup from '@/components/GButtonGroup';

// Draggable Paper 컴포넌트
function PaperComponent(props) {
	return (
		<Draggable
			handle="#draggable-dialog-title"
			cancel={'[class*="MuiDialogContent-root"]'}
		>
			<Paper {...props} />
		</Draggable>
	);
}

const GPopup = ({
	open,
	onClose,
	onConfirm,
	title = '팝업',
	headerTitle = '목록',
	columns = [],
	data = [],
	Buttons = { add: false, delete: false, revert: false, excel: false },
	showSaveButton = false,
	showOkButton = false,
	showCancelButton = true,
	onSave,
	width = '800px',
	height = '600px',
	onAddClick,
	onDeleteClick,
	onRevertClick,
	readOnly = false,
	checkboxSelection = false,
	hideRowStatus = false,
	onCellEditStart,
}) => {
	// ==============================================================  
	//                        변수 정의  
	// ==============================================================  

	const theme = useTheme();

	const [filteredRows, setFilteredRows] = useState([]);
	const [searchValue, setSearchValue] = useState('');
	const [selectedRow, setSelectedRow] = useState(null);
	const [gridHeight, setGridHeight] = useState(400);
	
	const searchHeaderRef = useRef(null);
	const contentRef = useRef(null);

	// ==============================================================  
	//                        데이터 조회 처리  
	// ==============================================================  

	useEffect(() => {
		if (open && Array.isArray(data)) {
			setFilteredRows(data);
		} else if (!open) {
			setFilteredRows([]);
			setSearchValue('');
			setSelectedRow(null);
		}
	}, [open, data]);

	// Grid 높이 계산
	useEffect(() => {
		if (open && contentRef.current && searchHeaderRef.current) {
			const contentHeight = contentRef.current.clientHeight;
			const searchHeaderHeight = searchHeaderRef.current.clientHeight;
			const calculatedHeight = contentHeight - searchHeaderHeight - 16;
			setGridHeight(calculatedHeight);
		}
	}, [open]);

	// ==============================================================  
	//                        이벤트 정의  
	// ==============================================================  

	const handleSearch = (e) => {
		const value = e.target.value;
		setSearchValue(value);

		if (!value.trim()) {
			setFilteredRows(data);
			return;
		}

		const filtered = data.filter(row => {
			return Object.values(row).some(val =>
				String(val).toLowerCase().includes(value.toLowerCase())
			);
		});

		setFilteredRows(filtered);
	};

	const handleRowClick = (params) => {
		setSelectedRow(params.row);
	};

	const handleRowDoubleClick = (params) => {
		if (onConfirm) {
			onConfirm(params.row);
			onClose();
		}
	};

	const handleOk = async () => {
		if (!selectedRow) {
			await GMessageBox.Show('MGI01122', 'Ok', '프로그램목록');
			return;
		}

		if (onConfirm) {
			onConfirm(selectedRow);
			onClose();
		}
	};

	const handleSave = async () => {
		if (onSave) {
			await onSave(filteredRows);
		}
	};

	// ==============================================================  
	//                          화면 구성  
	// ==============================================================  

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth={false}
			PaperComponent={PaperComponent}
			aria-labelledby="draggable-dialog-title"
			PaperProps={{
				sx: {
					width: width,
					height: height,
					maxWidth: '95vw',
					maxHeight: '95vh'
				}
			}}
		>
			{/* Dialog Title */}
			<DialogTitle 
				id="draggable-dialog-title"
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					borderBottom: '1px solid #e0e0e0',
					padding: '12px 16px',
					cursor: 'move'
				}}
			>
				<Box sx={{ fontSize: '18px', fontWeight: 600 }}>{title}</Box>
				<IconButton onClick={onClose} size="small">
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			{/* Dialog Content */}
			<DialogContent 
				ref={contentRef}
				sx={{ 
					padding: '16px',
					overflow: 'hidden'
				}}
			>
				{/* 검색 영역 */}
				<Box ref={searchHeaderRef} sx={{ marginBottom: 2 }}>
					<GSearchHeader
						fields={[
							{
								header: 'Search',
								content: (
									<TextField
										fullWidth
										size="small"
										value={searchValue}
										onChange={handleSearch}
										placeholder="검색어 입력"
									/>
								),
							},
							{}, // 빈 필드 (여백)
						]}
						buttons={[]}
					/>
				</Box>

				{/* 그리드 영역 */}
				<Box>
					<GDataGrid
						title={`${headerTitle}`}
						showTitle={true}
						rows={filteredRows}
						columns={columns}
						Buttons={Buttons}
						height={gridHeight}
						onRowClick={handleRowClick}
						onRowDoubleClick={handleRowDoubleClick}
						onRowsChange={setFilteredRows}
						enableRowState={!hideRowStatus}
						checkboxSelection={checkboxSelection}
						columnHeaderHeight={30}
						rowHeight={25}
						hideFooter
						disableRowSelectionOnClick={readOnly}
						onAddClick={onAddClick}
						onDeleteClick={onDeleteClick}
						onRevertClick={onRevertClick}
						onCellEditStart={onCellEditStart}
					/>
				</Box>
			</DialogContent>

			{/* Dialog Actions (버튼 영역) */}
			<DialogActions sx={{
				padding: '12px 16px',
				borderTop: '1px solid #e0e0e0'
			}}>
				<GButtonGroup>
					{showSaveButton && (
						<GButton auth="Save" label="Save" onClick={handleSave} />
					)}
					{showOkButton && (
						<GButton auth="Ok" label="Ok" onClick={handleOk} />
					)}
					{showCancelButton && (
						<GButton auth="Cancel" label="Cancel" onClick={onClose} />
					)}
				</GButtonGroup>
			</DialogActions>
		</Dialog>
	);
};

export default GPopup;