# Resources 与 Starter Kit 导览

## 官方 starter kit 已提供什么

位置：[starter-kit](starter-kit/README.md)

共同架构：Node.js 22+、TypeScript、一个共享 agent core、可切换 OpenAI/OpenRouter、离线类型检查和测试、submission checklist。

### Slack template

- OpenAI + CopilotKit Channels + Exa。
- 读取已有 thread、订阅后续消息、在原 thread 回复、原生 cards、带来源搜索。
- managed Slack channel，无需 public tunnel。
- 最适合：support handoff、团队研究、决策、incident 等“之前讨论内容很重要”的场景。
- 主要风险：需要 CopilotKit Intelligence 项目、Slack 安装、Channel Code、Exa key；账号设置链最长。

### Web template

- OpenAI + CopilotKit React + Ambiguous AI。
- 读取当前页面/selected record；frontend tools；generative UI；approval 后创建持久 record；刷新后 read-back。
- 最适合：CRM/project/customer/personal planning 等“当前页面就是上下文”的工作流。
- 相对稳妥：只需 web runtime，易录制；Ambiguous 集成还有专项奖。

### React Native template

- OpenAI 或 OpenRouter + CopilotKit React Native + Expo。
- 读取 app state、native card、用户点击 approval 后修改本地状态。
- 最适合：field checklist、inventory、travel、fitness、expense capture。
- 风险：mobile 有独立依赖和 simulator/device networking；物理手机的 localhost 不是电脑。

### 可选能力

- Web `/voice`：OpenAI Realtime（仍需 OpenAI key，独立于 chat provider）。
- Auth0：保护 API、服务身份与 scope。
- Ambiguous MCP：persistent workplace record。
- Remote MCP tools：可接共享 agent factory。
- Trigger.dev、Mozilla、Veris AI 是活动合作方，但当前 starter kit 的六个重点 sponsor guide 主要覆盖 OpenAI、CopilotKit、OpenRouter、Exa、Auth0、Ambiguous AI。

## 推荐选择顺序

1. **默认选 Web**：最短路径到稳定、可验证、可录制的完整交互；若自然使用 Ambiguous，还有专项奖。
2. **想法天然发生在多人 conversation 才选 Slack**：thread context 必须明显改变输出。
3. **手机状态或随手 approval 是核心才选 Mobile**：否则 simulator 成本不划算。
4. Voice/physical 只有在它是价值核心且有可靠 fallback 时采用。

## 官方公开链接清单

### Event

- [NYC 活动页](https://nyc.aitinkerers.org/p/agents-everywhere-beyond-the-chatbot-global-hackathon-with-openai)
- [NYC participant portal](https://nyc.aitinkerers.org/hackathons/h_2KGgllpHf_k)
- [NYC handbook](https://nyc.aitinkerers.org/hackathons/h_2KGgllpHf_k/handbook)
- [Global event page](https://aitinkerers.org/hackathons/global/agents-everywhere)
- [Credits & Offers（需登录/参会资格）](https://nyc.aitinkerers.org/hackathon-rewards/hrc_4720e4ed2ba8082ed3ca077732195d41)

### OpenAI / OpenRouter

- [OpenAI Agents SDK quickstart](https://openai.github.io/openai-agents-js/guides/quickstart/)
- [OpenAI API keys](https://platform.openai.com/api-keys)
- [OpenRouter quickstart](https://openrouter.ai/docs/quickstart)
- [OpenRouter keys](https://openrouter.ai/keys)
- [OpenRouter model catalog](https://openrouter.ai/models)

### CopilotKit

- [CopilotKit docs](https://docs.copilotkit.ai/)
- [Channels guide](https://copilotkit.ai/channels-guide.md)
- [CopilotKit Intelligence](https://intelligence.copilotkit.ai/)
- [OpenTag example](https://github.com/CopilotKit/OpenTag)
- [Event Discord technical channel](https://discord.com/channels/1122926057641742418/1548038338848489532)

### Exa / Auth0 / Ambiguous

- [Exa search API](https://exa.ai/docs/reference/search-api-guide)
- [Exa API keys](https://dashboard.exa.ai/api-keys)
- [Auth0 Node API quickstart](https://auth0.com/docs/quickstart/backend/nodejs)
- [Auth0 client credentials flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow/call-your-api-using-the-client-credentials-flow)
- [Ambiguous developer guide](https://www.ambiguous.ai/llms.txt)
- [Ambiguous authentication](https://www.ambiguous.ai/auth.md)
- [Ambiguous MCP guide](https://www.ambiguous.ai/agents/mcp)
- [Ambiguous disposable sandbox](https://www.ambiguous.ai/sandbox.md)
- [Ambiguous OpenAPI schema](https://app.ambiguous.ai/api/openapi.json)

## 本地状态与命令

```bash
cd "/Users/chen/Downloads/Agent Everywhere 2026/starter-kit"
npm run verify
```

已执行并通过。`.env` 已创建，但只包含 placeholder；不要把真实 keys commit。

Web：

```bash
npm run dev:web
```

Slack：

```bash
npm run channel:setup
npm run dev:slack
```

Mobile：先在根目录启动 web runtime，再到 `apps/mobile` 单独 `npm ci && npm start`。

## 依赖提醒

`npm ci` 报告 14 个依赖漏洞（11 moderate、2 high、1 critical）。不要赛前直接运行 `npm audit fix --force`，它可能造成 breaking changes。竞赛原型应保持 lockfile 可复现；如果项目要部署到公网或处理真实敏感数据，再单独审计和缓解。

