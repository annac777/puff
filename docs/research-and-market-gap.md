# Research and market gap

Existing break products already support timers, activity/idle sensing, snooze, meeting avoidance and escalating reminders. Those are not the differentiation.

The hypothesis to validate is narrower:

> A break is easier to accept when the system first reduces task-resumption cost.

The MVP therefore demonstrates three distinct behaviors:

1. It waits through high-frequency typing instead of interrupting on a clock edge.
2. It treats a pause, tab transition or idle transition as a candidate off-ramp.
3. It holds lightweight return context and adapts after Later.

The present checkpoint is intentionally shallow. A later opt-in version may ask permission to read a limited portion of the active page and produce a better “what I was doing / next step” note. That feature must not be implied by raw click or key counts.
