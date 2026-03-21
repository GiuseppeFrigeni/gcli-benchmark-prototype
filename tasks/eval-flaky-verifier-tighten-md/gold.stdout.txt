Problem: The verifier accepts either of two stdout variants, so it can pass even when the agent skips the required evidence trail.
Why it flakes: The current script checks for loose substring matches and never inspects activity-summary.json, which makes reruns nondeterministic when wording shifts.
Tightening plan: Parse the response shape exactly, assert the required inspected targets from activity-summary.json, and move the noisy chat transcript into a fixture instead of the verifier itself.
