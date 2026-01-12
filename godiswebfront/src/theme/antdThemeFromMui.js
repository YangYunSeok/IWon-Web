// src/theme/antdThemeFromMui.js
import { theme as antdTheme } from 'antd';

// MUI theme + mode 기반으로 AntD ConfigProvider용 theme 객체 생성
export function createAntdThemeConfig(muiTheme, mode = 'light') {
  const algorithm =
    mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return {
    algorithm,
    token: {
      colorPrimary: muiTheme.palette.primary.main,
      colorBgBase: muiTheme.palette.background.default,
      colorBgContainer: muiTheme.palette.background.paper,
      colorTextBase: muiTheme.palette.text.primary,
      borderRadius: muiTheme.shape.borderRadius,
    },
    components: {
      Layout: {
        headerBg: muiTheme.palette.primary.main,
        headerColor: muiTheme.palette.primary.contrastText,
        bodyBg: muiTheme.palette.background.default,
      },
      Card: {
        colorBgContainer: muiTheme.palette.background.paper,
      },

      // 필요하면 Button, Menu 등도 여기서 통일
    },
  };
}
