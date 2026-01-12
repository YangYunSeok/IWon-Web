import React, { isValidElement, cloneElement } from 'react';
import { 
    Box,
    Typography,
    Button,
    useTheme} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';

export default function GSearchHeader({
    fields = [],            // [{ label: '이메일', name: 'email', value, onChange }, ...]
    buttons = [],          // [<Button>...</Button>, ...]
    onInitialize = () => {}, // 초기화 버튼 클릭 핸들러
    onSearch = () => {},     // 조회 버튼 클릭 핸들러
    initAuth,
    searchAuth,
}) {
  const theme = useTheme();
  const CONTROL_HEIGHT = 25;
  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        gap: 2,
        p: 1,
        mb: 1,
      }}
    >
        {/* 조회 조건 필드들 */}
        <Box sx={{flex: '0 0 80%', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {fields.map((field, idx) => {
            if (!field.header) {
                return (
                    <Box
                        key={idx}
                        sx={{
                            flex: '1 1 20%',
                            minWidth: 200,
                            minHeight: CONTROL_HEIGHT
                        }}
                    />
                );
            }
            return (
                <Box
                    key={idx}
                    sx={{ display: 'flex', alignItems: 'center', flex: '1 1 20%', minWidth: 200, fontSize: 14, fontWeight: 400, height: CONTROL_HEIGHT }}
                >
                    <Typography
                    sx={{ width: '30%', alignItems: 'center', textAlign: 'right', pr: 1, whiteSpace: 'nowrap', }}>
                    {field.header}
                    </Typography>

                    <Box sx={{ flex: 1, 
                      ml: 1, 
                      width: '100%', 
                      backgroundColor: field.content?.type?.displayName === 'RadioGroup' 
                        ? (theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.background.default)
                        : theme.palette.background.paper,
                      height: CONTROL_HEIGHT,
                      display: 'flex',
                      alignItems: 'center',
                      '& .MuiInputBase-root, & .MuiButton-root': {
                        height: '25px',
                        minHeight: '25px',
                      },
                      '& .MuiOutlinedInput-input, & .MuiSelect-select': {
                        padding: '0 8px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                      },
                      '& .MuiButton-root': {
                        padding: '0 12px',
                        lineHeight: '1',
                      },
                      '& .MuiFormControlLabel-root': {
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        height: 'auto', // 전체 박스 안에서 가운데 정렬만
                      },
                      '& .MuiRadio-root': {
                        padding: '2px 4px', // 좌우 살짝만 여백
                      },
                      '& .MuiFormControlLabel-label': {
                        fontSize: '14px',
                        lineHeight: 1,
                      },
                     }}>
                      {field.content}
                    </Box>
                </Box>
            );
            })}
        </Box>
        {/* 버튼 그룹 */}
        <Box
            sx={{
            display: 'flex',
            flex: '1 1 auto',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            gap: 1,
            minHeight: CONTROL_HEIGHT,
            }}
        >
          {/* {buttons.map((btn, idx) => {
              let icon = null;
              if (btn.auth === "Init") icon = <RestartAltIcon />;
              if (btn.auth === "Search") icon = <SearchIcon />;
              console.log('GSearchHeader button:', btn);
              return (
                <Button
                  key={btn.auth || idx}
                  variant={btn.auth === "Search" ? "contained" : "outlined"}
                  color={btn.auth === "Search" ? "primary" : "secondary"}
                  startIcon={icon}
                  onClick={btn.onClick}
                >
                  {btn.label}
                </Button>
              );
            })} */}

            {buttons.map((btn, idx) => (
              <Box key={idx}>{btn}</Box> // 그냥 JSX로 받은 버튼 렌더링
            ))}

            {/* <Button
                variant="outlined"
                color="secondary"
                startIcon={<RestartAltIcon />}
                onClick={onInitialize}
            >Initialize
            </Button>
            <Button
                variant="contained"
                color="primary"
                startIcon={<SearchIcon />}
                onClick={onSearch}
            >Search
            </Button> */}
        </Box>
    </Box>
  );
}