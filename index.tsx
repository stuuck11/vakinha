
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// DEBUG: Captura erros não tratados e mostra na tela
window.onerror = function(message, source, lineno, colno, error) {
  console.error("ERRO CAPTURADO:", message, error);
  // Não bloqueia o app, mas loga detalhes importantes
  return false;
};

window.onunhandledrejection = function(event) {
  console.error("PROMESSA REJEITADA:", event.reason);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
