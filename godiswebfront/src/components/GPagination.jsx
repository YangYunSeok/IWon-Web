// PaginationStyles.js

// Pagination 중앙 정렬 스타일
export const paginationCenterSx = {
  '& .MuiDataGrid-footerContainer': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '36px !important',
    height: '36px !important',
    overflow: 'hidden',
  },
  '& .MuiTablePagination-root': {
    display: 'flex',
    justifyContent: 'center',
    overflow: 'visible',
  },
  '& .MuiTablePagination-toolbar': {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '36px !important',
    height: '36px !important',
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
  },
  '& .MuiTablePagination-spacer': {
    display: 'none',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    margin: 0,
    lineHeight: '36px !important',
  },
  '& .MuiTablePagination-select': {
    lineHeight: '36px !important',
  },
  '& .MuiTablePagination-actions': {
    marginLeft: 0,
  },
};

// Pagination 초기 설정 (페이지 크기: 100)
export const paginationInitialState = {
  pagination: { paginationModel: { pageSize: 100 } }
};