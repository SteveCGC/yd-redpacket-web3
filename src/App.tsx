import { useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useEnsAvatar, useChainId, useChains } from 'wagmi';
import { formatAddress } from './utils/format';
import SaturdaySection from './sections/SaturdaySection';
import SundaySection from './sections/SundaySection';
import { Badge } from './components/Badge';
import { ArrowDown, ExternalLink, Sparkles, Wallet } from 'lucide-react';

function App() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const activeChain = chains.find((c) => c.id === chainId);
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { data: ensAvatar } = useEnsAvatar({ address, chainId: 1 });

  const displayName = useMemo(() => ensName || (address ? formatAddress(address) : '未连接'), [ensName, address]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-20 backdrop-blur bg-slate-950/70 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center text-xl font-black shadow-lg shadow-fuchsia-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">链上数据 & 红包实验室</p>
              <p className="text-xs text-slate-400">周末双作业：上链数据 + 抢红包</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {address && (
              <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/5">
                {ensAvatar ? <img src={ensAvatar} className="h-7 w-7 rounded-full" /> : <Wallet className="h-5 w-5 text-fuchsia-200" />}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{displayName}</span>
                  <span className="text-[11px] text-slate-400">链：{activeChain?.name ?? '未选择'}</span>
                </div>
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-fuchsia-100 border border-white/10">
                <ArrowDown className="h-4 w-4" />
                双入口首页：选择周六 or 周日作业
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                数据上链对比 + 链上抢红包 <span className="text-fuchsia-400">全功能 DApp</span>
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed">
                演示两种写入链上方式（原生交易 & 合约事件），使用 Alchemy / The Graph 读取。并集成 Sepolia 红包合约，可发红包、抢红包、事件回显与排行榜。
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge label="Ethers.js" />
                <Badge label="RainbowKit" />
                <Badge label="The Graph" />
                <Badge label="Sepolia" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <a href="#saturday" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-6 shadow-xl shadow-fuchsia-500/10 hover:-translate-y-1 transition">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">周六作业</p>
                  <ExternalLink className="h-4 w-4 text-fuchsia-300 group-hover:text-white" />
                </div>
                <p className="mt-2 text-xl font-semibold">数据上链 + 读取</p>
                <p className="mt-1 text-sm text-slate-400">转账 data vs 事件日志，自动回显</p>
              </a>
              <a href="#sunday" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-600/20 to-orange-500/10 px-5 py-6 shadow-xl shadow-orange-500/20 hover:-translate-y-1 transition">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">周日作业</p>
                  <ExternalLink className="h-4 w-4 text-orange-200 group-hover:text-white" />
                </div>
                <p className="mt-2 text-xl font-semibold">链上抢红包系统</p>
                <p className="mt-1 text-sm text-slate-100/80">发红包、抢红包、事件提示</p>
              </a>
            </div>
          </div>
        </section>

        <section id="saturday" className="scroll-mt-24">
          <SaturdaySection />
        </section>

        <section id="sunday" className="scroll-mt-24">
          <SundaySection />
        </section>
      </main>
    </div>
  );
}

export default App;
