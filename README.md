# StudyRelay

An interruption-aware study companion built for the **simulated Alexa+ experience** path of the Amazon Developer Hackathon. Built with Codex on 19 October 2026. It is a functioning local simulation, not an Amazon product, live Alexa integration or language-model service.

## Run

Requires Node.js24+. No package installation, account, API key, device or paid service.

```sh
npm start
# open http://127.0.0.1:4174/
npm test
```

## The complete loop

1. Load **Try a fictional evening**, confirming replacement of the single local workspace.
2. **Build my evening** allocates150 estimated minutes around a fixed dinner event. Earliest deadlines win; priority breaks ties; five-minute breaks follow45 focus minutes.
3. **I was interrupted**: choose Seminar outline, report15 completed focus minutes and25 interrupted minutes, and leave a concrete breadcrumb. The tool preserves30 remaining seminar minutes, advances19:15 to19:55, and replans without occupying dinner.
4. **Preview calendar changes** prepares a revision-bound proposal. Nothing is committed yet. **Decline** leaves the simulated calendar alone. **Approve simulated changes** writes only this application's local simulated blocks.
5. Change a task, commitment or window: old proposals become invalid. Reload: the resume note, remaining work and calendar state persist. Export a readable handoff report.
6. Shorten the window to expose deferred work. Unscheduled work is reported honestly, never silently marked done.

You can also add your own tasks, deadlines, priorities, fixed commitments and resume notes. Same-day planning only. Current time is explicitly user-set; the prototype does not infer real elapsed study time.

## Actual tools and transport

The browser initializes a real local MCP session and calls `/mcp` over JSON-based Streamable HTTP using protocol2025-11-25. Tool implementations are in `planner.mjs`; `server.mjs` dispatches and persists successful mutations atomically. `public/app.js` is the simulator client. Exposed tools include get_workspace, add_task, add_busy, plan_day, interrupt, prepare_calendar, approve_calendar, decline_calendar and set_window. The activity panel is generated from actual successful tool execution, not prerecorded narration.

The server implements initialize/initialized, ping, tools/list, tools/call, session headers and DELETE. GET returns405 because unsolicited SSE is not offered, as the transport permits. This is a tested small implementation of the tools workflow, not a claim of complete protocol conformance, production authentication or confirmed compatibility with live Alexa. The hackathon entry uses the explicit simulation alternative.

Protocol references: [transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools). Event path: [official rules](https://amazonappdev2026.devpost.com/rules).

## What is simulated and what is real

Real: constraint-based scheduling, completion arithmetic, persistent resume context, tool calls, proposal invalidation and explicit approval gate. Simulated: Alexa interaction and external calendar. Typed commands use documented intent patterns; there is no hidden LLM, microphone input, invented model response or paid inference. No Amazon SDK, cloud account or device was used. AI assisted development, tests and documentation. Sample student tasks are fictional; no user study, grade improvement or productivity measurement is claimed.

## Privacy and limits

Single-user loopback prototype. Workspace and trace live in ignored `data/workspace.json`, unencrypted. It is not a multi-user service. Host/Origin validation blocks ordinary cross-origin browser calls; no CORS allowance, secret files or arbitrary paths are served. Do not bind it publicly or treat it as a production security design. Local non-browser processes can access the workspace. Exports include entered text. Tool sessions are in memory and capped; restart after100 initialization sessions. Invalid existing state stops startup rather than silently overwriting the file.

Task estimates are not measured effort. Priority does not override an earlier deadline. The planner is a deterministic heuristic, not a mathematical optimum or a free-form conversational model. Calendar commits replace only the application's simulated blocks; fixed commitments stay separate.

## Source map

- `planner.mjs`: validated tools, planner, transactional state and approval logic.
- `server.mjs`: local HTTP/MCP transport, private persistence and static allowlist.
- `public/`: interface, simulator client and styles.
- `tests/`: planner, protocol, security boundaries and restart persistence.
- `docs/`: scope, design, requirements mapping and honest friction log.

MIT licensed. No code from yesterday's DefendMyDeck project was reused.
