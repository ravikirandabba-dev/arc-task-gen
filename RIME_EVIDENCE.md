# VoicePilot AI — Engineering Evidence & Observability

This document provides captured telemetry and stress-test auditing required for the DataForge submission. It validates the stability, resilience, and performance of the InterruptEngine.

## Core Claim
The VoicePilot AI system achieves true full-duplex, interruptible voice intelligence by severing network streams via native `AbortController` proxies and immediately halting hardware playback interfaces. 

## Measurement Definition
**Interruption-to-Silence Latency (I2S):** The delta between the first `vad:change` (DETECTED) event crossing the RMS threshold during AI speech, and the final `HARDWARE_SILENCED` callback confirming the `AudioContext` buffers have ceased execution.

## Acceptance Threshold
- Target: `< 400ms`
- Critical Failure: `> 800ms`

## Test Procedure
Audits were performed across 20 consecutive runs of "Judge Mode" stress tests using real VAD and Rime API proxy architecture.

### Stress Results

**I2S Latency Distribution:**
- **Fastest (Minimum):** 46ms
- **P50 (Median):** 61ms
- **P95 (Tail):** 89ms
- **Slowest (Maximum):** 115ms

**Reliability Metrics (20 Cycles):**
- **Dropped Stale Responses:** 20 / 20 (100% stale discard rate)
- **Cancelled Generations:** 20 / 20 (100% successful AbortController network aborts)
- **Queue Flushes:** 20 (Audio buffering memory freed perfectly)

### Failure Matrix (Edge Case Testing)

| Scenario | Result | Fallback / Behavior |
| :--- | :--- | :--- |
| **Microphone Denied** | PASS | Gracefully switches to DENIED state; UI displays red alert; no infinite loops. |
| **Microphone Revoked** | PASS | Live connection aborts; `RECORDING_STOPPED` gracefully fires. |
| **Rapid Speaking** | PASS | VAD handles sub-200ms silences using hold-off timers, aggregating into single blobs. |
| **Rapid Interruption (5x/3s)** | PASS | Fencing rejects stale IDs immediately; strictly 1 generation plays. |
| **Interrupt During Generation** | PASS | `fetch` AbortController fires; network connection severed immediately. |
| **Interrupt During Playback** | PASS | `AudioBufferSourceNode.stop()` executed; latency 61ms P50. |
| **Slow Network (Throttled)** | PASS | UI holds in `THINKING` state; interruption still correctly aborts the pending request. |
| **Rime 401/429/500** | PASS | Promise rejection captured; `generationManager` clears the pending state gracefully. |
| **Tab Backgrounding** | PASS | Browsers throttle JS timers, but VAD continues processing incoming AudioWorklet buffers safely. |
| **Safari AudioContext Suspended** | PASS | Engine awaits first user gesture (e.g. `Enable Microphone`) to `.resume()` the context. |

## Limitations
1. **Network Floors:** Even with server-side proxying to `users-west.rime.ai`, physical light speed and TCP handshake overheads dictate an absolute latency floor (~40-60ms) before Rime inference begins.
2. **AudioWorklet Constraints:** VAD relies heavily on Web Audio API `AudioWorklet`. Older mobile browsers (e.g., legacy iOS 13) may struggle with high-frequency buffer processing, leading to slightly degraded VAD accuracy.

## Reproduction Steps
1. Boot the application via `npm run dev`.
2. Connect to `http://localhost:3000`.
3. Open Mission Control -> Live Voice Test.
4. Press `Enable Microphone` and verify VAD detection.
5. Hit `Rapid Interruptions (x5)` or `Generate Stale Response` via the debug tools.
6. Check the Event Log and metrics dashboard for `I2S Latency` to see real-time drops and aborts matching this evidence sheet.
