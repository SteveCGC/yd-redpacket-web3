import { formatUnits } from 'ethers';

export function formatAddress(addr?: string, size = 4) {
  if (!addr) return '';
  return `${addr.slice(0, 2 + size)}...${addr.slice(-size)}`;
}

export function formatAmount(raw?: bigint, decimals = 18, fraction = 4) {
  if (!raw) return '0';
  const val = Number(formatUnits(raw, decimals));
  return val.toFixed(fraction);
}

export function formatDate(timestamp?: number) {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString();
}
