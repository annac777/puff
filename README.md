# Puff

An agent that keeps your place and moves one approved task forward while you step away.

Leaving unfinished work means remembering the page, the open question, and the next step. Puff helps you hand off that moment: review the context, confirm your intention, save your place, and optionally approve a small public research task. Return to a sourced result and the next step you chose.

## Current build

- Chrome extension with local activity estimates, quiet invitations, cooldowns, and saved browser anchors.
- Optional Figma plugin sharing selected-node and recent-change metadata after consent.
- Local TypeScript backend using OpenAI Agents SDK with OpenAI or OpenRouter.
- Model-assisted checkpoint cards with editable intentions and validated frame anchors.
- Separately approved Exa research with source links, cancellation, and execution limits.
- Persistent checkpoints and research results; acknowledged restore commands.

The implementation has passed local automated checks. Live model/search and browser UI checks are documented in [implementation status](docs/implementation-status.md). Real Figma-file capture/restore and the updated installed Chrome extension still need acceptance testing. Context-based task suggestions and the redesigned handoff flow remain planned. The backend must stay running on an awake computer.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
cp .env.example .env
# Fill in your provider and Exa API keys in .env.
npm run build:figma
npm run dev
```

1. For one-time engineering setup, open `http://127.0.0.1:4318/?developer=1` and choose **Connect local backend**. The normal page deliberately has no developer settings entry.
2. In Chrome, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**. Select this repository's `extension` folder. Reload an existing installation and refresh test pages after changes.
3. Open `chrome-extension://<installed-extension-id>/panel.html?developer=1` explicitly for engineering setup and pair using that token. Do not show this page during the demo. Refresh the working webpage after pairing; normal extension navigation remains inside its floating panel.
4. For Figma, follow the [adapter setup guide](figma-adapter/README.md), then explicitly enable metadata sharing.
5. Review context, approve model sharing, edit your next step, and save a checkpoint. Enter and approve a public research question if you want to delegate work.

Keys belong only in the ignored root `.env`. `OFFRAMP_PROVIDER` supports `openai` or `openrouter`; `OFFRAMP_MODEL` selects the model. Anthropic settings in the optional upstream starter kit do not configure this backend. The product name is Puff. Legacy internal identifiers remain unchanged for compatibility.

## Verify

```sh
npm test
npm run typecheck
npm run build:figma
```

Optional: `npx tsx backend/smoke.ts` makes billable model and search calls with explicitly synthetic context. It is separate from the offline test suite.

## Product and design

- [Current design brief and implementation gaps](docs/puff-design-brief.md)
- [Two-minute pitch and demonstration](docs/demo-script.md)
- [Implementation status and acceptance checks](docs/implementation-status.md)
- [Privacy and data boundaries](docs/privacy-and-data-boundaries.md)

The current research task searches public sources. It does not edit Figma, send messages, run project tests, or access Calendar/Gmail. Figma metadata does not establish visual design quality or reveal a user's intention; users confirm the open question and next step.

## Repository scope

This repository contains product source, tests, setup instructions, and current design documentation. Event preparation, sponsor research, earlier brainstorming, and superseded working notes remain local and are excluded from Git. Secrets, local user state, dependencies, and generated Figma code are also excluded.

The optional [CopilotKit starter kit](https://github.com/CopilotKit/agents-everywhere-starter-kit) is a separate, ignored local reference; it is not required to clone or run this application. Preserve upstream license notices when reusing its code.
