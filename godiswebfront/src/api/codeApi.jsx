// codeApi.jsx
import { http } from '@/libs/TaskHttp';

export const getItems = async (grpCdId) => {
  try {
    const param = [{ KEY: grpCdId }];
    
    const response = await http.post('/webcom/getcachecodes', param, {
      shape: 'dataset'
    });
    
    console.log('📡 전체 응답:', response);
    
    // ✅ 응답이 { tables: {...} } 형태인지, 아니면 바로 {...} 형태인지 확인
    const tables = response.tables || response;
    
    console.log('📡 tables:', tables);
    console.log('📡 tables[grpCdId]:', tables[grpCdId]);
    
    return tables[grpCdId] || [];
  } catch (error) {
    console.error('공통코드 항목 조회 실패:', error);
    return [];
  }
};