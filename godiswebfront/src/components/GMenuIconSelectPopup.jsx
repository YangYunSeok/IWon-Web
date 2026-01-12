import React, { useState, useEffect, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	IconButton,
	Box,
	Paper,
	Grid,
	Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import Draggable from 'react-draggable';
import * as MuiIcons from '@mui/icons-material';
import GButton from '@/components/GButton';
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

const GMenuIconSelectPopup = ({
	open,
	onClose,
	onConfirm,
	currentIconId,
	width = '900px',
	height = '700px',
}) => {
	// ==============================================================  
	//                        변수 정의  
	// ==============================================================  

	const theme = useTheme();

	const [selectedIcon, setSelectedIcon] = useState(currentIconId || '');
	const [searchValue, setSearchValue] = useState('');
	const [filteredIcons, setFilteredIcons] = useState([]);
	const [contentHeight, setContentHeight] = useState(500);
	
	const searchHeaderRef = useRef(null);
	const contentRef = useRef(null);

	// MUI Icons를 배열로 변환 (기본 아이콘만)
	const iconList = Object.keys(MuiIcons).filter(
		(key) => key !== 'default' && 
				!key.endsWith('Outlined') && 
				!key.endsWith('Rounded') && 
				!key.endsWith('TwoTone') && 
				!key.endsWith('Sharp')
	);

	// ==============================================================  
	//                        데이터 조회 처리  
	// ==============================================================  

	useEffect(() => {
		if (open) {
			setFilteredIcons(iconList);
			setSelectedIcon(currentIconId || '');
		} else {
			setFilteredIcons([]);
			setSearchValue('');
			setSelectedIcon('');
		}
	}, [open, currentIconId]);

	// Content 높이 계산
	useEffect(() => {
		if (open && contentRef.current && searchHeaderRef.current) {
			const contentAreaHeight = contentRef.current.clientHeight;
			const searchHeaderHeight = searchHeaderRef.current.clientHeight;
			const calculatedHeight = contentAreaHeight - searchHeaderHeight - 16;
			setContentHeight(calculatedHeight);
		}
	}, [open]);

	// ==============================================================  
	//                        이벤트 정의  
	// ==============================================================  

	const handleSearch = (e) => {
		const value = e.target.value;
		setSearchValue(value);

		if (!value.trim()) {
			setFilteredIcons(iconList);
			return;
		}

		const filtered = iconList.filter((iconName) =>
			iconName.toLowerCase().includes(value.toLowerCase())
		);

		setFilteredIcons(filtered);
	};

	const handleIconClick = (iconName) => {
		setSelectedIcon(iconName);
	};

	const handleIconDoubleClick = (iconName) => {
		if (onConfirm) {
			onConfirm(iconName);
			onClose();
		}
	};

	const handleOk = () => {
		if (!selectedIcon) {
			return;
		}

		if (onConfirm) {
			onConfirm(selectedIcon);
			onClose();
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
				<Box sx={{ fontSize: '18px', fontWeight: 600 }}>Menu Icon</Box>
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
										placeholder="Search icons..."
									/>
								),
							},
							{}, // 빈 필드 (여백)
						]}
						buttons={[]}
					/>
				</Box>

				{/* 아이콘 그리드 영역 */}
				<Box sx={{ 
					height: contentHeight, 
					overflow: 'auto',
					border: '1px solid #e0e0e0',
					borderRadius: '4px',
					padding: '8px',
					backgroundColor: '#fff'
				}}>
					<Grid container spacing={1}>
						{filteredIcons.map((iconName) => {
							const IconComponent = MuiIcons[iconName];
							const isSelected = selectedIcon === iconName;

							return (
								<Grid item xs={2} key={iconName}>
									<IconButton
										onClick={() => handleIconClick(iconName)}
										onDoubleClick={() => handleIconDoubleClick(iconName)}
										sx={{
											width: '100%',
											height: 80,
											flexDirection: 'column',
											gap: 0.5,
											border: isSelected ? '2px solid #4472C4' : '1px solid #e0e0e0',
											borderRadius: 1,
											backgroundColor: isSelected ? '#f0f4ff' : '#fff',
											'&:hover': {
												backgroundColor: isSelected ? '#e3ebff' : '#f5f5f5',
											},
										}}
									>
										{React.createElement(IconComponent, {
											sx: { fontSize: 28, color: isSelected ? '#4472C4' : '#666' },
										})}
										<Typography
											variant="caption"
											sx={{
												fontSize: 9,
												textAlign: 'center',
												wordBreak: 'break-word',
												color: isSelected ? '#4472C4' : '#666',
												maxWidth: '100%',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
											}}
										>
											{iconName}
										</Typography>
									</IconButton>
								</Grid>
							);
						})}
					</Grid>

					{filteredIcons.length === 0 && (
						<Box sx={{ textAlign: 'center', py: 4 }}>
							<Typography color="text.secondary">No icons found</Typography>
						</Box>
					)}
				</Box>
			</DialogContent>

			{/* Dialog Actions (버튼 영역) */}
			<DialogActions sx={{
				padding: '12px 16px',
				borderTop: '1px solid #e0e0e0'
			}}>
				<GButtonGroup>
					<GButton auth="Ok" label="Ok" onClick={handleOk} disabled={!selectedIcon} />
					<GButton auth="Cancel" label="Cancel" onClick={onClose} />
				</GButtonGroup>
			</DialogActions>
		</Dialog>
	);
};

export default GMenuIconSelectPopup;