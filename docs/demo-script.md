# Two-minute demo script

1. Load the extension and open a normal HTTPS page. Open the popup and confirm 15-second demo mode.
2. Type and scroll. Show that counts increase but no characters or page content are captured.
3. Force or wait for `considering`: “The threshold passed, but I’m still typing, so it stays out of the way.”
4. Stop typing or switch tabs. Show `gentle_nudge` appearing at a candidate boundary.
5. Choose **Later**. Explain that the response is stored locally.
6. Trigger the next boundary. Show the adapted `checkpoint` intervention.
7. Choose **Take a break**. Show the held tab title and the `on_break` state.
8. Choose **Resume** and show the return context.
9. Close with: “The novelty is not detecting fatigue. It is lowering the cognitive cost of stepping away.”

Backup: use the popup’s force-state selector if the timing signal does not fire during judging.
