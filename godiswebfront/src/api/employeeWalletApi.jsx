import { http } from '@/libs/TaskHttp';

// SSOT: docs/design/api/web-admin.md (webWallet.*)
// - GET  /admin/employees
// - POST /admin/wallets/create

export const webWallet_listEmployees = async (params = {}) => {
  return await http.get('/admin/employees', { params, showSpinner: true });
};

export const webWallet_createWallets = async (employeeIds = []) => {
  return await http.post(
    '/admin/wallets/create',
    { employeeIds },
    { showSpinner: true },
  );
};

// Backward-compatible default export (if any legacy code expects an object)
const EmployeeWalletApi = {
  listEmployees: webWallet_listEmployees,
  createWallets: webWallet_createWallets,
};

export default EmployeeWalletApi;