# VoicePilot AI Testing Guide

This document outlines the testing protocols for the Interruption & Recovery Engine (Phase 5).

## Overview
VoicePilot AI currently uses a **DEVELOPMENT AUDIO ADAPTER** mapping to native Web Audio API oscillators to simulate voice playback. Real Rime integration is deferred to a future phase once credentials are provisioned.

## Browser Requirements
- A modern browser supporting `navigator.mediaDevices.getUserMedia`.
- A browser supporting `AudioContext` and `MediaStreamAudioSourceNode` for real-time RMS extraction (VAD).

## Microphone Permission Flow
1. The user must manually click **"Enable Microphone"**.
2. The browser prompts for `audio` permissions.
3. Once granted, `navigator.mediaDevices.getUserMedia()` provisions the stream with `echoCancellation`, `noiseSuppression`, and `autoGainControl` enabled.
4. If denied, the UI securely defaults to the `DENIED` status.

## Manual Tests Supported via UI
### 1. Manual Interruption Test
- Click **"Start Test Audio"** (Engine transitions to `LISTENING` -> `THINKING` -> `SPEAKING`).
- Once playback (PLAYING) begins, click **"Manual Interrupt"**.
- The engine will immediately invalidate the Turn Fence, invoke Web Audio API `stop()`, flush queues, and verify latency to `<150ms`.

### 2. Rapid Interruption Test
- Click **"Rapid Interruptions (x5)"**.
- The engine will violently toggle between `LISTENING` and `INTERRUPTED` states in rapid succession, verifying state-machine resilience and ensuring no paradox states are triggered.

### 3. Stale-Result Test
- Click **"Generate Stale Response"**.
- This tests whether an older async operation arriving late will erroneously play.
- Expected Result: The `TurnManager` intercepts the payload, drops it, and increments the **"Dropped Stale Responses"** counter without triggering playback.

## Acceptance Threshold
The strict acceptance threshold for an interruption sequence (VAD Trigger -> Playback Stop) is configurable in `src/config/voice.ts`.
- **Target Threshold:** `150ms`

## Known Echo Limitations
While we request `echoCancellation: true`, hardware echo cancellation is rarely perfect. 
If testing through loud external speakers, the Web Audio Oscillator tone may bleed back into the microphone, triggering a false-positive VAD detection. It is recommended to test with headphones or moderately-low volume until a dedicated LLM contextual filtering layer is developed.
