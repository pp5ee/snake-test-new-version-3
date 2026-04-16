**CORE_RISKS**
- Real‑time multiplayer sync: jitter, lag, rubber‑banding, and desync under variable RTT.
- Cheating/exploits if client‑authoritative (speed hacks, collision masking, tampered state).
- Using React for a 60 FPS loop: excessive re‑renders causing jank; poor Canvas/WebGL integration.
- Collision determinism at scale: simultaneous hits, rounding, and tie‑break rules causing disputes.
- Mobile/touch controls and cross‑browser quirks (Safari throttling, background tab timers).
- Content/visual scope creep (cyberpunk VFX, shaders) hurting performance on low‑end devices.
- Backend scalability and room orchestration (matchmaking, sharding, hot spots).
- Unclear MVP scope; lack of success metrics causes endless iteration.

**MISSING_REQUIREMENTS**
- Game rules: grid vs continuous, speed, growth, spawn logic, win/lose/tie conditions.
- Match lifecycle: lobbies, matchmaking, max players per room, rematch/rotation, spectating.
- Networking model: server‑authoritative vs client‑authoritative, reconciliation approach, tick rate.
- Controls: keyboard, touch, gamepad; input buffering; mobile layout and orientation lock.
- Fairness: spawn collision prevention, edge wrapping vs walls, simultaneous collision resolution.
- Recovery: reconnect, pause on tab blur, back‑pressure for slow clients, AFK handling.
- Aesthetics/audio: theme direction, shader use, performance fallbacks, SFX/music toggles and levels.
- UX/accessibility: color‑blind safe palette (neon contrast), reduced motion, screen reader hints.
- Social/system: identity (guest vs login), leaderboard persistence, moderation (chat/emotes), privacy.
- Ops: telemetry, error reporting, load testing targets, deployment and rollback strategy.

**TECHNICAL_GAPS**
- Architecture: clear separation of render (Canvas/WebGL) vs UI (React), and game loop orchestration.
- Networking stack choice and protocol details (WebSocket vs WebRTC, reliability, compression).
- Deterministic simulation plan (fixed timestep, float handling) and rollback/reconcile mechanics.
- Server tech: authoritative sim engine, room process model, horizontal scaling, state snapshots.
- Collision engine approach (grid cells vs spatial hashing) for many snakes/segments.
- Asset pipeline for cyberpunk visuals (glows, post‑processing) and performance budgets.
- Testability: headless sim tests, lag/fault injection, deterministic seeds for replay.
- Security: rate limits, message validation, anti‑tamper, leaderboard integrity, auth.

**ALTERNATIVE_DIRECTIONS**
- Single‑player first, bots later: faster MVP; defers multiplayer complexity but delays core promise.
- Server‑authoritative + snapshot/inputs: best fairness; more backend cost and complexity.
- Client‑authoritative + server checks: simpler infra; higher cheat risk and desync edge cases.
- WebSocket rooms vs WebRTC P2P: WS simpler and reliable through NAT; P2P lower latency but NAT/firewall and cheat complexity.
- Grid‑based movement vs continuous: grid is simpler/deterministic; continuous feels smoother but harder to reconcile.
- Canvas 2D + React UI overlay vs Phaser/Pixi: bespoke is lean; engines accelerate features but add overhead.
- Colyseus/Nakama managed servers vs custom Node/Go: faster start with batteries; less control or vendor lock‑in.
- Minimal VFX at launch with performance tiers: protects FPS on low‑end; less “wow” without settings.

**QUESTIONS_FOR_USER**
- MVP scope: single‑player only, or must multiplayer be in the first release?
- Target player count per room and target regions/browsers/devices?
- Movement model (grid vs continuous) and world bounds (wrap vs walls)?
- Networking model preference (server‑authoritative vs client‑authoritative) and acceptable latency?
- Visual ambition: shader/post‑processing must‑haves vs performance floor?
- Identity/leaderboards: guest only, or accounts and persistent stats? Any privacy constraints (GDPR/CPRA)?
- Monetization (if any) and moderation/chat requirements?
- Accessibility targets (reduced motion, color‑blind modes) and localization plans?
- Hosting stack preferences (Node with Socket.IO/Colyseus, Go, Nakama) and budget for managed services?
- Acceptance metrics: FPS, tick rate, max room size, reconnect behavior—what’s non‑negotiable?

**CANDIDATE_CRITERIA**
- Performance: maintains 60 FPS on mid‑range laptop and 30+ FPS on mid‑range mobile with 6 snakes, neon theme enabled.
- Netcode: supports 10 players/room at 20–30 Hz server tick; handles 150 ms median latency with <150 ms perceived input lag.
- Fairness: server‑authoritative collision outcomes are deterministic; simultaneous collision tie‑break documented and tested.
- Stability: clean reconnect within 5 seconds without losing session; handles background tab throttling gracefully.
- Controls: keyboard and touch fully supported; responsive layout for mobile portrait/landscape.
- Compatibility: Chrome, Safari, Firefox, Edge (latest two versions); no blocking bugs.
- Accessibility: color‑blind safe palette option and reduced motion setting; audio toggles persist.
- Security: input/message validation with rate limiting; basic anti‑tamper for speed/state; leaderboard write integrity.
- Observability: basic telemetry (FPS, RTT, tick drift) and error reporting; load test passes 100 concurrent players across rooms.
- Code quality: React used only for UI; game loop runs outside React; deterministic sim with fixed timestep and unit tests for core rules.
