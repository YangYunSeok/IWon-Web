import { http } from '@/libs/TaskHttp';

// SSOT: docs/design/api/web-admin.md (webFinancialClosing.*)
// - GET /admin/financial-closing/journals
// - GET /admin/financial-closing/journals/{approvalId}
// - GET /admin/financial-closing/report
// - GET /admin/financial-closing/export

export const webFinancialClosing_listJournals = async (params = {}) => {
  return await http.get('/admin/financial-closing/journals', { params, showSpinner: true });
};

export const webFinancialClosing_getJournalDetail = async (approvalId) => {
  return await http.get(`/admin/financial-closing/journals/${encodeURIComponent(String(approvalId))}`, { showSpinner: true });
};

export const webFinancialClosing_getReport = async (params = {}) => {
  return await http.get('/admin/financial-closing/report', { params, showSpinner: true });
};

export const webFinancialClosing_export = async (params = {}) => {
  // NOTE: backend may support stream(download=1) vs URL. In this repo we follow downloadUrl pattern.
  return await http.get('/admin/financial-closing/export', { params, showSpinner: true });
};

const IWONCOIN07S1Api = {
  listJournals: webFinancialClosing_listJournals,
  getJournalDetail: webFinancialClosing_getJournalDetail,
  getReport: webFinancialClosing_getReport,
  export: webFinancialClosing_export,
};

export default IWONCOIN07S1Api;
