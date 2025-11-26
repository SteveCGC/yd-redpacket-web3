import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID || '';
const walletConnectId = import.meta.env.VITE_WALLETCONNECT_ID || 'demo';

export const chains = [sepolia, mainnet] as const;

export const wagmiConfig = getDefaultConfig({
  appName: '链上数据与红包 DApp',
  projectId: walletConnectId,
  chains,
  ssr: true,
  transports: {
    [mainnet.id]: alchemyId ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`) : http(),
    [sepolia.id]: alchemyId ? http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`) : http()
  }
});
