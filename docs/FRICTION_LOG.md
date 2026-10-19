# Actual tool feedback and friction log

## Entry research

Task: identify a valid solo Alexa+ path without gated preview hardware/tools. Official overview and rules explicitly permit a simulated Alexa+ web experience; rules spell out exemption from runtime-tech hook. This made a locally reproducible entry feasible. No live Alexa or Amazon developer SDK was used, so no setup, performance or reliability claims about those systems are made.

Task: register through Devpost. First registration navigation displayed Cloudflare verification. User opened the page, asked for retry, and the normal registration form became available. Workaround: human browser verification, then ordinary form flow. Severity: blocked registration temporarily. Suggestion: preserve registration destination after security verification and expose a clear return-to-form action.

## Protocol and development tools

Used Node built-in HTTP, test runner and filesystem plus browser HTML/CSS/JS. MCP transport documentation was useful about origin validation, notification202 responses and GET405. An official reference client example specifically pairing plain JSON responses with session and version headers would simplify the small-server path. Our compatibility checks use our own test client; no live Alexa compatibility claim.

Codex helped implement, test and debug. AI development tool usage is disclosed; no paid runtime AI service was used. Feedback is an agent-maintained development record, not a fabricated personal learner reflection.

## Optional requests

Important: document how a simulated-experience submission should declare the boundary between real tool execution and mocked external services. Nice-to-have: a zero-device starter client with visible pending/approved/rejected action states. These are product feedback requests, not claims of defects encountered in an unavailable Amazon SDK.
