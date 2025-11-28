import { useMemo } from 'react';
import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi';
import { redPacketAbi } from '../abi/redPacket';

const zeroAddress = '0x0000000000000000000000000000000000000000';

export function useRedPacketBasics() {
  const contractAddress = import.meta.env.VITE_REDPACKET_CONTRACT as `0x${string}` | undefined;
  const graphEndpoint = import.meta.env.VITE_GRAPH_ENDPOINT_REDPACKET as string | undefined;
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const { data: packet } = useReadContract({
    address: contractAddress,
    abi: redPacketAbi,
    functionName: 'packet',
    chainId: 11155111,
    query: {
      enabled: Boolean(contractAddress),
      refetchInterval: 8000
    }
  });

  const { data: remaining } = useReadContract({
    address: contractAddress,
    abi: redPacketAbi,
    functionName: 'remaining',
    chainId: 11155111,
    query: {
      enabled: Boolean(contractAddress),
      refetchInterval: 8000
    }
  });

  const { data: grabbed } = useReadContract({
    address: contractAddress,
    abi: redPacketAbi,
    functionName: 'claimed',
    args: [address ?? zeroAddress],
    chainId: 11155111,
    query: {
      enabled: Boolean(address && contractAddress),
      refetchInterval: 8000
    }
  });

  const packetInfo = useMemo(() => {
    if (!packet) return null;
    const [sender, totalAmount, count, remaining] = packet as unknown as [string, bigint, bigint, bigint];
    return { sender, totalAmount, count, remaining };
  }, [packet]);

  const explorerBase = useMemo(() => {
    if (chainId === 1) return 'https://etherscan.io';
    return 'https://sepolia.etherscan.io';
  }, [chainId]);

  return {
    address,
    balance,
    chainId,
    contractAddress,
    explorerBase,
    graphEndpoint,
    grabbed,
    packetInfo,
    remaining
  };
}
