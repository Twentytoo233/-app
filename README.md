# VoyageMaster AI (远航大师) - 智能出行全方位建议应用

VoyageMaster AI 是一款基于 Google Gemini 系列大模型构建的下一代智能出行管理平台。它不仅是一个行程规划器，更是一个融合了实时数据分析、多模态视觉处理、企业级合规审计以及协同办公能力的个人差旅助手。

## 🌟 核心功能

### 1. 全链路行程逻辑规划 (Full-Link Logistics)
- **智能策略生成**：输入出发地、目的地及日期，AI 将生成包括从家门口到候机楼、安检流程、主程交通（航班/高铁）以及抵达后末端交通的完整时间轴。
- **实时情报整合**：结合 Google Search 实时获取天气预报、目的地交通卡办理建议及插座标准。
- **企业合规检查**：内置差旅标准验证，自动标记不符合企业报销政策的预定项。

### 2. 沉浸式旅游探索指南
- **AI 视频预告**：利用 Google Veo 技术，为目的地生成 720p 电影级视觉混剪视频。
- **个性化行程定制**：支持“经典路线”与“小众探索”切换，根据用户兴趣（如：艺术、美食、摄影）生成 3 天深度游建议。
- **地图深度整合**：所有景点均通过 Google Maps 实时验证，提供经纬度坐标与实用旅游贴士。

### 3. 企业商务中心 (Business Hub)
- **合规性仪表盘**：实时可视化显示行程的政策合规得分。
- **费用自动汇总**：AI 自动分析账单分布（交通、酒店、餐饮），并生成专业、可直接用于报销的执行摘要。
- **行程优化方案**：根据抵达时间和会议安排，AI 自动建议最合理的商务日程，减少时差与转场疲劳。

### 4. 智能出行工具箱 (Smart Toolkit)
- **视觉 AI 翻译**：支持拍照识别（如菜单、路牌、文档），即时翻译成目标语言并进行语义总结。
- **行李智能助手**：基于目的地天气、行程时长及出行目的，生成动态打包清单。
- **全球签证助手**：实时查询不同护照持有者的入境要求与最新签证动态。
- **生存短语库**：针对医疗、求助、交通等紧急场景提供地道的外语表达。

### 5. 多人协同与财务拆分
- **实时同步清单**：支持多人共同管理行程任务（预定、研究、采购）。
- **智能债务结算**：针对多人出行产生的共享支出（如酒店、餐饮），AI 自动计算最优转账方案，解决“谁欠谁钱”的问题。

### 6. AI 语音助理 (Live Assistant)
- **实时语音交互**：基于 Gemini Live API，提供低延迟的语音问答体验。
- **情景意识**：助理可根据当前的行程上下文，在语音对话中提供针对性的建议。

## 🛠 技术架构

- **前端框架**：Next.js 15 + React 19
- **后端框架**：Next.js API Routes
- **样式处理**：Tailwind CSS (响应式设计 & 动画)
- **图标系统**：Lucide-React
- **核心 AI 引擎**：
  - `gemini-3-pro-preview`：复杂推理与代码处理。
  - `gemini-3-flash-preview`：快速文本生成与多模态翻译。
  - `gemini-2.5-flash`：Google Maps 地图搜索与实时接地。
  - `gemini-2.5-flash-native-audio-preview-12-2025`：低延迟语音交互。
  - `veo-3.1-fast-generate-preview`：高质量视频生成。
- **数据可视化**：Recharts
- **安全与合规**：API Key 安全存储在后端环境变量中，前端通过 API 路由调用，确保密钥不会泄露。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件（不要提交到 Git）：

```env
# Gemini API Key - 只在后端使用，不会暴露到前端
GEMINI_API_KEY=your_gemini_api_key_here

# Next.js 环境变量（可选）
NEXT_PUBLIC_APP_NAME=VoyageMaster AI
```

**重要安全提示**：
- `GEMINI_API_KEY` 只会在服务器端使用，不会暴露到客户端
- 确保 `.env.local` 文件已添加到 `.gitignore` 中
- 不要在前端代码中直接使用 `process.env.GEMINI_API_KEY`

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 🔒 安全说明

本项目采用前后端分离架构，确保 API Key 安全：

1. **后端 API 路由**：所有 Gemini API 调用都在 `/app/api/gemini/route.ts` 中处理
2. **环境变量**：`GEMINI_API_KEY` 只存在于服务器端环境变量中
3. **前端调用**：前端通过 `/api/gemini` 路由调用后端，不直接访问 Gemini API
4. **Live Assistant**：实时音频流功能通过 `/api/gemini/live` 路由获取配置

## 📁 项目结构

```
远航大师/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（后端）
│   │   └── gemini/        # Gemini API 代理
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/             # React 组件
├── services/              # 服务层
│   ├── geminiService.ts   # Gemini API 调用（调用后端）
│   └── i18n.ts            # 国际化
├── types.ts               # TypeScript 类型定义
└── package.json           # 依赖配置
```

## 🌐 使用说明

1. **配置密钥**：确保 `.env.local` 中已配置 `GEMINI_API_KEY`
2. **选择语言**：通过顶栏切换按钮在"中文"与"English"之间切换界面
3. **开始规划**：在 "Trip Planner" 模块输入您的下一站目的地

---
*VoyageMaster AI - 每一段旅程都值得被精准规划。*
