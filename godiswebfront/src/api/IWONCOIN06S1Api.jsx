import { http } from '@/libs/TaskHttp';

// SSOT: docs/design/api/web-admin.md (webMonthlyPayee.*)
// - GET    /admin/monthly-payees
// - POST   /admin/monthly-payees/{id}
// - DELETE /admin/monthly-payees/{id}
// - PUT    /admin/monthly-payees/bulk-delete
// - DELETE /admin/monthly-payees/{year}-{month}/confirm
// - GET    /admin/monthly-payees/export

export const webMonthlyPayee_list = async (params = {}) => {
  return await http.get('/admin/monthly-payees', { params, showSpinner: true });
};

export const webMonthlyPayee_upsert = async (id, body) => {
  return await http.post(`/admin/monthly-payees/${encodeURIComponent(String(id))}`, body, { showSpinner: true });
};

export const webMonthlyPayee_delete = async (id) => {
  return await http.delete(`/admin/monthly-payees/${encodeURIComponent(String(id))}`, { showSpinner: true });
};

export const webMonthlyPayee_bulkDelete = async (ids = []) => {
  return await http.put('/admin/monthly-payees/bulk-delete', { ids }, { showSpinner: true });
};

export const webMonthlyPayee_confirm = async (year, month) => {
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  return await http.delete(`/admin/monthly-payees/${encodeURIComponent(ym)}/confirm`, { showSpinner: true });
};

export const webMonthlyPayee_export = async (params = {}) => {
  // Note: SSOT says responseType is ExportMonthlyPayeesResponse, but implementation may choose
  // stream vs URL. Backend in this repo returns a downloadUrl.
  return await http.get('/admin/monthly-payees/export', { params, showSpinner: true });
};

const IWONCOIN06S1Api = {
  list: webMonthlyPayee_list,
  upsert: webMonthlyPayee_upsert,
  delete: webMonthlyPayee_delete,
  bulkDelete: webMonthlyPayee_bulkDelete,
  confirm: webMonthlyPayee_confirm,
  export: webMonthlyPayee_export,
};

export default IWONCOIN06S1Api;
