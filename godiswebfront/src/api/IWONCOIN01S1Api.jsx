import { http } from '@/libs/TaskHttp';

// Screen-aligned API (programId: IWONCOIN01S1)
// Backend: /api/iwon/iwoncoin01s1/*

export const IWONCOIN01S1_getSupply = async () => {
  return await http.get('/iwon/iwoncoin01s1/supply');
};

export const IWONCOIN01S1_getDaily = async () => {
  return await http.get('/iwon/iwoncoin01s1/daily');
};
