import { useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useChainId, useChains } from 'wagmi';
import { Badge } from './components/Badge';
import SaturdaySection from './sections/SaturdaySection';
import SundayRedPacketPage from './sections/SundayRedPacketPage';
import { formatAddress } from './utils/format';
import { ArrowDown, ArrowRight, Sparkles, Wallet } from 'lucide-react';

type Route = '/' | '/redpacket';

function normalizePath(pathname: string): Route {
  if (pathname.startsWith('/redpacket')) return '/redpacket';
  if (pathname.startsWith('/send')) return '/redpacket';
  if (pathname.startsWith('/grab')) return '/redpacket';
  return '/';
}

function useSpaRoute() {
  const [path, setPath] = useState<Route>(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePop = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (to: Route | string) => {
    const next = normalizePath(to);
    const url = typeof to === 'string' && to.includes('?') ? to : next;
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPath(next);
  };

  return { path, navigate };
}

function Header({
  displayName,
  activeChain,
  address,
  onNavigate
}: {
  displayName: string;
  activeChain?: { name?: string };
  address?: `0x${string}`;
  onNavigate: (to: Route | string) => void;
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-slate-950/70 border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 flex items-center justify-center text-xl font-black shadow-lg shadow-fuchsia-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">链上数据 & 红包实验室</p>
            <p className="text-xs text-slate-400">红包 H5：/redpacket（Tab 切换发/抢）</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/redpacket?tab=send')}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-white border border-white/10 hover:bg-white/10"
          >
            发红包
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onNavigate('/redpacket?tab=grab')}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/30"
          >
            抢红包
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {address && (
            <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/5">
              <Wallet className="h-5 w-5 text-fuchsia-200" />
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
  );
}

function Home({
  onNavigate
}: {
  onNavigate: (to: Route | string) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 pb-24">
      <section className="py-10 md:py-16 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-fuchsia-100 border border-white/10">
          <ArrowDown className="h-4 w-4" />
          双入口：首页 / 周六作业 + 红包 H5
        </div>
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              数据上链对比 + 链上红包 <span className="text-fuchsia-400">H5 红包页</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              周日红包作业抽成单独 H5 路由 /redpacket，Tab 切换“发红包 / 抢红包”，手机端体验更佳。保留周六上链作业。
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge label="Ethers.js" />
              <Badge label="RainbowKit" />
              <Badge label="The Graph" />
              <Badge label="Sepolia" />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('/redpacket?tab=send')}
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/40 active:scale-[0.99]"
              >
                进入发红包（/redpacket）
              </button>
              <button
                onClick={() => onNavigate('/redpacket?tab=grab')}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 active:scale-[0.99]"
              >
                进入抢红包（/redpacket）
              </button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-slate-900 px-5 py-6 shadow-xl shadow-orange-500/10">
              <p className="text-sm text-slate-100">H5 路由：/redpacket</p>
              <p className="mt-2 text-xl font-semibold">发红包表单</p>
              <p className="mt-1 text-sm text-slate-200/80">金额 + 个数，移动端样式，交易确认提示</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-600/20 to-slate-900 px-5 py-6 shadow-xl shadow-fuchsia-500/10">
              <p className="text-sm text-slate-100">H5 路由：/redpacket</p>
              <p className="mt-2 text-xl font-semibold">抢红包 + 事件回显</p>
              <p className="mt-1 text-sm text-slate-200/80">实时监听 + Graph 数据流</p>
            </div>
          </div>
        </div>
      </section>

      <section id="saturday" className="scroll-mt-24">
        <SaturdaySection />
      </section>
    </div>
  );
}

function App() {
  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const activeChain = chains.find((c) => c.id === chainId);
  const { data: ensName } = useEnsName({ address, chainId: 1 });
  const { path, navigate } = useSpaRoute();
  const displayName = useMemo(() => ensName || (address ? formatAddress(address) : '未连接'), [ensName, address]);
  const isH5 = path === '/redpacket';

  let content: JSX.Element;
  if (path === '/redpacket') {
    content = <SundayRedPacketPage onBack={() => navigate('/')} />;
  } else {
    content = <Home onNavigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header displayName={displayName} activeChain={activeChain} address={address} onNavigate={navigate} />
      <main className={isH5 ? 'pb-6' : ''}>
        {content}
      </main>
    </div>
  );
}

export default App;
