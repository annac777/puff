# Build Day Runbook（255 分钟）

## 到场前/开场 10:00–11:15

- 登录 portal，确认精确 submission deadline、team status、Credits & Offers、social tag 要求。
- 如果组队，优先找能补齐 surface/account/demo 的人，不按“人数越多越好”。
- 听 starter walkthrough，记录任何与当前 repo 不一致的新要求。
- 用 brainstorming matrix 选一个 idea；写下“不做”清单。
- 新建参赛 repo/branch，并在 README 明确记录 starter commit 与 inherited 部分。

## 11:15–12:00：Vertical slice

目标：硬编码/sample data 也可以，但完整路径必须跑通。

- Surface 收到真实/模拟 context。
- Agent 作出判断并调用一个 tool。
- 出现 native UI 或 proposal。
- 用户批准/拒绝。
- 产生可验证结果或状态变化。

## 12:00–13:15：真实集成

- 接通唯一最重要 sponsor/provider。
- 加真实 result ID、source link 或 read-back。
- 明确 sample data、local state 与 external write。
- 先处理认证失败、超时、空结果；再加第二个 capability。

## 13:15–14:15：评分证据

- Core：连续跑三遍 happy path。
- Theme：准备一句“移出这个环境会失去什么”。
- Technical：演示/测试一个 failure 或 decline path。
- Usefulness：把用户、节省的步骤与控制点放进 UI/文案。

## 14:15–15:00：Freeze + submission assets

- 停止扩 scope。
- 跑 `npm run verify` 和对应 build。
- 清理 secrets、console logs、个人数据。
- 完成项目 README、run instructions、inherited-vs-built-during-event。
- 填写 starter kit 的 `SUBMISSION.md`。
- 准备 video script 和 social post 草稿。

## 15:00–15:20：录两分钟视频

建议时间轴：

- 0:00–0:15：用户、痛点、环境。
- 0:15–0:35：展示 ambient context。
- 0:35–1:25：完整实时 interaction，包括 tool/action。
- 1:25–1:45：展示 result ID/read-back/native state。
- 1:45–2:00：为什么不是 chatbox、技术亮点、现场新建内容。

录制前关闭通知，使用干净 demo account，准备第二份本地录屏 backup。

## 15:20–16:00：提交

- 确认 GitHub public 且从干净 clone 可读懂。
- 视频链接无需登录即可播放。
- Description 对应四项评分，不夸大未实现能力。
- Social post 按 portal 的最新 sponsor tag 指示填写。
- 在截止前提交并截图/保存确认页。

## 最终 10 项检查

- [ ] 项目在目标环境内真正运行
- [ ] 环境 context 可见且影响结果
- [ ] 完整 action 有真实证据
- [ ] approval/decline/failure 至少一个可演示
- [ ] 连续跑三遍无阻断问题
- [ ] 无 secrets 或敏感数据
- [ ] public repo 可访问
- [ ] README 可复现
- [ ] 两分钟视频可访问
- [ ] portal submission 和 social post 完成

