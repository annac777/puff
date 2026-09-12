# 往届项目观察与胜出策略

我查看了 AI Tinkerers 公开 project galleries/results，重点看 NYC 和近期 agent 类比赛。以下不是本届题目答案，而是可复用的胜出模式。

## 有代表性的获奖项目

| 项目 | 成绩 | 为什么值得看 |
|---|---|---|
| CallFlow | Humans-in-the-Loop 全球 1st | confidence routing + verifier + 人工审批；把 human control 放进核心架构，而非装饰 |
| Toy Story 6 | 全球 2nd | edge AI 玩具陪伴白血病儿童；环境/硬件与价值高度绑定，影响力明确 |
| AI Comrade for Laboratory Work | 全球 3rd | AR/agent 在实验步骤中纠错；“在场景里”比 chat 更必要 |
| Bones AI | NYC 1st | agent-driven just-in-time UI；让界面随 agent/任务生成，主题和交互都突出 |
| Agent-Mon | NYC 2nd | agentic + urban/spatial 应用，context 明显不是普通文本聊天 |
| Immersive Gallery | NYC 3rd | 多模态 taste building，视觉体验易在 demo 中形成记忆点 |
| Bitter Lessons | NYC voice 1st | 面向 SRE incident 的 realtime voice rubber-duck；用户和任务极具体 |
| Bellhop | NYC voice 2nd | luxury resort staff 工具；清晰 vertical、明确现场角色 |
| Ensure | NYC voice 3rd | 医疗紧急情况下替用户联系保险方并保留 evidence；行动链与结果都可展示 |
| track/analyze-food! | NYC 1st | 日常场景、视觉/数据 context、动作短而完整 |
| command line trainer | NYC 2nd | 小而清楚、交互立即可见，不靠宏大叙事 |
| Manim Math Tutor Agent | NYC 1st | agent + MCP + 可视化数学输出，结果非常适合视频展示 |
| 311 Agent | NYC vision 1st | CV 连接真实城市服务场景；输入和现实 action 明确 |

## 反复出现的强模式

1. **具体 vertical 胜过通用助手。** “给谁、在何时、解决哪一步”一句话就能懂。
2. **环境是功能，不是包装。** Thread history、current record、camera/voice/room signal 会改变 agent 行为。
3. **结果可见。** Native card、生成动画、ticket/record ID、页面 read-back、物理反馈都比文字宣称更强。
4. **有可信边界。** Confidence threshold、人工批准、取消、evidence、reconciliation 都能同时提升技术与体验评分。
5. **两分钟能演清楚。** 一个输入、一次 context reveal、一个 action、一个 result；复杂架构只在最后一句点到。

## 对本届的推论

最有潜力的 idea 应该同时满足：

- 环境提供一项 chatbox 拿不到的 ambient context。
- agent 不只回答，而是生成/更新/协调一个真实 artifact。
- 有一次明确的 user control（approve/decline/edit）。
- action 后能 read-back 或看到稳定状态变化。
- 无网络/账号失败时仍能以 sample fixture 演示主体验，但必须如实标注。

## 三种可用于启发的方向（不是替你定题）

### A. “在讨论里”的决策记忆 agent（Slack）

读取 thread 中争论与约束，自动形成 decision record、未决问题和 evidence links；经 thread 参与者批准后写入 workspace。关键不是总结，而是让后续消息更新同一个 decision artifact。

### B. “在页面里”的 exception closer（Web）

用户打开一个异常订单/客户/项目记录时，agent 读取当前 record 和历史动作，提出一个可审查的下一步；批准后创建持久 follow-up，并刷新可见。可把 domain 换成你熟悉且有真实痛点的场景。

### C. “在现场”的 handoff agent（Mobile/voice）

现场工作人员用极短输入/照片/语音记录状态，agent 结合设备/任务 context 生成结构化 handoff，并要求确认后更新共享记录。适合活动运营、物业、实验室、维修、field sales 等。

这些方向只有在你能提供真实用户洞察时才值得做；否则从你自己最近一周重复遇到的工作摩擦出发会更强。

