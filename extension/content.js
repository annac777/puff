(() => {
  if (window.top !== window || document.getElementById("off-ramp-root")) return;
  const counts = { clicks: 0, keypresses: 0, scrollEvents: 0, lastActivityAt: Date.now(), lastKeyAt: 0, lastScrollAt: 0, lastBoundaryAt: 0 };
  let latestState, activityTimer, lastScrollAt = 0, panelFrame;
  const root = document.createElement("aside");
  root.id = "off-ramp-root";
  root.classList.add("or-hidden");
  document.documentElement.appendChild(root);

  // Placement is anchored at the bottom-right corner, where the cloud sits. The frame grows up and
  // to the left as the panel opens or changes size, so the cloud itself never moves. (Anchoring at
  // the top-left made it jump whenever the panel changed height.)
  let dragOrigin = null;
  // Staying out of sight until there is something to say is an option, not the default: in use,
  // a cloud that vanished whenever the panel closed read as a bug.
  let summoned = false;
  let prefs = { tuck: false };
  function syncTuck() {
    const watching = ["quiet", "considering"].includes(latestState?.mode);
    root.classList.toggle("or-tucked", prefs.tuck && watching && !summoned && !root.classList.contains("or-open"));
  }
  function askFrameToOpen() {
    try { panelFrame?.contentWindow?.postMessage({ type: "PUFF_OPEN" }, "*"); } catch {}
  }
  // Where the person put the cloud. Only a drag changes it. When the panel is taller or wider than
  // the room above and to the left of the cloud, the panel shrinks and scrolls; the cloud never
  // moves to make room. (Moving it to fit was the jump: it went down on open and stayed there.)
  const CLOUD = 152, PANEL_W = 352, PANEL_H = 700, COMPACT_H = 440, MARGIN = 8;
  let anchor = null;
  function layout() {
    const right = anchor ? Math.min(Math.max(0, anchor.right), Math.max(0, window.innerWidth - CLOUD)) : 26;
    const bottom = anchor ? Math.min(Math.max(0, anchor.bottom), Math.max(0, window.innerHeight - CLOUD)) : 16;
    root.style.right = right + "px";
    root.style.bottom = bottom + "px";
    root.style.left = "auto";
    root.style.top = "auto";
    if (root.classList.contains("or-open")) {
      const wanted = root.classList.contains("or-compact") ? COMPACT_H : PANEL_H;
      root.style.setProperty("height", Math.max(CLOUD, Math.min(wanted, window.innerHeight - bottom - MARGIN)) + "px", "important");
      root.style.setProperty("width", Math.max(CLOUD, Math.min(PANEL_W, window.innerWidth - right - MARGIN)) + "px", "important");
    } else {
      root.style.removeProperty("height");
      root.style.removeProperty("width");
    }
  }
  function placeAt(right, bottom) {
    anchor = { right, bottom };
    layout();
  }
  function clampIntoView() { layout(); }
  function savePlacement() {
    try { if (anchor) chrome.storage?.local.set({ puffPlacement: { right: anchor.right + "px", bottom: anchor.bottom + "px" } }); } catch {}
  }
  function applyPlacement(at) {
    // Older builds saved a top-left position; that cannot be anchored, so it falls back to the corner.
    if (at?.right && at.right !== "auto") placeAt(parseFloat(at.right), parseFloat(at.bottom));
  }
  function restorePlacement() {
    try { chrome.storage?.local.get("puffPlacement", data => applyPlacement(data?.puffPlacement)); } catch {}
  }
  window.addEventListener("resize", clampIntoView);
  // One Puff across tabs: every tab has its own copy, so a move or a preference in one is
  // mirrored in the others, and a tab coming back into view picks up the latest.
  try {
    chrome.storage?.local.get("puffPrefs", data => { prefs = { ...prefs, ...(data?.puffPrefs || {}) }; syncTuck(); });
    chrome.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.puffPlacement && !dragOrigin) applyPlacement(changes.puffPlacement.newValue);
      if (changes.puffPrefs) { prefs = { ...prefs, ...(changes.puffPrefs.newValue || {}) }; syncTuck(); }
    });
  } catch {}
  document.addEventListener("visibilitychange", () => { if (!document.hidden) restorePlacement(); });

  function disconnect() {
    clearInterval(activityTimer);
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch {}
    root.remove();
  }
  function sendMessage(message) {
    try {
      if (!chrome.runtime.id) { disconnect(); return Promise.resolve(null); }
      return chrome.runtime.sendMessage(message).catch(() => {
        if (!chrome.runtime.id) disconnect();
        return null;
      });
    } catch { disconnect(); return Promise.resolve(null); }
  }
  function expandPanel() {
    if (!latestState?.enabled || latestState.blocked) return;
    if (!panelFrame) {
      // getURL throws once the extension is reloaded under a stale content script.
      let src;
      try { src = chrome.runtime.id && chrome.runtime.getURL("app/index.html?floating=1"); } catch { src = null; }
      if (!src) { disconnect(); return; }
      panelFrame = document.createElement("iframe");
      panelFrame.className = "or-panel-frame";
      panelFrame.title = "Puff handoff panel";
      panelFrame.src = src;
      panelFrame.addEventListener("load", () => { if (summoned) askFrameToOpen(); });
      root.appendChild(panelFrame);
    }
    root.classList.remove("or-hidden");
    root.classList.add("or-expanded");
    restorePlacement();
  }
  function render(state) {
    latestState = state;
    root.dataset.mode = state.mode;
    root.classList.toggle("or-hidden", !state.enabled || state.blocked);
    // This build has no collapsed launcher. Mount directly in the current page.
    if (state.enabled && !state.blocked) expandPanel();
    syncTuck();
  }
  document.addEventListener("click", event => {
    if (!latestState?.enabled || latestState.blocked || event.target.closest?.("#off-ramp-root")) return;
    counts.clicks++; counts.lastActivityAt = Date.now();
  }, { capture:true, passive:true });
  document.addEventListener("keydown", event => {
    if (!latestState?.enabled || latestState.blocked || event.target.closest?.("#off-ramp-root")) return;
    counts.keypresses++; counts.lastKeyAt = counts.lastActivityAt = Date.now();
    // Saving is a completion moment. Only the shortcut is recognised; no key is ever recorded.
    if ((event.metaKey || event.ctrlKey) && (event.key === "s" || event.key === "S")) counts.lastBoundaryAt = Date.now();
  }, { capture:true, passive:true });
  // Submitting or sending a form is the other one. Only that it happened, never what was in it.
  document.addEventListener("submit", event => {
    if (!latestState?.enabled || latestState.blocked || event.target.closest?.("#off-ramp-root")) return;
    counts.lastBoundaryAt = counts.lastActivityAt = Date.now();
  }, { capture:true, passive:true });
  document.addEventListener("scroll", () => {
    if (!latestState?.enabled || latestState.blocked || Date.now()-lastScrollAt<500) return;
    lastScrollAt=Date.now(); counts.scrollEvents++; counts.lastActivityAt=counts.lastScrollAt=lastScrollAt;
  }, { capture:true, passive:true });
  function onRuntimeMessage(message) {
    if (message.type === "OFF_RAMP_STATE") render(message.state);
    if (message.type === "OFF_RAMP_EXPAND" || message.type === "OFF_RAMP_SHOW") {
      summoned = true;
      expandPanel();
      syncTuck();
      askFrameToOpen();
    }
    if (message.type === "OFF_RAMP_PANEL_SIZE") root.classList.toggle("or-wide", message.expanded);
  }
  chrome.runtime.onMessage.addListener(onRuntimeMessage);
  // The embedded widget tells us how much room it needs: cloud-sized when closed, panel-sized when open.
  window.addEventListener("message", event => {
    if (event.source !== panelFrame?.contentWindow) return;
    const data = event.data;
    if (data?.type === "PUFF_FRAME") {
      root.classList.toggle("or-open", !!data.expanded);
      // A suggestion is a small card; it should not leave a large invisible area over the page.
      root.classList.toggle("or-compact", !!data.expanded && !!data.compact);
      if (!data.expanded) summoned = false;
      syncTuck();
      clampIntoView();
    }
    if (data?.type === "PUFF_DRAG_START") dragOrigin = root.getBoundingClientRect();
    if (data?.type === "PUFF_DRAG_MOVE" && dragOrigin) {
      root.classList.add("or-dragging");
      placeAt(window.innerWidth - (dragOrigin.right + data.dx), window.innerHeight - (dragOrigin.bottom + data.dy));
    }
    if (data?.type === "PUFF_DRAG_END") {
      dragOrigin = null;
      root.classList.remove("or-dragging");
      savePlacement();
    }
  });
  activityTimer = setInterval(() => {
    const delta = { ...counts };
    counts.clicks = counts.keypresses = counts.scrollEvents = 0;
    counts.lastBoundaryAt = 0;
    sendMessage({type:"ACTIVITY_DELTA",delta,hidden:document.hidden,fullscreen:!!document.fullscreenElement}).then(r => {if(r?.ok)render(r.state);});
  },1000);
  sendMessage({type:"GET_STATE"}).then(r => {if(r?.ok)render(r.state);});
})();
