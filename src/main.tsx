import React from 'react';
import ReactDOM from 'react-dom/client';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import App from './App';
import './index.css';
import { wagmiConfig } from './walletConfig';

const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="wide"
          showRecentTransactions
          theme={lightTheme({
            accentColor: '#ff4d67',
            accentColorForeground: '#0c0c12',
            borderRadius: 'medium',
            fontStack: 'rounded'
          })}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
