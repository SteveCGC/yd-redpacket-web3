import { useEffect, useMemo, useState } from 'react';
import { useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi';
import { ArrowLeft, Coins, Gift, PartyPopper, Sparkle, SwitchCamera, Wallet } from 'lucide-react';
import { parseEther } from 'viem';
import { redPacketAbi } from '../abi/redPacket';
import { useRedPacketBasics } from '../hooks/useRedPacketBasics';
import { formatAddress, formatAmount, formatDate } from '../utils/format';

type GrabEvent = {
  id: string;
  user: string;
  amount?: bigint;
  reason?: string;
  timestamp: number;
  type: 'success' | 'failed' | 'finish' | 'sent';
};

type TabKey = 'send' | 'grab';

type Props = {
  onBack: () => void;
};

function readInitialTab(): TabKey {
  const url = new URL(window.location.href);
  const tab = url.searchParams.get('tab');
  if (tab === 'grab') return 'grab';
  if (tab === 'send') return 'send';
  if (window.location.pathname.startsWith('/grab')) return 'grab';
  return 'send';
}

export default function SundayRedPacketPage({ onBack }: Props) {
  const { contractAddress, graphEndpoint, remaining, packetInfo, grabbed, explorerBase, balance } = useRedPacketBasics();
  const [tab, setTab] = useState<TabKey>(() => readInitialTab());
  const [timeline, setTimeline] = useState<GrabEvent[]>([]);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState('0.1');
  const [count, setCount] = useState(5);

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
                blockNumber
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

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, [tab]);

  const sendDisabled = useMemo(() => !contractAddress || Number(totalAmount) <= 0 || count <= 0 || isSending, [contractAddress, totalAmount, count, isSending]);
  const grabDisabled = useMemo(() => isGrabbing || Boolean(grabbed) || !contractAddress, [grabbed, isGrabbing, contractAddress]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1c0c0c] via-[#2a0f0f] to-[#0d0505] text-white">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-white border border-white/15 active:scale-[0.99]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
          <div className="flex items-center gap-2 text-xs text-amber-100/90">
            <Sparkle className="h-4 w-4 text-amber-300" />
            <span>春节红包 · H5</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#ffdfc1]/40 bg-gradient-to-br from-[#ff5b5b] via-[#d2193a] to-[#36030a] p-5 shadow-[0_20px_60px_rgba(210,25,58,0.35)] space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#ffe0b2] flex items-center justify-center text-[#b5121b] shadow-lg shadow-black/20">
              <Gift className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-bold text-[#fffbf4]">链上红包（周日作业）</p>
            </div>
          </div>
          <p className="text-sm text-[#ffede1] break-all">合约：{contractAddress ?? '未配置 VITE_REDPACKET_CONTRACT'}</p>
        </div>

        <div className="flex rounded-2xl border border-[#ffdfc1]/30 bg-[#260909] p-1 shadow-inner shadow-black/40">
          <button
            onClick={() => setTab('send')}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === 'send' ? 'bg-gradient-to-r from-[#ff7b5f] to-[#ff3d3d] text-[#2a0505] shadow-lg shadow-[rgba(255,61,61,0.35)]' : 'text-[#ffd7c7]'
            }`}
          >
            发红包
          </button>
          <button
            onClick={() => setTab('grab')}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === 'grab' ? 'bg-gradient-to-r from-[#ff7b5f] to-[#ff3d3d] text-[#2a0505] shadow-lg shadow-[rgba(255,61,61,0.35)]' : 'text-[#ffd7c7]'
            }`}
          >
            抢红包
          </button>
        </div>

        {tab === 'send' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffdfc1]/30 bg-[#1b0b0b] p-4 shadow-lg shadow-black/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#ffe2d9]">
                  <Sparkle className="h-4 w-4 text-amber-200" />
                  <p className="font-semibold">发红包</p>
                </div>
              </div>
              <label className="block text-sm text-[#ffe2d9]">
                总金额（ETH）
                <input
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  inputMode="decimal"
                  className="mt-2 w-full rounded-xl border border-[#ffdfc1]/30 bg-[#2a0f0f] px-4 py-3 text-base text-white focus:border-[#ff7b5f] outline-none"
                  placeholder="0.1"
                />
              </label>
              <label className="block text-sm text-[#ffe2d9]">
                红包个数
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  min={1}
                  className="mt-2 w-full rounded-xl border border-[#ffdfc1]/30 bg-[#2a0f0f] px-4 py-3 text-base text-white focus:border-[#ff7b5f] outline-none"
                  placeholder="5"
                />
              </label>
              <button
                onClick={handleSend}
                disabled={sendDisabled}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ff7b5f] to-[#ff3d3d] px-4 py-3 text-base font-semibold text-[#2a0505] shadow-lg shadow-[rgba(255,61,61,0.4)] active:scale-[0.99] disabled:opacity-60"
              >
                {isSending ? '发送中...' : '确认发红包'}
              </button>
              {isSendConfirming && <p className="text-xs text-[#ffd3c5]">等待链上确认...</p>}
              <div className="rounded-xl border border-[#ffdfc1]/30 bg-[#2a0f0f] px-4 py-3 text-sm text-white/80 flex items-center gap-3">
                <Wallet className="h-4 w-4 text-[#ffd7c7]" />
                <div className="leading-tight">
                  <p>钱包余额：{balance?.formatted ?? '-'} {balance?.symbol}</p>
                  <p className="text-xs text-[#ffbaa6]">分享链接给好友：/redpacket</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[#ffdfc1]/30 bg-[#1b0b0b] p-4 shadow-lg shadow-black/30 space-y-3">
              <p className="text-sm font-semibold text-white">红包池</p>
              <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
                <div className="rounded-xl bg-[#2a0f0f] border border-[#ffdfc1]/20 px-3 py-3">
                  <p className="text-xs text-[#ffbaa6]">总金额</p>
                  <p className="text-lg font-semibold text-white">
                    {packetInfo ? formatAmount(packetInfo.totalAmount) : '-'} ETH
                  </p>
                </div>
                <div className="rounded-xl bg-[#2a0f0f] border border-[#ffdfc1]/20 px-3 py-3">
                  <p className="text-xs text-[#ffbaa6]">红包个数</p>
                  <p className="text-lg font-semibold text-white">{packetInfo ? packetInfo.count.toString() : '-'}</p>
                </div>
              </div>
              <p className="text-xs text-[#ffbaa6]">提示：发完红包后直接分享 /redpacket 给好友抢。</p>
            </div>
          </div>
        )}

        {tab === 'grab' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#ffdfc1]/30 bg-[#1b0b0b] p-4 shadow-lg shadow-black/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#ffe2d9]">
                  <PartyPopper className="h-5 w-5 text-[#ffd7c7]" />
                  <p className="font-semibold">抢红包</p>
                </div>
                <button
                  onClick={() => setTab('send')}
                  className="flex items-center gap-2 rounded-full bg-[#2a0f0f] px-3 py-2 text-xs font-semibold text-[#ffd7c7] border border-[#ffdfc1]/20 active:scale-[0.99]"
                >
                  <SwitchCamera className="h-4 w-4" />
                  去发一个
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#2a0f0f] border border-[#ffdfc1]/20 px-3 py-3">
                  <p className="text-xs text-[#ffbaa6]">剩余红包</p>
                  <p className="text-2xl font-semibold text-white">{remaining ? remaining.toString() : '-'}</p>
                </div>
                <div className="rounded-xl bg-[#2a0f0f] border border-[#ffdfc1]/20 px-3 py-3">
                  <p className="text-xs text-[#ffbaa6]">总个数</p>
                  <p className="text-2xl font-semibold text-white">{packetInfo ? packetInfo.count.toString() : '-'}</p>
                </div>
              </div>
              <button
                onClick={handleGrab}
                disabled={grabDisabled}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ff7b5f] to-[#ff3d3d] px-4 py-3 text-base font-semibold text-[#2a0505] shadow-lg shadow-[rgba(255,61,61,0.4)] active:scale-[0.99] disabled:opacity-60"
              >
                {isGrabbing ? '抢红包中...' : grabbed ? '已经抢过啦' : '立即抢红包'}
              </button>
              {isGrabConfirming && <p className="text-xs text-[#ffd3c5]">等待确认...</p>}
            </div>

            <div className="rounded-2xl border border-[#ffdfc1]/30 bg-[#1b0b0b] p-4 shadow-lg shadow-black/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-amber-200" />
                  <p className="text-sm font-semibold text-white">抢红包记录</p>
                </div>
                <p className="text-xs text-[#ffbaa6] break-all text-right">Graph: {graphEndpoint ?? '未配置'}</p>
              </div>
              {graphError && <p className="text-sm text-[#ffd1d1]">{graphError}</p>}
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {timeline.length === 0 && <p className="text-sm text-[#ffe2d9]">暂无记录，先抢一个试试。</p>}
                {timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#ffdfc1]/20 bg-[#2a0f0f] px-4 py-3 flex items-center justify-between gap-3 break-words"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white break-words">
                        {item.type === 'success' && '🎉 抢到红包'}
                        {item.type === 'failed' && '⚠️ 抢红包失败'}
                        {item.type === 'finish' && '🏁 红包抢完'}
                        {item.type === 'sent' && '📨 发红包'}
                      </p>
                      <p className="text-xs text-[#ffbaa6] mt-1 break-words">
                        {item.reason || ''} {item.amount ? `金额 ${formatAmount(item.amount)} ETH` : ''}
                      </p>
                      <p className="text-xs text-[#f9c7b5] mt-1 break-all">
                        {formatAddress(item.user)} · {formatDate(item.timestamp)}
                      </p>
                    </div>
                    <Coins className="h-4 w-4 text-[#ffd7c7]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
