const INTERNAL_KEY = '__rid';
const STATE_FIELD  = 'ROW_STATE'; // 'I' | 'U' | 'D'

/**
 * 변경된 행만(ROW_STATE ∈ {I,U,D}) 추출.
 * __rid는 제거하고, ROW_STATE는 유지해서 서버로 보낼 수 있도록 한다.
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
export function changes(rows = []) {
  const CHANGED = new Set(['I', 'U', 'D']);
  return (rows || [])
    .filter(r => CHANGED.has(r?.[STATE_FIELD]))
    .map(r => {
      const { [INTERNAL_KEY]: _rid, ...dto } = r || {};
      return dto; // ROW_STATE는 유지
    });
}

export function toValueOptions(codes = [], valueKey = 'CD_VAL', labelKey = 'CD_NM') {
  if (!Array.isArray(codes)) return [];
  return codes.map(row => ({
    value: row?.[valueKey],
    label: row?.[labelKey],
  }));
}