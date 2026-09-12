importScripts("core.js");

const STORAGE_KEY = "offRampState";

async function getState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return { ...OffRampCore.initialState(), ...(stored[STORAGE_KEY] || {}) };
}

async function saveState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
  broadcast(state);
  return state;
}

async function updateTabContext(state, tab) {
  if (!tab) return state;
  return {
    ...state,
    currentTabTitle: tab.title || "",
    currentTabUrl: tab.url || ""
  };
}

async function broadcast(state) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:/.test(tab.url || "")) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "OFF_RAMP_STATE",
    state,
    intervention: OffRampCore.interventionFor(state)
  }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.idle.setDetectionInterval(15);
  chrome.alarms.create("evaluate-off-ramp", { periodInMinutes: 0.5 });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await saveState(await updateTabContext(OffRampCore.initialState(), tab));
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.idle.setDetectionInterval(15);
  chrome.alarms.create("evaluate-off-ramp", { periodInMinutes: 0.5 });
  await saveState(OffRampCore.evaluate(await getState()));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    let state = await getState();
    if (message.type === "ACTIVITY_DELTA") {
      state = OffRampCore.mergeActivity(state, message.delta);
      state = await updateTabContext(state, sender.tab);
    } else if (message.type === "USER_RESPONSE") {
      state = OffRampCore.applyResponse(state, message.action);
    } else if (message.type === "FORCE_MODE" && OffRampCore.MODES.includes(message.mode)) {
      state = { ...state, mode: message.mode };
    } else if (message.type === "SET_DEMO_MODE") {
      state = { ...state, demoMode: Boolean(message.enabled), thresholdSeconds: message.enabled ? 15 : 50 * 60 };
    } else if (message.type === "GET_STATE") {
      state = OffRampCore.evaluate(state);
    }
    await saveState(state);
    sendResponse({ ok: true, state, intervention: OffRampCore.interventionFor(state) });
  })().catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  let state = await getState();
  state = OffRampCore.evaluate({ ...state, tabSwitches: state.tabSwitches + 1, lastActivityAt: Date.now() });
  await saveState(await updateTabContext(state, tab));
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.active || (!changeInfo.title && !changeInfo.url)) return;
  await saveState(await updateTabContext(await getState(), tab));
});

chrome.idle.onStateChanged.addListener(async idleState => {
  const state = OffRampCore.evaluate({ ...(await getState()), idleState });
  await saveState(state);
});

chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === "evaluate-off-ramp") await saveState(OffRampCore.evaluate(await getState()));
});
