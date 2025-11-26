周六作业和周日作业都放到这个项目中，在首页展示不同的入口

🔥周六作业（数据上链：两种方式）

目标：完成一个完整的前端 DApp，演示两种上链方式，并对比读取方式。

🧱 功能要求

📌 右上角集成钱包操作
技术栈：
	•	wagmi + RainbowKit（推荐）

📌 2 种数据上链方式 + 可读回数据：


🥇方式一：直接转账写入链上（不写合约）
	•	前端构造一笔交易（可转 0 ETH）
	•	在 transaction.data 字段里写入自定义数据（文本或哈希）
	•	不需要自己写合约

✔ 使用 ethers.js 写入
✔ 使用  Alchemy 的 JsonRpcProvider 读取交易内容

需要展示：

数据展示项	说明
收款地址	可固定为自己钱包
交易哈希	点链接可跳转到 Etherscan
data 解码前/后	原始 Hex + 转换 string


🥈方式二：通过合约 + 事件日志写入链上
	•	写一个简单合约，只通过 event 存数据（不写 storage）
	•	部署到测试链（Sepolia 推荐）
	•	前端调用 store("xxx") 发消息记录

✔ 数据通过 emit 写入链上
✔ 使用 The Graph 查询日志数据
✔ 前端展示 地址 + 数据 + 时间

⸻

📌读数据规范

类型	使用
直接转账写入的数据	使用 ethers + Alchemy 查询
通过事件写入的数据	使用 The Graph + GraphQL 查询

读写对比展示重点：没有事件无法用 The Graph 监听；使用事件可高效索引。

⸻

🎯其他功能
	•	初次进入页面自动回显历史数据（不是只监听实时）
	•	本地 UI 表格排序 / 时间格式化
	•	事件实时监听（contract.on）增强体验

⸻

⸻

🧧周日作业（链上抢红包系统）

目标：实现一个完整可交互的“链上抢红包 DApp”并部署开源。

🧱 功能要求

📌 顶部导航栏要求：
	•	显示钱包切换按钮（RainbowKit / etc.）
	•	显示钱包地址 & ENS Name（如果没有 ENS，显示短地址）

📌 红包智能合约（建议默写，实现以下逻辑）

功能	描述
发红包	sendRedPacket(totalAmount, count) 红包数量 + 金额
抢红包	grab() 随机或平均领取
状态检查	红包抢完、是否已经抢过
事件通知	抢红包成功/失败、红包抢完

应包含至少以下事件：

event PacketSent(address indexed sender, uint256 amount, uint256 count);
event GrabSuccess(address indexed user, uint256 amount);
event GrabFailed(address indexed user, string reason);
event PacketFinished(); // 红包被抢完时触发

📌 前端要求：

页面美观，扁平化风格，国际范儿

角色 UI	功能
发红包界面	输入金额 + 个数，发送红包
抢红包界面	显示剩余红包数量，点击“抢红包”
交互提示	通过事件反馈：“抢到了”、“已经抢过”、“抢完啦”
可视化	抢红包记录列表（监听事件/Graph 查询都可）

📌 必须部署到测试链（Sepolia）
并作为开源作品（GitHub仓库 + README）

⸻

🎯加分功能
	•	红包随机金额分配算法（如二倍均值法）
	•	使用 The Graph 显示抢红包排行榜
	•	UI 使用动画提示（如“雨落红包效果”）
	•	ENS 名称反查 + 头像展示

⸻
