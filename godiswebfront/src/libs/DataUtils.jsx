import { http } from '@/libs/TaskHttp';

export const cacheCode = async (keys = []) => {
  try {
    if (!Array.isArray(keys) || keys.length === 0) return {};

    const param = keys.map(key => ({ KEY: key }));
    const { tables } = await http.post('/webcom/getcachecodes', param, { shape: 'dataset' });

    console.log('cacheCode tables:', tables);
    return tables;
  } catch (e) {
    message.error('[공통코드] Cache 데이터 조회 실패');
  }
}

export const cacheMsgs = async (param = {}) => {
  try {
    const { name, table } = await http.post('/webcom/getcachemsgs',param,{ shape: 'datatable' });
    return Array.isArray(table) ? table : [];
  } catch (e) {
    message.error('[메시지코드] Cache 데이터 조회 실패');
  }
}


