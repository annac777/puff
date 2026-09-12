(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.OffRampCore = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  const MODES = ["quiet", "considering", "gentle_nudge", "checkpoint", "on_break", "resume"];

  function initialState(now = Date.now()) {
    return {
      sessionStartedAt: now,
      sessionSeconds: 0,
      idleState: "unknown",
      clicks: 0,
      keypresses: 0,
      scrollEvents: 0,
      tabSwitches: 0,
      currentTabTitle: "",
      currentTabUrl: "",
      lastActivityAt: now,
      lastKeyAt: 0,
      recentTyping: false,
      possibleBreakpoint: false,
      mode: "quiet",
      laterCount: 0,
      responseHistory: [],
      checkpoint: null,
      demoMode: true,
      thresholdSeconds: 15
    };
  }

  function mergeActivity(state, delta, now = Date.now()) {
    const next = { ...state };
    next.clicks += Number(delta.clicks || 0);
    next.keypresses += Number(delta.keypresses || 0);
    next.scrollEvents += Number(delta.scrollEvents || 0);
    if (delta.lastActivityAt) next.lastActivityAt = Math.max(next.lastActivityAt, delta.lastActivityAt);
    if (delta.lastKeyAt) next.lastKeyAt = Math.max(next.lastKeyAt, delta.lastKeyAt);
    return evaluate(next, now);
  }

  function evaluate(state, now = Date.now()) {
    const next = { ...state };
    next.sessionSeconds = Math.max(0, Math.floor((now - next.sessionStartedAt) / 1000));
    next.recentTyping = now - next.lastKeyAt < 1500;
    const activityPause = now - next.lastActivityAt >= 1800;
    next.possibleBreakpoint = next.sessionSeconds >= next.thresholdSeconds &&
      !next.recentTyping && (activityPause || next.idleState !== "active" || next.tabSwitches > 0);

    if (next.mode === "on_break" || next.mode === "resume" || next.mode === "checkpoint") return next;
    if (next.sessionSeconds < Math.max(3, next.thresholdSeconds - 3)) next.mode = "quiet";
    else if (!next.possibleBreakpoint) next.mode = "considering";
    else next.mode = next.laterCount > 0 ? "checkpoint" : "gentle_nudge";
    return next;
  }

  function interventionFor(state) {
    const copy = {
      quiet: ["Working quietly", "I’ll wait for a natural stopping point."],
      considering: ["Holding the thought", "You’re still active, so I won’t interrupt yet."],
      gentle_nudge: ["A small opening appeared", "Want to step away for a moment?"],
      checkpoint: ["Save your place first?", "I can hold this tab and your next step before you go."],
      on_break: ["Your place is held", "Take a breath. Return when you’re ready."],
      resume: ["Welcome back", "Here is where you left off."]
    }[state.mode] || ["Off-Ramp", "Observing locally."];
    return {
      mode: state.mode,
      title: copy[0],
      message: copy[1],
      primaryAction: state.mode === "on_break" ? "resume" :
        ["gentle_nudge", "checkpoint"].includes(state.mode) ? "take_break" : undefined,
      secondaryAction: ["gentle_nudge", "checkpoint"].includes(state.mode) ? "later" : undefined,
      reason: state.possibleBreakpoint ? "A pause or tab transition followed sustained browser activity." : undefined
    };
  }

  function applyResponse(state, action, now = Date.now()) {
    const next = { ...state, responseHistory: [...state.responseHistory] };
    next.responseHistory.push({ action, timestamp: now, interventionMode: state.mode });
    if (action === "later" || action === "dismiss") {
      next.laterCount += 1;
      next.mode = "quiet";
      next.sessionStartedAt = now;
    } else if (action === "take_break") {
      next.checkpoint = {
        title: state.currentTabTitle,
        url: state.currentTabUrl,
        note: "Return to the active tab and continue from the last visible task.",
        savedAt: now
      };
      next.mode = "on_break";
    } else if (action === "resume") {
      next.mode = "resume";
    }
    return next;
  }

  return { MODES, initialState, mergeActivity, evaluate, interventionFor, applyResponse };
});
