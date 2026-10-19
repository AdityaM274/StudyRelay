# StudyRelay implementation plan and requirements map

Selected19October2026 under user's autonomous one-event-per-day workflow. Distinct event from Build With AI: Basics; similar themes would still be permitted. New app source in an initially empty app folder.

Problem: after an interruption, a study schedule may no longer fit, and a task title does not preserve the next thought. Kernel: preserve a specific resume breadcrumb and completed minutes, replan feasible work around commitments, show deferred work, and require fresh approval for simulated calendar changes.

Audience: students with a bounded evening study window. This audience choice is an implementation judgment, not claimed user research.

Architecture: Node24 built-ins; dependency-free web UI; real local MCP tools transport2025-11-25; atomic private JSON persistence; deterministic planner. No billed runtime services. Entry path: Alexa+ simulated experience, explicitly allowed by rules4, exempt from mandatory runtime Amazon-technology hook. Added local MCP server supports an inspectable tool-backed simulator; no live Alexa connection asserted.

Required deliverables: working simulation; source repository with license and run instructions; public English YouTube/Vimeo working demo under3min; project description; actual product/tool feedback; track selection. Do not claim AWS Builder or Open Source mini-challenge without their additional work.

Judging map: technical implementation→real transport, state and meaningful tests; design→single coherent resume loop; impact→specific student need with no invented metrics; idea→persistent context plus approval-safe rescheduling, beyond one-turn Q&A. These are design goals, not awarded scores or predicted winning odds.

Verification slices: (1) feasible plan and exposed overload; (2) interruption arithmetic plus reload; (3) preview/decline/approve plus stale-approval rejection; (4) JSON-RPC errors, session/origin/version checks and private-file boundaries; (5) UI and actual demo.

New-work disclosure: AI assisted original code, tests, documentation and eventual entry copy. Official protocol text was consulted; it is not copied wholesale. No pre-existing student application incorporated. Sample data fictional. Human chooses real study estimates and confirms entry-specific legal terms.

Deferred: multi-day planning, calendar OAuth, voice, generative conversation, cloud hosting, measured user-impact study. Deploying or enabling a real calendar would require a separate design and permission review.
