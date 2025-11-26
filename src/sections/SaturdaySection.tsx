import { useEffect, useMemo, useState } from 'react';
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
  useWatchContractEvent,
  useChainId,
  useChains
} from 'wagmi';
import { parseEther, stringToHex, hexToString } from 'viem';
import { AlchemyProvider, toUtf8String } from 'ethers';
import { messageLogAbi } from '../abi/messageLog';
import { formatAddress, formatDate } from '../utils/format';
import { ExternalLink, Radio, Waves } from 'lucide-react';

type ChainKey = 'sepolia' | 'homestead';

type MessageLog = {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
};

function getAlchemyNetwork(chainId?: number): ChainKey {
  if (chainId === 1) return 'homestead';
  return 'sepolia';
}

const defaultRecipient = '0xaaf2b869f10d7d8a723dfb673e17bb54c08f7fb7';

export default function SaturdaySection() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const activeChain = chains.find((c) => c.id === chainId);
  const alchemyKey = import.meta.env.VITE_ALCHEMY_ID as string | undefined;
  const graphEndpoint = import.meta.env.VITE_GRAPH_ENDPOINT_SATURDAY as string | undefined;
  const contractAddress = import.meta.env.VITE_MESSAGE_CONTRACT as `0x${string}` | undefined;
  const demoHash = import.meta.env.VITE_DEMO_TX_HASH as `0x${string}` | undefined;

  const [recipient, setRecipient] = useState(defaultRecipient);
  const [message, setMessage] = useState('Hello, chain data via raw tx');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(demoHash);
  const [txDetail, setTxDetail] = useState<{ hash: string; to?: string | null; data?: string; decoded?: string }>();
  const [txReadError, setTxReadError] = useState<string | null>(null);

  const [eventMessage, setEventMessage] = useState('数据写入事件日志');
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [graphError, setGraphError] = useState<string | null>(null);

  const { isPending: isSendingTx, sendTransaction } = useSendTransaction();
  const { isPending: isEventPending, writeContract } = useWriteContract();

  useWatchContractEvent({
    address: contractAddress,
    abi: messageLogAbi,
    eventName: 'MessageLogged',
    chainId: 11155111,
    enabled: Boolean(contractAddress),
    onLogs(logsData) {
      logsData.forEach((log) => {
        const [sender, msg, timestamp] = log.args as unknown as [string, string, bigint];
        setLogs((prev) => [
          {
            id: `${log.transactionHash}-${Number(timestamp)}`,
            sender,
            message: msg,
            timestamp: Number(timestamp)
          },
          ...prev
        ]);
      });
    }
  });

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    chainId,
    hash: txHash,
    query: {
      enabled: Boolean(txHash)
    }
  });

  const explorerBase = useMemo(() => {
    if (activeChain?.id === 1) return 'https://etherscan.io/tx/';
    return 'https://sepolia.etherscan.io/tx/';
  }, [activeChain]);

  const handleSendRawTx = async () => {
    setTxReadError(null);
    try {
      const dataHex = stringToHex(message) as `0x${string}`;
      const hash = await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther('0'),
        data: dataHex
      });
      setTxHash(hash);
    } catch (error) {
      setTxReadError((error as Error).message);
    }
  };

  useEffect(() => {
    const fetchTx = async () => {
      if (!txHash) return;
      if (!alchemyKey) {
        setTxReadError('缺少 VITE_ALCHEMY_ID，无法读取交易数据');
        return;
      }
      try {
        const network = getAlchemyNetwork(chainId);
        const provider = new AlchemyProvider(network, alchemyKey);
        const tx = await provider.getTransaction(txHash);
        setTxDetail({
          hash: tx.hash,
          to: tx.to,
          data: tx.data,
          decoded: tx.data ? safeDecode(tx.data) : undefined
        });
      } catch (error) {
        setTxReadError((error as Error).message);
      }
    };
    fetchTx();
  }, [alchemyKey, chainId, txHash]);

  const handleWriteEvent = async () => {
    if (!contractAddress) {
      setGraphError('请在 .env 中配置 VITE_MESSAGE_CONTRACT');
      return;
    }
    try {
      const hash = await writeContract({
        address: contractAddress,
        abi: messageLogAbi,
        functionName: 'store',
        args: [eventMessage],
        chainId: 11155111
      });
      if (hash) {
        setLogs((prev) => [
          {
            id: hash,
            sender: address ?? '',
            message: eventMessage,
            timestamp: Math.floor(Date.now() / 1000)
          },
          ...prev
        ]);
      }
    } catch (error) {
      setGraphError((error as Error).message);
    }
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
            query: `query MessageLogs {
              messages(orderBy: timestamp, orderDirection: desc, first: 20) {
                id
                sender
                message
                timestamp
              }
            }`
          })
        });
        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
        setLogs(json.data.messages);
      } catch (error) {
        setGraphError((error as Error).message);
      }
    };
    fetchGraph();
  }, [graphEndpoint]);

  const publicRpc = activeChain?.rpcUrls?.default?.http?.[0] ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">周六作业 · 两种上链方式</p>
          <p className="text-sm text-slate-400">原生交易 data 字段 vs 合约事件 + The Graph</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">方式一：直接转账写 data</p>
            <span className="text-xs text-slate-400 break-all text-right">{publicRpc}</span>
          </div>
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">
              收款地址
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="0x..."
              />
            </label>
            <label className="block text-sm text-slate-300">
              写入内容（写入 data 字段，0 ETH 转账）
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"
                rows={3}
              />
            </label>
            <button
              onClick={handleSendRawTx}
              disabled={isSendingTx}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/30 hover:opacity-95 disabled:opacity-60"
            >
              {isSendingTx ? '发送中...' : '发送 0 ETH + data 上链'}
            </button>
            {txReadError && <p className="text-sm text-rose-300">{txReadError}</p>}
          </div>

          {txHash && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">交易哈希</span>
                <a className="text-fuchsia-200 hover:text-white" href={`${explorerBase}${txHash}`} target="_blank" rel="noreferrer">
                  查看 Etherscan <ExternalLink className="inline h-4 w-4 align-middle" />
                </a>
              </div>
              <p className="break-all font-mono text-xs text-slate-100">{txHash}</p>
              {isConfirming && <p className="text-xs text-amber-200">等待确认...</p>}
              {txDetail && (
                <div className="space-y-1 text-xs text-slate-300 break-words">
                  <p className="break-all">收款地址：{txDetail.to ?? '-'}</p>
                  <p className="break-all font-mono text-slate-100">Data 原文：{txDetail.data}</p>
                  <p className="break-all">Data 解码：{txDetail.decoded ?? '无法解码'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">方式二：合约事件 + The Graph</p>
            <span className="text-xs text-slate-400">合约：{contractAddress ?? '未配置'}</span>
          </div>
          <div className="space-y-3">
            <label className="block text-sm text-slate-300">
              写入事件内容
              <input
                value={eventMessage}
                onChange={(e) => setEventMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <button
              onClick={handleWriteEvent}
              disabled={isEventPending}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/30 hover:opacity-95 disabled:opacity-60"
            >
              {isEventPending ? '发送中...' : '调用合约 emit event'}
            </button>
            {graphError && <p className="text-sm text-rose-300">{graphError}</p>}
            <p className="text-xs text-slate-400 break-words">
              数据读取：事件实时监听 + Graph 历史查询（endpoint: {graphEndpoint ?? '未配置'}）
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-h-72 overflow-auto space-y-2">
            <div className="flex items-center justify-between text-xs uppercase text-slate-400">
              <span>最新 事件</span>
              <Waves className="h-4 w-4" />
            </div>
            {logs.length === 0 && <p className="text-sm text-slate-300">暂无数据，先 emit 一条试试。</p>}
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-white/5 bg-black/10 p-3 break-words">
                <p className="text-sm font-semibold text-white break-words">{log.message}</p>
                <p className="text-xs text-slate-400 mt-1 break-all">
                  {formatAddress(log.sender)} · {formatDate(log.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function safeDecode(data: string) {
  try {
    return toUtf8String(data);
  } catch {
    try {
      return hexToString(data as `0x${string}`);
    } catch {
      return undefined;
    }
  }
}
