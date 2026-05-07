import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import './styles.css';
import { AuthProvider } from './state/auth/AuthContext.jsx';
import { App } from './router/App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

