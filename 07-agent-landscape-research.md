# Agent Landscape 调研：市场、研究前沿与 Hackathon 机会

调研时间：2026-09-12。重点不是罗列所有带 “agent” 名字的产品，而是判断哪些 interaction pattern 已经商品化、哪些仍在研究、哪些适合在 255 分钟里做出有辨识度的原型。

## Executive summary

当前 agent 市场已经从“会调用工具的聊天机器人”进入四个更难的竞争点：

1. **Situated context**：agent 是否真正理解当前 thread、page、record、device、room 与身份。
2. **Durable execution**：长任务能否 checkpoint、恢复、重试、跨小时/天工作。
3. **Trust boundary**：何时自动做、何时提案、何时要求批准，结果如何核验与审计。
4. **Native interaction**：不是另开 chatbox，而是在用户现有环境里用合适的 UI 和动作完成任务。

这正好与本届主题一致。最好的 hackathon 机会不是再造一个通用 browser/coding/research agent，而是选择一个很具体的“环境内决策时刻”，做出 context-aware、approval-gated、result-verifiable 的完整交互。

## 1. 已经商品化且非常拥挤的类别

### A. Coding agents

代表：OpenAI Codex、Claude Code/Agent SDK、Cursor、Devin，以及 IDE 内 agent。

已经具备：读写 repo、运行命令和测试、长时间任务、并行 agent、代码审查、sandbox、远程继续任务。OpenAI 报告 agent 使用正从短交互迁移到长时间委派任务；Anthropic 对约 40 万次 Claude Code sessions 的研究也显示，工作从修 bug 转向运行软件、数据分析与文档生产。

结论：不要做泛化“帮我写代码”的 agent。只有当它嵌入非常独特的工程环境或行业流程，例如实验设备、硬件 bring-up、incident room、regulated approval，才可能有新意。

来源：[OpenAI agents at work](https://openai.com/index/how-agents-are-transforming-work/)、[Claude Code usage research](https://www.anthropic.com/research/claude-code-expertise)、[Claude Agent SDK in Xcode](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)

### B. Browser/computer-use agents

代表：ChatGPT agent/computer use、Perplexity Comet、Manus，以及多种 GUI automation agent。

已经具备：浏览、点击、填表、跨网站研究、执行开放式任务。研究正在追求更长 horizon、更可靠的 GUI grounding 和跨 app 操作。

仍然薄弱：动态页面、权限、异步状态、prompt injection、不可逆 action、结果核验。2026 MobileWorldSafety 在 142 个 Android 风险任务上发现，六类 agent 面对环境注入仍有 40.4%–66.9% 的攻击成功率。

结论：不要只做“帮你上网点按钮”。更好的原型是把风险时刻识别、计划预览、用户批准和 post-action verification 变成核心体验。

来源：[Manus Agents API](https://open.manus.ai/docs/v2/agents-overview)、[Comet privacy and agent permissions](https://www.perplexity.ai/help-center/comet/en/articles/12867415-comet-assistant-privacy-data-use)、[MobileWorldSafety](https://arxiv.org/abs/2608.17659)

### C. Enterprise knowledge and workflow agents

代表：Salesforce Agentforce、Microsoft Copilot Studio、Glean Agents、HubSpot agents。

已经具备：企业搜索、CRM/service/sales/marketing actions、connectors、权限与管理、agent builder、voice/customer handoff。

结论：泛化 CRM enrichment、客服 FAQ、企业搜索已经高度拥挤。仍有空间的是“某个角色在某个 record 上必须做判断”的最后一公里，以及跨系统证据链、例外处理和可审计 handoff。

来源：[Salesforce Agentforce](https://help.salesforce.com/s/articleView?id=copilot_intro.htm&language=en_US&type=5)、[Microsoft customer engagement agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/customer-copilot-overview)、[Glean Agents](https://docs.glean.com/agents)、[HubSpot agent builder](https://www.hubspot.com/products/artificial-intelligence/ai-agents)

### D. Research/search agents

代表：Deep Research 类产品、Exa-powered research tools、Perplexity/Manus research workflows。

已经具备：自动拆解 query、搜索多来源、综合答案、引用、structured output。

结论：简单的“搜索并总结”没有差异化。要把搜索结果放进一个决策流程，例如从当前 support thread 提取争议点、搜索证据、生成可批准的 resolution artifact，并保存来源与决定。

## 2. 正在快速成熟的基础设施

### Long-running harness + sandbox

OpenAI 2026-09-10 发布 Agents API public beta，重点是 managed harness、可选计算环境、长 session、工具、subagents、hosted sandbox 和持久 artifacts。此前 Agents SDK 也已引入 memory、sandbox execution、snapshot/rehydration 与 MCP/skills/AGENTS.md 等 agent primitives。

含义：未来差异不会来自“我也写了一个 agent loop”，而来自 domain context、tools、interaction 和 verification。

来源：[OpenAI Agents API](https://openai.com/index/introducing-the-agents-api/)、[Agents SDK evolution](https://openai.com/index/the-next-evolution-of-the-agents-sdk/)

### MCP、A2A 与跨 agent 协作

MCP 正成为连接模型与 tools/data 的通用接口；Google A2A/ADK 强调跨语言 specialized agents。研究界则开始担忧 agent-agent interaction 在人类来不及监督前快速增长。

含义：多 agent 本身不再新颖。只有当角色边界、信息隔离、并发收益、冲突解决或验证机制可见时，才值得在 demo 中使用。

来源：[Anthropic MCP](https://docs.anthropic.com/en/docs/mcp)、[Google cross-language A2A](https://developers.googleblog.com/build-cross-language-multi-agent-team-with-google-agent-development-kit-and-a2a/)、[Anthropic multiagent research](https://www.anthropic.com/research/multiagent-systems)

### Deterministic workflow + probabilistic reasoning

Google ADK 2.0 明确主张：LLM 只负责需要认知判断的节点，routing、scheduling、retries、business rules 交给确定性 workflow。

含义：一个可靠的 hackathon agent 不应让 LLM 随意决定所有事情。用普通代码固定权限、写入边界、schema validation 和 idempotency，会比堆更多 prompts 更专业。

来源：[Why Google built ADK 2.0](https://developers.googleblog.com/why-we-built-adk-20/)

## 3. 研究前沿与尚未解决的问题

### A. Oversight 不是一个 Approve 按钮

研究把 oversight 分为事前控制、共同规划、实时监控和事后审查。另一项 computer-use 研究显示，plan-based oversight 可以减少问题 action 的发生，但“看到问题后能否及时干预”仍取决于危险时刻是否足够醒目。

机会：agent 主动识别“这里需要人类判断”，说明原因、展示差异和证据，而不是每一步都机械弹窗。

来源：[Human oversight in practice](https://arxiv.org/abs/2606.05391)、[Oversight strategies for CUAs](https://arxiv.org/abs/2604.04918)

### B. 环境内容本身是不可信输入

网页、Slack 消息、邮件和手机界面里都可能出现针对 agent 的恶意指令。当前移动 GUI agents 对 environmental injection 仍高度脆弱。

机会：区分 user instruction、environment evidence 和 external instruction；把被拒绝的可疑内容做成 demo 中的安全亮点。

### C. Embodied memory 需要时间和空间

普通 RAG 把记忆当文本流；具身 agent 需要按“是什么、在哪里、何时发生”检索。eMEM 等研究开始构建语义、空间和时间联合索引。

机会：field worker、活动现场、实验室、展厅、家庭等场景中，agent 记住“某处在某时发生过什么”，并在正确地点触发帮助。

来源：[eMEM](https://arxiv.org/abs/2606.03374)

### D. Always-on wearables 与 embodied agents

VisionClaw 用智能眼镜的第一视角持续感知并触发任务；HoverAI 探索结合无人机移动、视觉投影和对话的空间 agent。这些仍远未像 CRM/coding agents 那样成熟。

机会：不必真的造硬件，可以用手机 camera/voice 模拟“在房间里”的 situated interaction，但 demo 必须可靠并尊重隐私。

来源：[VisionClaw](https://arxiv.org/abs/2604.03486)、[HoverAI](https://arxiv.org/abs/2601.13801)

### E. Proactive agents 与 attention timing

真正有用的 ambient agent 不只是等待 prompt，而要判断何时出现、何时沉默、何时升级给人。市场产品在主动性上通常仍依赖预设 triggers；过度打扰和错误时机仍是明显空位。

机会：做“只在决策阈值跨过时出现”的 agent，并展示为什么它此刻介入。

## 4. 往届获奖案例复盘

详细项目列表见 [04-past-projects-and-strategy.md](04-past-projects-and-strategy.md)。综合多个公开 AI Tinkerers galleries/results，获奖 pattern 很稳定：

- CallFlow：confidence-based routing + verifier + human approval；胜在可规模化和责任边界。
- Toy Story 6：智能玩具服务患病儿童；环境和用户价值不可分离。
- AI Comrade for Laboratory Work：AR 中纠正实验步骤；context 是实时现场而非聊天框。
- Bones AI：agent-driven just-in-time UI；让 interface 随任务生成。
- Bitter Lessons：SRE incident 的 voice rubber-duck；角色和时刻极具体。
- Manim Math Tutor Agent：agent 生成可视化数学结果；两分钟 demo 记忆点强。
- 311 Agent：vision 输入连接城市服务流程；输入和现实结果直接。

获奖作品并不一定技术栈最复杂。它们通常在 20 秒内就能解释“谁在什么地方遇到什么问题”，并在 demo 中留下一个可验证 artifact。

来源：[Humans-in-the-Loop results](https://sf.aitinkerers.org/hackathons/h_tV5wkIy3tdE/results)、[NYC Realtime Voice gallery](https://nyc.aitinkerers.org/hackathons/h_q2ugc3T5gts/all_entries)、[NYC Generative UI gallery](https://nyc.aitinkerers.org/hackathons/h_Y-vxS47Mi6I/all_entries)、[NYC project gallery](https://nyc.aitinkerers.org/hackathons/h_ISn8ZWCpyCE/all_entries)

## 5. 已经太拥挤，除非有强 twist

- 通用旅行规划 agent。
- 通用 email/calendar assistant。
- 搜索 + 摘要网页。
- 上传 PDF 后问答。
- 通用会议总结/待办提取。
- 普通客服 chatbot。
- “多个 agent 讨论后给答案”，但没有必要的角色隔离和验证。
- Browser agent 自动填表，但没有风险识别、approval 和 result verification。
- 把现有 starter incident 换皮。

## 6. 更值得 brainstorm 的机会空位

### 机会 1：Decision-critical moment agent

它不持续聊天，只在 Slack/page/workflow 中检测到真正需要人判断的时刻出现，展示上下文冲突、外部证据、建议 action 和风险；批准后留下 decision record。

为什么有空间：市场重视 automation，但“什么时候不自动化”仍很弱。与 oversight 研究和本届环境主题高度一致。

### 机会 2：Handoff integrity agent

面向 shift work、活动运营、实验室、维修、医疗非诊断性准备或现场销售，把 thread/voice/photo/page context 整理成结构化 handoff；接收方确认遗漏后再保存。

为什么有空间：不是总结，而是验证交接完整性、显示 missing evidence、追踪责任和 read-back。

### 机会 3：Exception-native agent

不是处理 happy path，而是专门处理订单、support、deployment、compliance 或现场任务中的例外。Agent 搜索规则/证据、提出两种 resolution、解释 trade-off，用户批准后创建可追踪任务。

为什么有空间：企业 agent 已覆盖常规流程，但例外仍需要人；两分钟 demo 很容易形成戏剧性。

### 机会 4：Spatial/temporal memory assistant

用手机/浏览器模拟现场记录，让 agent 回答“上次在这个位置/设备/客户处发生了什么”，并基于时间和地点生成下一步检查。

为什么有空间：比普通 conversation memory 更贴合 “Agents, Everywhere”，研究前沿明确但商品化尚早。

### 机会 5：Environmental prompt-injection shield

嵌入 browser/Slack agent，识别来自页面或消息中的可疑 agent-directed instructions，把它们作为不可信证据隔离，并在真正 action 前呈现来源与风险。

为什么有空间：是当前 GUI agents 的真实未解问题，技术执行和 trust demo 都强；但必须做出正常任务仍能完成的 end-to-end experience，不能只做检测器。

## 7. 对我们项目的建议排序

在尚未知道你最熟悉的行业/用户前，我会这样排：

1. **Exception-native Web agent**：最稳，直接复用 Web starter、CopilotKit、OpenAI、Exa、Ambiguous；易录视频、可竞争专项奖。
2. **Decision-critical Slack agent**：主题最贴，能充分利用 thread context 和 Exa source cards；但账号与 Slack setup 更复杂。
3. **Handoff integrity mobile/web agent**：用户价值强，若你有真实场景会非常出彩。
4. **Prompt-injection-aware agent**：技术辨识度高，但需要把安全能力包装进有用 workflow。
5. **Spatial memory/room agent**：最独特，也最容易因 camera、设备或状态管理拖慢现场。

默认推荐不是“通用 web research agent”，而是：

> **在某个异常 record 页面里，agent 利用当前页面 context 和 Exa 证据，识别需要人判断的关键点，生成两种可审查方案；用户批准后写入 Ambiguous，刷新页面仍能找到相同 decision record。**

它同时覆盖本届四项评分：可运行、环境不可替代、真实集成、明确用户控制与可验证结果。

## 8. Brainstorm 时应回答的五个问题

1. 你本人最熟悉的真实角色/行业是谁？
2. 这个人在哪个 app、thread、页面或现场做决定？
3. 哪个 context 是普通 chatbox 拿不到的？
4. Agent 最终创建或改变什么可验证 artifact？
5. 哪个危险/不确定时刻必须由人批准？

只要这五个答案确定，语言、模型和 sponsor 选择通常会自然落定。

