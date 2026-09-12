const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../core.js");

test("waits while the user is still typing", () => {
  const now = 20_000;
  const state = core.evaluate({ ...core.initialState(0), thresholdSeconds: 10, lastKeyAt: now - 100, lastActivityAt: now - 100 }, now);
  assert.equal(state.recentTyping, true);
  assert.equal(state.possibleBreakpoint, false);
  assert.equal(state.mode, "considering");
});

test("finds a breakpoint after sustained work and a pause", () => {
  const now = 20_000;
  const state = core.evaluate({ ...core.initialState(0), thresholdSeconds: 10, idleState: "active", lastActivityAt: now - 2000 }, now);
  assert.equal(state.possibleBreakpoint, true);
  assert.equal(state.mode, "gentle_nudge");
});

test("later adapts the next intervention to checkpoint mode", () => {
  const delayed = core.applyResponse({ ...core.initialState(0), mode: "gentle_nudge" }, "later", 1000);
  const state = core.evaluate({ ...delayed, thresholdSeconds: 10, lastActivityAt: 1000, tabSwitches: 1 }, 12_000);
  assert.equal(state.laterCount, 1);
  assert.equal(state.mode, "checkpoint");
});

test("take break saves only lightweight tab context", () => {
  const state = core.applyResponse({ ...core.initialState(0), mode: "checkpoint", currentTabTitle: "Draft", currentTabUrl: "https://example.com" }, "take_break", 10);
  assert.equal(state.mode, "on_break");
  assert.deepEqual(state.checkpoint, { title: "Draft", url: "https://example.com", note: "Return to the active tab and continue from the last visible task.", savedAt: 10 });
});

test("activity aggregation counts events but stores no key content", () => {
  const state = core.mergeActivity(core.initialState(0), { clicks: 2, keypresses: 8, scrollEvents: 1, lastActivityAt: 100 }, 100);
  assert.equal(state.clicks, 2);
  assert.equal(state.keypresses, 8);
  assert.equal("keys" in state, false);
});
