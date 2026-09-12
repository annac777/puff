(() => {
  if (window.top !== window || document.getElementById("off-ramp-root")) return;

  const counts = { clicks: 0, keypresses: 0, scrollEvents: 0, lastActivityAt: Date.now(), lastKeyAt: 0 };
  let lastScrollAt = 0;
  let latestState;

  document.addEventListener("click", event => {
    if (event.target.closest?.("#off-ramp-root")) return;
    counts.clicks += 1;
    counts.lastActivityAt = Date.now();
  }, { capture: true, passive: true });

  document.addEventListener("keydown", event => {
    if (event.target.closest?.("#off-ramp-root")) return;
    counts.keypresses += 1;
    counts.lastKeyAt = counts.lastActivityAt = Date.now();
  }, { capture: true, passive: true });

  document.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastScrollAt < 500) return;
    lastScrollAt = now;
    counts.scrollEvents += 1;
    counts.lastActivityAt = now;
  }, { capture: true, passive: true });

  const root = document.createElement("aside");
  root.id = "off-ramp-root";
  root.innerHTML = `
    <button class="or-close" aria-label="Hide Off-Ramp">×</button>
    <div class="or-pet" aria-hidden="true"><span></span><i></i></div>
    <div class="or-copy"><small>OFF-RAMP · LOCAL ONLY</small><strong></strong><p></p></div>
    <div class="or-metrics"></div>
    <div class="or-checkpoint"></div>
    <div class="or-actions"></div>`;
  document.documentElement.appendChild(root);

  root.querySelector(".or-close").addEventListener("click", () => root.classList.add("or-hidden"));

  function actionButton(label, action, primary = false) {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = primary ? "or-primary" : "or-secondary";
    button.addEventListener("click", () => chrome.runtime.sendMessage({ type: "USER_RESPONSE", action }));
    return button;
  }

  function render(state, intervention) {
    latestState = state;
    root.dataset.mode = state.mode;
    root.querySelector("strong").textContent = intervention.title;
    root.querySelector("p").textContent = intervention.message;
    root.querySelector(".or-metrics").textContent =
      `${state.sessionSeconds}s · ${state.keypresses} keys · ${state.clicks} clicks · ${state.scrollEvents} scrolls · ${state.tabSwitches} tabs · ${state.idleState}`;
    const checkpoint = root.querySelector(".or-checkpoint");
    checkpoint.textContent = state.checkpoint && ["on_break", "resume"].includes(state.mode)
      ? `Held: ${state.checkpoint.title || "this page"}` : "";
    const actions = root.querySelector(".or-actions");
    actions.replaceChildren();
    if (intervention.primaryAction === "take_break") actions.append(actionButton("Take a break", "take_break", true));
    if (intervention.primaryAction === "resume") actions.append(actionButton("Resume", "resume", true));
    if (intervention.secondaryAction === "later") actions.append(actionButton("Later", "later"));
  }

  chrome.runtime.onMessage.addListener(message => {
    if (message.type === "OFF_RAMP_STATE") render(message.state, message.intervention);
    if (message.type === "OFF_RAMP_SHOW") root.classList.remove("or-hidden");
  });

  setInterval(() => {
    const delta = { ...counts };
    counts.clicks = counts.keypresses = counts.scrollEvents = 0;
    chrome.runtime.sendMessage({ type: "ACTIVITY_DELTA", delta }).then(response => {
      if (response?.ok) render(response.state, response.intervention);
    }).catch(() => {});
  }, 1000);

  chrome.runtime.sendMessage({ type: "GET_STATE" }).then(response => {
    if (response?.ok) render(response.state, response.intervention);
  }).catch(() => {});
})();
