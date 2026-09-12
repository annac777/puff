# Exa 现场速查表

来源：用户提供的 Exa Codex + JavaScript Setup Guide。其 canonical reference 是 [Search API Guide for Coding Agents](https://docs.exa.ai/reference/search-api-guide-for-coding-agents)。若实际 API 行为或参数与本页冲突，以 canonical reference 为准。

## 它适合本届比赛的什么场景

Exa 适合 agent 必须寻找外部最新证据的流程，例如：

- Slack thread 中的讨论需要外部资料核验。
- 当前网页记录需要补充公司、产品、政策或技术信息。
- Agent 要返回可以点开的 sources，而不只是生成一段答案。
- Demo 需要清楚展示“环境上下文 → 定向搜索 → 带来源结果”。

如果核心 workflow 不需要外部搜索，不要为了 sponsor 数量强行加入 Exa。

## 最推荐的默认配置

```text
type: auto
numResults: 5–10
contents.highlights: true
```

原因：速度约一秒、相关性与延迟平衡、highlights 对 agent 上下文更省 token。先从 raw results 开始；只有确实需要 Exa 直接综合 JSON 时才加 `outputSchema`。

## JavaScript / TypeScript 最小接入

安装：

```bash
npm install exa-js@2.14.0
```

环境变量：

```dotenv
EXA_API_KEY=your-key
```

代码：

```typescript
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

const response = await exa.search("your focused query", {
  type: "auto",
  numResults: 5,
  contents: { highlights: true },
});

for (const result of response.results) {
  console.log(result.title, result.url, result.highlights);
}
```

不要把 API key 写进源码、前端 bundle、公开 GitHub、log 或录屏。

## 与官方 starter kit 的关系

- 现有 [Slack template](starter-kit/apps/channel/README.md) 已经内置 Exa 搜索和 source cards，使用 TypeScript；优先复用它，不需要重复安装或重写集成。
- 如果选 Slack，优先沿用现有 `apps/channel/src/search.tsx` 和 `search_web` tool，减少现场集成时间。
- 如果项目最终必须使用 Python backend，再参照 Exa Python SDK；当前官方 starter kit 不需要 Python。
- Starter kit 当前示例环境变量还支持 `EXA_SEARCH_TYPE=fast`；如果 demo 对速度敏感可用 `fast`，否则材料建议从 `auto` 开始。

## 搜索模式怎么选

| 类型 | 适用情况 | 约略延迟 |
|---|---|---:|
| `instant` | voice、autocomplete、极快 lookup | ~250 ms |
| `fast` | 对延迟敏感且仍需相关性 | ~450 ms |
| `auto` | 默认选择，速度和相关性平衡 | ~1 s |
| `deep-lite` | 比完整 deep 更便宜的综合 | ~4 s |
| `deep` | 多来源研究、比较、结构化综合 | ~4–15 s |
| `deep-reasoning` | 多步复杂研究 | ~12–40 s |

Hackathon 建议：主 demo path 用 `auto` 或 `fast`；不要把 12–40 秒的 deep-reasoning 放在两分钟视频的关键路径。

## Raw retrieval 与 structured synthesis

### Raw retrieval：优先使用

让你的 agent 检查 `results`、读取 highlights，并自行生成答案。优点是可控、可展示 source cards、失败容易解释。

```json
{
  "query": "focused question",
  "type": "auto",
  "numResults": 5,
  "contents": { "highlights": true }
}
```

### Structured synthesis：需要稳定字段时使用

在 `/search` 上添加 `systemPrompt` 与 `outputSchema`。`output.content` 返回符合 schema 的 JSON，`output.grounding` 自动提供字段级 citations/confidence。

限制：schema 最深 2 层、最多 10 个 properties。不要自行在 schema 中添加 citation 或 confidence 字段。

适合：company enrichment、产品比较、结构化 research cards。Demo 中最好同时展示 grounding links。

## Content 选择

- `highlights: true`：默认，相关片段，最省上下文。
- `text: {maxCharacters: 20000}`：需要全文/RAG 时使用，务必设上限。
- `summary: true` 或 `summary: {query: "..."}`：需要每条结果的摘要时使用。

从一种模式开始；不要一上来同时请求 highlights、text、summary。

## Freshness

`contents.maxAgeHours` 控制缓存新鲜度：

- 省略：推荐默认，平衡缓存与 livecrawl。
- `24`：每天更新。
- `1`：接近实时。
- `0`：强制 livecrawl，最慢，仅在缓存确实不可用时使用。
- `-1`：只用缓存，适合静态/历史材料。

## 三个 endpoint

- `/search`：寻找页面，并可同时获取内容；本届最常用。
- `/contents`：已经有 URL，只需抽取或刷新内容。
- `/answer`：question-first UI，直接得到带引用答案；如果需要检查 raw results 或控制 retrieval，仍优先 `/search`。

## 常见参数错误

- 不要使用 deprecated `useAutoprompt`。
- 没有 `includeUrls` / `excludeUrls`；使用 `includeDomains` / `excludeDomains`。
- `/search` 的 `text`、`summary`、`highlights` 必须放在 `contents` 中。
- `numSentences`、`highlightsPerUrl` 已 deprecated；用 `highlights: true`。
- 没有 `tokensNum`；用 `contents.text.maxCharacters`。
- 不要用 `livecrawl: "always"`；改用 `contents.maxAgeHours: 0`。
- `category: company/people` 不能和 `excludeDomains` 或 date filters 一起用，否则可能 400。
- JavaScript/raw JSON 用 camelCase；Python SDK 使用 snake_case，包括 nested dict。

## Demo 验收标准

- Query 明显由当前 thread/page/device context 产生，而不是固定搜索框。
- 至少显示 title、URL 和 query-relevant highlight。
- Source 可点击，agent 不伪造 citation。
- 空结果和 API failure 有可见降级。
- 同一个 demo query 预跑三次，延迟与结果足够稳定。
- 如果用 structured output，展示 `output.grounding`，不要只展示综合结论。

## 现场账号清单

- [Exa dashboard](https://dashboard.exa.ai)
- [Exa API status](https://status.exa.ai)
- [Exa docs](https://exa.ai/docs)
- [API key 页面](https://dashboard.exa.ai/api-keys)
