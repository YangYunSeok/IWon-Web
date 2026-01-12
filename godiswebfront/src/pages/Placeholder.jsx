import React from 'react';
export default function Placeholder({ title }) {
  return (
    <div>
      <h2 style={{marginTop:0}}>{title}</h2>
      <p className="help">이 메뉴는 아직 연결된 구현이 없습니다.</p>
    </div>
  );
}
