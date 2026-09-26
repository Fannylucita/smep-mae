import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { iniciarSincronizacionAutomatica } from '@/lib/sync';

iniciarSincronizacionAutomatica();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
