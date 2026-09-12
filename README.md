# Agents, Everywhere — NYC Hackathon Prep

> **时间敏感提醒：** 官方纽约活动页显示活动为 **2026-09-12（周六）10:00–17:00 EDT**，不是 9 月 13 日。地点仅在申请获批后显示。请立即登录 AI Tinkerers 或检查 acceptance 邮件确认地址。

这是赛前准备目录。为了符合资格要求，这里只放官方 starter kit、调研、选择框架和提交模板；**不要在官方 build window 前实现参赛项目的核心功能**。

## 从这里开始

1. 阅读 [01-event-brief.md](01-event-brief.md) — 规则、赛程、评分、奖项。
2. 用 [02-brainstorm.md](02-brainstorm.md) — 先自己发散，再按评分表收敛。
3. 阅读 [03-resources-and-starter-kit.md](03-resources-and-starter-kit.md) — 官方资源、starter kit、各模板取舍。
4. 阅读 [04-past-projects-and-strategy.md](04-past-projects-and-strategy.md) — 往届获奖作品与胜出模式。
5. 到场后照 [05-build-day-runbook.md](05-build-day-runbook.md) 执行。
6. 如果想法需要实时搜索，阅读 [06-exa-quick-reference.md](06-exa-quick-reference.md)。
7. 阅读 [07-agent-landscape-research.md](07-agent-landscape-research.md) — 市场、研究前沿、拥挤赛道与机会空位。
8. 用 [08-agent-use-case-funnel.md](08-agent-use-case-funnel.md) — 先判断哪些真实时刻需要 Agent，再从生活、工作和交流中收敛到 niche。
9. 官方代码位于 [starter-kit](starter-kit/README.md)，依赖已安装，根目录离线验证已通过。

## Current MVP

The selected implementation prototype is **Adaptive Break / Off-Ramp Agent**. Its loadable Manifest V3 extension lives in [extension](extension), with product, privacy, collaboration, testing and demo documentation in [docs](docs). Run `npm test` from this directory for the local decision-policy checks.

Design and engineering should use [docs/interaction-scenarios.md](docs/interaction-scenarios.md) as the shared Figma-to-code scenario contract.

The next milestone is the full agentic loop: understand the user's current work, understand schedule constraints, choose an appropriate intervention moment, ask permission, complete one bounded task during the break, and report back. The task menu and approval boundaries are defined in [docs/product-brief.md](docs/product-brief.md).

## 当前准备状态

- [x] 官方活动页、handbook、赛程、评分和奖项已核对
- [x] 官方 starter kit 已 clone
- [x] 根目录 `.env` 已由 `.env.example` 创建（没有填入任何密钥）
- [x] `npm ci` 已完成
- [x] `npm run verify` 已通过：类型检查及 93 个离线测试全部通过
- [ ] 登录 Credits & Offers 页面并兑换/记录 credits（仅参会者可见）
- [ ] 确认 acceptance、会场地址及到场方式
- [ ] 选择项目想法、队友和唯一主 surface
- [ ] 配置明天实际要用的账号和 API keys

## 关键原则

最强策略不是“集成最多 sponsor”，而是：**一个明确用户 + 一个原生环境 + 一个完整动作 + 一个可见且可验证的结果**。环境必须改变 agent 能看到什么或能做什么；如果把它搬回普通聊天框仍完全一样，主题契合度不会高。
