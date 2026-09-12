const modes = ["quiet", "considering", "gentle_nudge", "checkpoint", "on_break", "resume"];
const mode = document.getElementById("mode");
mode.innerHTML = modes.map(value => `<option value="${value}">${value}</option>`).join("");

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATE" });
  if (!response?.ok) return;
  const state = response.state;
  document.getElementById("demo").checked = state.demoMode;
  mode.value = state.mode;
  document.getElementById("summary").textContent =
    `${state.sessionSeconds}s · ${state.keypresses} keys · ${state.clicks} clicks · ${state.scrollEvents} scrolls · ${state.tabSwitches} tab switches · ${state.idleState}`;
}

document.getElementById("demo").addEventListener("change", event =>
  chrome.runtime.sendMessage({ type: "SET_DEMO_MODE", enabled: event.target.checked }).then(refresh));
document.getElementById("force").addEventListener("click", () =>
  chrome.runtime.sendMessage({ type: "FORCE_MODE", mode: mode.value }).then(refresh));
document.getElementById("show").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "OFF_RAMP_SHOW" }).catch(() => {});
});
refresh();
