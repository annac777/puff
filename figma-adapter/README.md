# Off-Ramp Figma context adapter

Status: compiled and tested against a mocked Figma host. Real Figma import and navigation are not yet verified.

## Setup

1. From the repository, run `npm install`, `npm run build:figma`, then `npm run dev`.
2. In Figma desktop, open the team's design file. Use **Plugins → Development → Import plugin from manifest** and select this folder's `manifest.json`.
3. Run **Off-Ramp — Design Context Adapter** from development plugins.
4. Open `http://127.0.0.1:4318`, choose **Connect local backend**, expand connection settings and reveal the local pairing token. Paste that token into the adapter. This token is not an OpenAI/OpenRouter/Exa API key.
5. Optionally enter the current Figma file URL to enable a browser fallback anchor. Choose **Enable sharing**. Keep the plugin open.

If Figma requires a generated development plugin ID, create a local development plugin through Figma and use its generated ID in this manifest. Do not assume a published plugin exists.

## Data and behavior

Every five seconds, while enabled, the adapter sends limited metadata to `127.0.0.1:4318`: file/page names, selected node IDs/names/types, up to 20 top-level frames/components/sections, and up to 30 local change records containing property names. It does not send text-node contents, pixels, screenshots, or entire documents. Node names can still contain sensitive information.

Remote collaborator edits are ignored as activity signals. The adapter does not call a model directly. A separate approval in Off-Ramp allows the backend to send context to the configured model provider.

**Take me back** may select saved nodes and move the viewport, but never edits design content. Navigation requires the original live plugin session, existing nodes on the expected page, and a fresh command. The backend shows success only after the plugin acknowledges execution.

## Manual acceptance test

- Before enabling sharing, no snapshots appear at the backend.
- Select a frame and change spacing; confirm the correct names and property appear.
- Make a comparison checkpoint with two frames and an edited intention.
- Select an unrelated frame, then restore. Confirm both saved frames become selected and visible.
- Delete a saved frame or stop the plugin; restore must report a failure, not success.
- Stop sharing; context becomes disconnected. Do not leave stale data presented as live.

Build output `code.js` is generated and ignored by Git. The manifest uses development-only localhost network access; production distribution needs a separate reviewed deployment configuration.
