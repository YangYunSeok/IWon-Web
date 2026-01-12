import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext.jsx';
import { useTheme } from '@mui/material/styles';
// 서버호출
import { http } from '@/libs/TaskHttp';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  animation: 'fadeUp 1s ease forwards',
  opacity: 0,
  transform: 'translateY(20px)',
};

const globalAnimation = `
@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

export default function Login({ onSuccess }) {
  const theme = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!id || !pw) { setErr('아이디와 비밀번호를 입력하세요.'); return; }

     try {
      const param = { username: id, password: pw };
      const res = await http.post('/auth/login', param, {});

      if (!res || !res.success) {
        setErr(`로그인 실패: ${res.message}`);
        return;
      } else {
        setUser(res.user);
        navigate('/')
        onSuccess?.();
      }
    } catch (error) {
      console.error(error);
      setErr('서버와 연결할 수 없습니다.');
    }
  };

  const getStyles = () => ({
    wrap: { 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: theme.palette.mode === 'dark' 
        ? '#121212' // 다크모드: 검은색 배경
        : theme.palette.background.default, // 라이트모드: 기본 배경
      position: 'relative',
      overflow: 'hidden'
    },
    card: { 
      width: 'min(1000px,92vw)', 
      background: theme.palette.primary.main, 
      borderRadius: 18, 
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 20px 50px rgba(0,0,0,0.5)' 
        : '0 20px 50px rgba(0,0,0,0.3)', 
      display: 'grid', 
      gridTemplateColumns: '1.2fr 1fr', 
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1
    },
    left: { 
      padding: '48px 40px', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    },
    animationContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0
    },
    circle1: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
      top: '-100px',
      right: '-100px',
      animation: 'float 6s ease-in-out infinite'
    },
    circle2: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
      bottom: '-50px',
      left: '-50px',
      animation: 'float2 8s ease-in-out infinite'
    },
    circle3: {
      position: 'absolute',
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
      top: '50%',
      left: '30%',
      animation: 'float3 7s ease-in-out infinite'
    },
    wave1: {
      position: 'absolute',
      width: '200%',
      height: '100px',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      top: '30%',
      left: '-100%',
      animation: 'wave 8s linear infinite'
    },
    wave2: {
      position: 'absolute',
      width: '200%',
      height: '80px',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      bottom: '20%',
      right: '-100%',
      animation: 'wave2 10s linear infinite'
    },
    particle1: {
      position: 'absolute',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.6)',
      top: '20%',
      left: '10%',
      animation: 'particle 5s ease-out infinite'
    },
    particle2: {
      position: 'absolute',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      top: '60%',
      right: '20%',
      animation: 'particle2 6s ease-out infinite 1s'
    },
    particle3: {
      position: 'absolute',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.4)',
      bottom: '30%',
      left: '25%',
      animation: 'particle3 7s ease-out infinite 2s'
    },
    particle4: {
      position: 'absolute',
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      top: '40%',
      right: '15%',
      animation: 'particle4 5.5s ease-out infinite 1.5s'
    },
    content: {
      position: 'relative',
      zIndex: 1
    },
    welcome: { 
      margin: 0, 
      letterSpacing: 2, 
      fontSize: 36, 
      fontWeight: 800,
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    headline: { 
      marginTop: 10, 
      opacity: 0.95, 
      fontWeight: 700,
      fontSize: 20
    },
    desc: { 
      marginTop: 14, 
      opacity: 0.9, 
      lineHeight: 1.6, 
      maxWidth: 520 
    },
    logoContainer: {
      marginTop: 40,
      display: 'flex',
      justifyContent: 'center'
    },
    logo: {
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
      animation: 'logoRotate 4s ease-in-out infinite'
    },
    right: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '30px',
      background: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.03)' 
        : 'rgba(255,255,255,0.05)'
    },
    panel: { 
      background: theme.palette.background.paper, 
      borderRadius: 14, 
      padding: '26px 22px', 
      width: '100%', 
      maxWidth: 360, 
      boxShadow: theme.palette.mode === 'dark'
        ? '0 10px 30px rgba(0,0,0,0.3)'
        : '0 10px 30px rgba(0,0,0,.12)' 
    },
    title: { 
      fontSize: 24, 
      fontWeight: 800, 
      marginBottom: 12, 
      color: theme.palette.primary.main 
    },
    label: { 
      display: 'block', 
      fontSize: 12, 
      color: theme.palette.text.secondary, 
      margin: '4px 0' 
    },
    input: { 
      width: '100%', 
      height: 42, 
      border: `1px solid ${theme.palette.divider}`, 
      borderRadius: 8, 
      padding: '0 12px', 
      outline: 'none',
      transition: 'border 0.2s',
      fontSize: 14,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    },
    passwordRow: { 
      display: 'flex', 
      alignItems: 'center', 
      border: `1px solid ${theme.palette.divider}`, 
      borderRadius: 8, 
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    },
    showBtn: { 
      height: 42, 
      padding: '0 12px', 
      border: 'none', 
      background: 'transparent', 
      cursor: 'pointer', 
      color: theme.palette.primary.main, 
      fontWeight: 700,
      fontSize: 12
    },
    row: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginTop: 10, 
      fontSize: 13,
      color: theme.palette.text.primary,
    },
    link: { 
      color: theme.palette.primary.main, 
      textDecoration: 'none', 
      fontWeight: 700 
    },
    submit: { 
      marginTop: 14, 
      width: '100%', 
      height: 44, 
      border: 'none', 
      borderRadius: 8, 
      background: theme.palette.primary.main, 
      color: theme.palette.primary.contrastText || '#fff', 
      fontWeight: 800, 
      letterSpacing: 0.3, 
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      boxShadow: theme.palette.mode === 'dark'
        ? `0 4px 12px rgba(103, 80, 164, 0.5)`
        : '0 4px 12px rgba(103, 80, 164, 0.3)'
    },
    err: { 
      marginTop: 8, 
      color: theme.palette.error.main, 
      fontSize: 12, 
      minHeight: 18 
    }
  });

  const styles = getStyles();

  return (
    <div style={styles.wrap}>
      <style>{keyframes}</style>
      <div style={styles.card}>
        <div style={styles.left}>

          {/* <h1 style={styles.welcome}>WELCOME</h1>
          <div style={styles.headline}>Meta Domix Studio</div>
          <p style={styles.desc}>로그인 후 메인 화면으로 이동합니다.</p> */}


          {/* 애니메이션 배경 */}
          <div style={styles.animationContainer}>
            <div style={styles.circle1}></div>
            <div style={styles.circle2}></div>
            <div style={styles.circle3}></div>
            <div style={styles.wave1}></div>
            <div style={styles.wave2}></div>
            <div style={styles.particle1}></div>
            <div style={styles.particle2}></div>
            <div style={styles.particle3}></div>
            <div style={styles.particle4}></div>
          </div>
          {/* 컨텐츠 */}
          <div style={styles.content}>
            <h1 style={styles.welcome}>WELCOME</h1>
            <div style={styles.headline}>GODIS</div>
            <p style={styles.desc}>로그인 후 메인 화면으로 이동합니다.</p>
            
            {/* 로고 아이콘 */}
            <div style={styles.logoContainer}>
              <svg width="120" height="120" viewBox="0 0 24 24" style={styles.logo}>
                <g
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </g>
              </svg>
            </div>
          </div>

          {/* <h1 style={{ ...styles.welcome, ...fadeUp }}>WELCOME</h1>
          <div style={{ ...styles.headline, ...fadeUp, animationDelay: '0.2s' }}>
            Meta Domix Studio
          </div>
          <p style={{ ...styles.desc, ...fadeUp, animationDelay: '0.4s' }}>
            로그인 후 메인 화면으로 이동합니다.
          </p>
          <style>{globalAnimation}</style> */}


        </div>
        <div style={styles.right}>
          <div style={styles.panel}>
            <div style={styles.title}>Sign in</div>
            <form onSubmit={onSubmit}>
              <label style={styles.label}>User Name</label>
              <input
                style={styles.input}
                placeholder="User Name"
                value={id}
                onChange={(e)=>setId(e.target.value)}
                autoComplete="username"
              />
              <label style={{...styles.label, marginTop:12}}>Password</label>
              <div style={styles.passwordRow}>
                <input
                  style={{...styles.input, margin:0, flex:1, border:'none', backgroundColor:'transparent'}}
                  type={show ? 'text' : 'password'}
                  placeholder="Password"
                  value={pw}
                  onChange={(e)=>setPw(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={()=>setShow(!show)} style={styles.showBtn}>
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <div style={styles.row}>
                <label style={{display:'flex',alignItems:'center',gap:8, color: theme.palette.text.primary}}>
                  <input type="checkbox" style={{ accentColor: theme.palette.primary.main }} /> Remember me
                </label>
                <a href="#" style={styles.link}>Forgot Password?</a>
              </div>
              <button type="submit" style={styles.submit}>Sign in</button>
              <div style={styles.err}>{err}</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }
  
  @keyframes float2 {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    33% { transform: translateY(-15px) translateX(10px); }
    66% { transform: translateY(5px) translateX(-10px); }
  }
  
  @keyframes float3 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(15px) scale(0.95); }
  }
  
  @keyframes wave {
    0% { transform: translateX(-100%) translateY(0); }
    50% { transform: translateX(0) translateY(-10px); }
    100% { transform: translateX(100%) translateY(0); }
  }
  
  @keyframes wave2 {
    0% { transform: translateX(100%) translateY(0); }
    50% { transform: translateX(0) translateY(10px); }
    100% { transform: translateX(-100%) translateY(0); }
  }
  
  @keyframes particle {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(100px, -100px) scale(1); opacity: 0; }
  }
  
  @keyframes particle2 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(-80px, -120px) scale(1); opacity: 0; }
  }
  
  @keyframes particle3 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(60px, 100px) scale(1); opacity: 0; }
  }
  
  @keyframes particle4 {
    0% { transform: translate(0, 0) scale(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(-100px, 80px) scale(1); opacity: 0; }
  }
  
  @keyframes logoRotate {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(5deg) scale(1.1); }
  }
`;


// const styles = {
//   wrap: {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#eef3f9'},
//   card: {width:'min(1000px,92vw)',background:'#6750A4',borderRadius:18,boxShadow:'0 20px 50px rgba(0,0,0,0.15)',display:'grid',gridTemplateColumns:'1.2fr 1fr',overflow:'hidden'},
//   left: {padding:'48px 40px',color:'#fff'},
//   welcome:{margin:0,letterSpacing:2,fontSize:36,fontWeight:800},
//   headline:{marginTop:10,opacity:.95,fontWeight:700},
//   desc:{marginTop:14,opacity:.9,lineHeight:1.6,maxWidth:520},
//   right:{display:'flex',alignItems:'center',justifyContent:'center',padding:'30px'},
//   panel:{background:'#fff',borderRadius:14,padding:'26px 22px',width:'100%',maxWidth:360,boxShadow:'0 10px 30px rgba(0,0,0,.12)'},
//   title:{fontSize:24,fontWeight:800,marginBottom:12,color:'#6750A4'},
//   label:{display:'block',fontSize:12,color:'#678',margin:'4px 0'},
//   input:{width:'100%',height:42,border:'1px solid #d9e2ef',borderRadius:8,padding:'0 12px',outline:'none'},
//   passwordRow:{display:'flex',alignItems:'center',border:'1px solid #d9e2ef',borderRadius:8,overflow:'hidden'},
//   showBtn:{height:42,padding:'0 12px',border:'none',background:'transparent',cursor:'pointer',color:'#6750A4',fontWeight:700},
//   row:{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,fontSize:13},
//   link:{color:'#6750A4',textDecoration:'none',fontWeight:700},
//   submit:{marginTop:14,width:'100%',height:44,border:'none',borderRadius:8,background:'#6750A4',color:'#fff',fontWeight:800,letterSpacing:.3,cursor:'pointer'},
//   err:{marginTop:8,color:'#c22',fontSize:12,minHeight:18}
// };