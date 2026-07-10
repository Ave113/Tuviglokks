import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Chặn và triệt tiêu toàn bộ lỗi kết nối WebSocket/HMR vô hại trong môi trường sandbox của AI Studio để không hiện thông báo lỗi
if (typeof window !== 'undefined') {
  const ignorePatterns = [
    'failed to connect to websocket',
    'WebSocket closed',
    'websocket connection',
    'WebSocket connection to',
    'ws://',
    'wss://'
  ];

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = typeof reason === 'string' ? reason : (reason.message || '');
      if (ignorePatterns.some(pattern => typeof msg === 'string' && msg.toLowerCase().includes(pattern.toLowerCase()))) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (ignorePatterns.some(pattern => typeof msg === 'string' && msg.toLowerCase().includes(pattern.toLowerCase()))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

