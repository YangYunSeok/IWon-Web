import React, { useState } from 'react';

export default function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');

  const handleUnlock = () => {
    // 실제로는 서버에 비밀번호 확인 요청을 보낼 수도 있습니다.
    if (password === '1234') { // 예시 비밀번호
      onUnlock();
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div style={lockStyles.overlay}>
      <div style={lockStyles.container}>
        <h2>보안을 위해 화면이 잠겼습니다</h2>
        <p>세션 유지를 위해 비밀번호를 입력해주세요.</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
        />
        <button onClick={handleUnlock}>잠금 해제</button>
      </div>
    </div>
  );
}

const lockStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' },
  container: { textAlign: 'center', background: '#333', padding: '40px', borderRadius: '10px' }
};