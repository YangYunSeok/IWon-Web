// ✅ Vite + ESM 호환 버전
import React, { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { Client } from '@stomp/stompjs';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function NotificationSocket() {
  const client = useRef(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  const handleClose = () => setOpen(false);
  const backendHost = window.location.hostname;

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS(`http://${backendHost}:8080/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket 연결 성공');
        setMessage('실시간 알림 서비스 연결 성공');
        setSeverity('success');
        setOpen(true);

        stompClient.subscribe('/user/queue/notification', (msg) => {
          try {
            const body = JSON.parse(msg.body);

            let text =
              body.content ||
              body.message ||
              '새로운 알림이 도착했습니다!';

            // 🔹 개행 제거
            text = text.replace(/\r?\n/g, ' ');

            console.log('알림 수신:', text);
            setMessage(text);
            setSeverity('info');
            setOpen(true);
          } catch (e) {
            let text = msg.body || '';
            text = text.replace(/\r?\n/g, ' ');
            console.log('알림(raw):', text);
            setMessage(text);
            setSeverity('warning');
            setOpen(true);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP 오류:', frame);
        setMessage('WebSocket 오류 발생');
        setSeverity('error');
        setOpen(true);
      },
    });

    stompClient.activate();
    client.current = stompClient;

    return () => {
      client.current?.deactivate();
      console.log('연결 종료');
    };
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        sx={{
          width: 420,
          '& .MuiAlert-message': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
