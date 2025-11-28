import { useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
  useChainId
} from 'wagmi';
import { parseEther } from 'viem';
import { redPacketAbi } from '../abi/redPacket';
import { formatAddress, formatAmount, formatDate } from '../utils/format';
import { Coins, Gift, Sparkle, Trophy } from 'lucide-react';

type GrabEvent = {
  id: string;
  user: string;
  amount?: bigint;
  reason?: string;
  timestamp: number;
  type: 'success' | 'failed' | 'finish' | 'sent';
};

export default function SundaySection() {
  const contractAddress = import.meta.env.VITE_REDPACKET_CONTRACT as `0x${string}` | undefined;
  const graphEndpoint = import.meta.env.VITE_GRAPH_ENDPOINT_REDPACKET as string | undefined;
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });

  const [totalAmount, setTotalAmount] = useState('0.1');
  const [count, setCount] = useState(5);
  const [timeline, setTimeline] = useState<GrabEvent[]>([]);
  const [graphError, setGraphError] = useState<string | null>(null);

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
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: 11155111,
    query: {
      enabled: Boolean(address && contractAddress),
      refetchInterval: 8000
    }
  });

  const {
    writeContract: writeSendPacket,
    data: sendHash,
    isPending: isSending
  } = useWriteContract();

  const {
    writeContract: writeGrabPacket,
    data: grabHash,
    isPending: isGrabbing
  } = useWriteContract();

  const { isLoading: isSendConfirming } = useWaitForTransactionReceipt({
    hash: sendHash,
    chainId: 11155111,
    query: { enabled: Boolean(sendHash) }
  });
  const { isLoading: isGrabConfirming } = useWaitForTransactionReceipt({
    hash: grabHash,
    chainId: 11155111,
    query: { enabled: Boolean(grabHash) }
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: redPacketAbi,
    eventName: 'PacketSent',
    chainId: 11155111,
    enabled: Boolean(contractAddress),
    onLogs(logs) {
      logs.forEach((log) => {
        const [sender, amount, packetCount] = log.args as unknown as [string, bigint, bigint];
        setTimeline((prev) => [
          {
            id: `${log.transactionHash}-sent`,
            user: sender,
            amount,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'sent',
            reason: `共 ${packetCount.toString()} 个`
          },
          ...prev
        ]);
      });
    }
  });

  const packetInfo = useMemo(() => {
    if (!packet) return null;
    const data = packet as unknown as { sender: string; totalAmount: bigint; count: bigint; remaining: bigint };
    return data;
  }, [packet]);

  useWatchContractEvent({
    address: contractAddress,
    abi: redPacketAbi,
    eventName: 'GrabSuccess',
    chainId: 11155111,
    enabled: Boolean(contractAddress),
    onLogs(logs) {
      logs.forEach((log) => {
        const [user, amount] = log.args as unknown as [string, bigint];
        setTimeline((prev) => [
          {
            id: `${log.transactionHash}-success-${user}`,
            user,
            amount,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'success'
          },
          ...prev
        ]);
      });
    }
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: redPacketAbi,
    eventName: 'GrabFailed',
    chainId: 11155111,
    enabled: Boolean(contractAddress),
    onLogs(logs) {
      logs.forEach((log) => {
        const [user, reason] = log.args as unknown as [string, string];
        setTimeline((prev) => [
          {
            id: `${log.transactionHash}-failed-${user}`,
            user,
            reason,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'failed'
          },
          ...prev
        ]);
      });
    }
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: redPacketAbi,
    eventName: 'PacketFinished',
    chainId: 11155111,
    enabled: Boolean(contractAddress),
    onLogs(logs) {
      logs.forEach((log) => {
        setTimeline((prev) => [
          {
            id: `${log.transactionHash}-finish`,
            user: 'system',
            timestamp: Math.floor(Date.now() / 1000),
            type: 'finish',
            reason: '红包被抢完'
          },
          ...prev
        ]);
      });
    }
  });

  const explorerBase = useMemo(() => {
    if (chainId === 1) return 'https://etherscan.io';
    return 'https://sepolia.etherscan.io';
  }, [chainId]);

  const handleSend = async () => {
    if (!contractAddress) return;
    const value = parseEther(totalAmount || '0');
    await writeSendPacket({
      address: contractAddress,
      abi: redPacketAbi,
      functionName: 'sendRedPacket',
      args: [value, BigInt(count)],
      value,
      chainId: 11155111
    });
  };

  const handleGrab = async () => {
    if (!contractAddress) return;
    await writeGrabPacket({
      address: contractAddress,
      abi: redPacketAbi,
      functionName: 'grab',
      chainId: 11155111
    });
  };

  useEffect(() => {
    const fetchGraph = async () => {
      if (!graphEndpoint) return;
      setGraphError(null);
      try {
        const res = await fetch(graphEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `{
              grabSuccesses(orderBy: blockTimestamp, orderDirection: desc, first: 20) {
                id
                user
                amount
                blockTimestamp
              }
            }`
          })
        });
        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
        const mapped: GrabEvent[] = json.data.grabSuccesses.map((g: any) => ({
          id: g.id,
          user: g.user,
          amount: BigInt(g.amount),
          timestamp: Number(g.blockTimestamp),
          type: 'success'
        }));
        setTimeline(mapped);
      } catch (error) {
        setGraphError((error as Error).message);
      }
    };
    fetchGraph();
  }, [graphEndpoint]);

  return (
    <div className="space-y-6 pt-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center">
          <Gift className="h-5 w-5 text-slate-900" />
        </div>
        <div>
          <p className="text-lg font-semibold">周日作业 · 链上抢红包</p>
          <p className="text-sm text-slate-400">发红包 sendRedPacket / 抢红包 grab / 事件实时反馈</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkle className="h-4 w-4 text-orange-200" />
                <p className="font-semibold">发红包</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                总金额 (ETH)
                <input
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-slate-300">
                红包个数
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  min={1}
                />
              </label>
            </div>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/30 hover:opacity-95 disabled:opacity-60"
            >
              {isSending ? '发送中...' : '确认发红包 (sendRedPacket)'}
            </button>
            {isSendConfirming && <p className="text-xs text-amber-200">等待交易确认...</p>}
            <p className="text-xs text-slate-400">钱包余额：{balance?.formatted ?? '-'} {balance?.symbol}</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">抢红包</p>
              <p className="text-xs text-slate-400">状态：{grabbed ? '已抢过' : '未抢'}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex-1">
                <p className="text-xs text-slate-400">剩余红包</p>
                <p className="text-2xl font-semibold text-white">{remaining ? remaining.toString() : '-'}</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex-1">
                <p className="text-xs text-slate-400">总个数</p>
                <p className="text-2xl font-semibold text-white">{packetInfo ? packetInfo.count.toString() : '-'}</p>
              </div>
            </div>
            <button
              onClick={handleGrab}
              disabled={isGrabbing || Boolean(grabbed)}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:opacity-95 disabled:opacity-60"
            >
              {isGrabbing ? '抢红包中...' : grabbed ? '已经抢过啦' : '抢红包 (grab)'}
            </button>
            {isGrabConfirming && <p className="text-xs text-amber-200">等待确认...</p>}
            <p className="text-xs text-slate-400">事件监听：GrabSuccess / GrabFailed / PacketFinished</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-200" />
              <p className="font-semibold">抢红包记录</p>
            </div>
          </div>
          {graphError && <p className="text-sm text-rose-300">{graphError}</p>}
          <div className="max-h-[420px] overflow-auto space-y-2">
            {timeline.length === 0 && <p className="text-sm text-slate-300">暂无记录，先发/抢一个试试。</p>}
            {timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3 break-words"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white break-words">
                    {item.type === 'success' && '🎉 抢到红包'}
                    {item.type === 'failed' && '⚠️ 抢红包失败'}
                    {item.type === 'finish' && '🏁 红包抢完'}
                    {item.type === 'sent' && '📨 发红包'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 break-words">
                    {item.reason || ''} {item.amount ? `金额 ${formatAmount(item.amount)} ETH` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 break-all">
                    {formatAddress(item.user)} · {formatDate(item.timestamp)}
                  </p>
                </div>
                <Coins className="h-4 w-4 text-amber-300" />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 break-words">
            链接区块浏览器：{explorerBase} · 需要先在 env 配置合约地址/Graph endpoint
          </p>
        </div>
      </div>
    </div>
  );
}
