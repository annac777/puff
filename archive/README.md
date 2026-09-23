# Archive — v1, the agent handoff

This is the version submitted to the Agents Everywhere hackathon on 12 September 2026.
It is kept for the record and is no longer part of the extension.

- `v1-agent-backend/` — a local Node/TypeScript server running two agents on the OpenAI Agents
  SDK: one that read every open tab and proposed a bounded task, one that researched it through
  Exa and returned a brief with real sources.
- `v1-figma-adapter/` — a Figma development plugin that shared selected node names and changed
  property names, never pixels. Built and unit-tested against a mocked host; never validated in a
  live Figma file.
- `v1-tests/` — the tests that covered them.

## Why it was retired

The agent needed a server running on the developer's own laptop, so nobody else could install
Puff. Making it shippable would have meant either hosting the backend or asking every user for
their own API key. Neither is reasonable for the audience.

The handoff was also the weaker half of the idea. Puff only ever saw tab titles, so its
understanding was thin, and the research it produced was worse than asking a general assistant
directly — it saved about twenty seconds of typing and gave up accuracy and follow-up questions
to do it.

What survives is the half nothing else does: noticing a good moment to stop, and remembering
where you were so coming back is easy. That needs no server at all.
