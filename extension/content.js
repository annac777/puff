(() => {
  if (window.top !== window || document.getElementById("off-ramp-root")) return;
  const counts = { clicks: 0, keypresses: 0, scrollEvents: 0, lastActivityAt: Date.now(), lastKeyAt: 0 };
  let latestState, activityTimer, lastScrollAt = 0, panelFrame;
  const root = document.createElement("aside");
  root.id = "off-ramp-root";
  root.classList.add("or-hidden");
  document.documentElement.appendChild(root);

  // The widget is pinned to a corner by default; once dragged it keeps an explicit position.
  let dragOrigin = null;
  function placeAt(left, top) {
    const maxLeft = Math.max(0, window.innerWidth - root.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - root.offsetHeight);
    root.style.left = Math.min(Math.max(0, left), maxLeft) + "px";
    root.style.top = Math.min(Math.max(0, top), maxTop) + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
  }
  function clampIntoView() {
    if (!root.style.left) return;
    placeAt(parseFloat(root.style.left), parseFloat(root.style.top));
  }
  function savePlacement() {
    try { chrome.storage?.local.set({ puffPlacement: { left: root.style.left, top: root.style.top } }); } catch {}
  }
  function restorePlacement() {
    try {
      chrome.storage?.local.get("puffPlacement", data => {
        const at = data?.puffPlacement;
        if (at?.left) placeAt(parseFloat(at.left), parseFloat(at.top));
      });
    } catch {}
  }
  window.addEventListener("resize", clampIntoView);

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
  }
  document.addEventListener("click", event => {
    if (!latestState?.enabled || latestState.blocked || event.target.closest?.("#off-ramp-root")) return;
    counts.clicks++; counts.lastActivityAt = Date.now();
  }, { capture:true, passive:true });
  document.addEventListener("keydown", event => {
    if (!latestState?.enabled || latestState.blocked || event.target.closest?.("#off-ramp-root")) return;
    counts.keypresses++; counts.lastKeyAt = counts.lastActivityAt = Date.now();
  }, { capture:true, passive:true });
  document.addEventListener("scroll", () => {
    if (!latestState?.enabled || latestState.blocked || Date.now()-lastScrollAt<500) return;
    lastScrollAt=Date.now(); counts.scrollEvents++; counts.lastActivityAt=lastScrollAt;
  }, { capture:true, passive:true });
  function onRuntimeMessage(message) {
    if (message.type === "OFF_RAMP_STATE") render(message.state);
    if (message.type === "OFF_RAMP_EXPAND" || message.type === "OFF_RAMP_SHOW") expandPanel();
    if (message.type === "OFF_RAMP_PANEL_SIZE") root.classList.toggle("or-wide", message.expanded);
  }
  chrome.runtime.onMessage.addListener(onRuntimeMessage);
  // The embedded widget tells us how much room it needs: cloud-sized when closed, panel-sized when open.
  window.addEventListener("message", event => {
    if (event.source !== panelFrame?.contentWindow) return;
    const data = event.data;
    if (data?.type === "PUFF_FRAME") { root.classList.toggle("or-open", !!data.expanded); clampIntoView(); }
    if (data?.type === "PUFF_DRAG_START") dragOrigin = root.getBoundingClientRect();
    if (data?.type === "PUFF_DRAG_MOVE" && dragOrigin) {
      root.classList.add("or-dragging");
      placeAt(dragOrigin.left + data.dx, dragOrigin.top + data.dy);
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
    sendMessage({type:"ACTIVITY_DELTA",delta,hidden:document.hidden,fullscreen:!!document.fullscreenElement}).then(r => {if(r?.ok)render(r.state);});
  },1000);
  sendMessage({type:"GET_STATE"}).then(r => {if(r?.ok)render(r.state);});
})();
