import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="bottom-right" gutter={8} toastOptions={{
            duration: 4000,
            className: '!rounded-lg !border !border-line !bg-surface !px-3.5 !py-2.5 !text-base !text-ink !shadow-pop !font-sans',
            success: { iconTheme: { primary: 'rgb(11 120 94)', secondary: 'white' } },
            error: { iconTheme: { primary: 'rgb(186 26 54)', secondary: 'white' }, duration: 6000 },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
