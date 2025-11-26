# 链上数据 & 红包 DApp

周六、周日作业合并的前端。首页提供两个入口：
- 周六：原生交易 data 写入链 + 合约事件写入，对比读取方式（Alchemy RPC vs The Graph）
- 周日：链上抢红包，包含发红包、抢红包、事件反馈与 Graph 排行

## 快速开始

```bash
pnpm install # 或 npm / yarn
pnpm dev
```

> 需要 Node 18+。

## 环境变量

复制 `.env.example`：

```bash
cp .env.example .env
```

填入：
- `VITE_WALLETCONNECT_ID`：RainbowKit/WalletConnect 项目 ID
- `VITE_ALCHEMY_ID`：Alchemy API Key（用于读取交易）
- `VITE_MESSAGE_CONTRACT`：周六事件合约地址（Sepolia）
- `VITE_GRAPH_ENDPOINT_SATURDAY`：事件日志的 GraphQL endpoint
- `VITE_DEMO_TX_HASH`：可选，用于初次加载自动回显一笔交易
- `VITE_REDPACKET_CONTRACT`：红包合约地址（Sepolia）
- `VITE_GRAPH_ENDPOINT_REDPACKET`：红包事件的 GraphQL endpoint

## 功能对照

### 周六：数据上链
- **方式一（原生交易）**：0 ETH 转账 + data 字段写入文本；展示 tx hash、Etherscan 链接、data 原文与解码结果；使用 Alchemy Provider 读取。
- **方式二（合约事件）**：调用 `store(string)` emit 事件；实时 `useContractEvent` 监听；GraphQL 查询历史 20 条；本地表格展示地址 + 文本 + 时间。
- 自动回显：配置 `VITE_DEMO_TX_HASH` 或 Graph endpoint 后，进入页面即可看到历史数据。

### 周日：抢红包
- 导航显示连接的钱包地址 / ENS。
- 发红包：输入金额与个数，调用 `sendRedPacket(totalAmount,count)`（附带 msg.value）；等待确认提示。
- 抢红包：调用 `grab()`，按钮根据是否已抢过状态禁用。
- 状态栏：显示剩余红包、总个数；事件实时监听 `PacketSent`/`GrabSuccess`/`GrabFailed`/`PacketFinished`。
- 记录列表：Graph 查询历史抢红包成功记录 + 实时事件流。
- Etherscan 链接基于当前链（Sepolia 默认）。

## 开发提示
- 样式：Tailwind + 自定义渐变玻璃拟态。
- 技术栈：Vite + React + TypeScript + wagmi + RainbowKit + ethers + The Graph。
- 如果你的合约 ABI 不同，请调整 `src/abi/messageLog.ts` 与 `src/abi/redPacket.ts`。

## 目录
- `src/sections/SaturdaySection.tsx`：周六功能
- `src/sections/SundaySection.tsx`：周日功能
- `src/abi/`：合约 ABI
- `src/walletConfig.ts`：wagmi / RainbowKit 配置

## TODO / 可扩展
- 补充自动化测试或 Storybook 展示
- 根据实际部署的子图 schema 调整 GraphQL 查询字段
- 加入红包金额分配算法可视化与排行榜动画
