# VoicePilot AI

VoicePilot AI is a next-generation voice interface for controlling complex applications. It leverages a custom-built interruption engine and conversational intelligence layer to provide seamless, full-duplex voice interactions.

## The Problem
Traditional voice assistants act like walkie-talkies. You speak, you wait for them to finish, and if you try to interrupt them, they either ignore you or talk over you. This creates a stilted, frustrating user experience that fails to mimic natural human conversation.

## Why Voice is Essential
For complex workflows—like 3D modeling, coding, or navigating deep software menus—users' hands and eyes are already occupied. Voice provides a high-bandwidth, hands-free interface that can execute multi-step commands instantly.

## The Hard Voice Problem
The challenge isn't just speech-to-text or text-to-speech. The "hard problem" is conversational state management:
- Detecting when a user is interrupting vs. just pausing.
- Immediately halting ongoing audio synthesis and network streams to save bandwidth and compute.
- Flawlessly resetting the conversational context so the AI knows it was cut off.
- Doing all this with ultra-low latency (under 400ms) to feel natural.

## Architecture
VoicePilot AI solves this using a custom Finite State Machine (FSM) Engine:
1. **Microphone/VAD:** Constantly listens for speech energy (RMS).
2. **Interrupt Engine:** Manages states (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `RECOVERING`).
3. **Conversation Intelligence Layer:** Maintains full conversational context, seamlessly invalidating stale responses.
4. **Speech Provider (Rime):** Handles lightning-fast TTS using an `AbortController` network proxy.
5. **Playback Controller:** Safely orchestrates HTML5 AudioContext, dynamically flushing blobs if they become stale.

## Rime Configuration
Rime acts as our primary Speech Provider, delivering sub-200ms latency TTS.
Our Next.js API Proxy (`/api/speech`) securely connects to `https://users.rime.ai/v1/rime-tts` without exposing credentials to the client bundle.

## Installation
```bash
git clone <repo>
cd voice-pilot-ai
npm ci
```

## Environment Variables
Create a `.env.local` file:
```env
RIME_API_KEY=your_rime_api_key_here
```

## Demo Steps
1. Run `npm run dev` and navigate to `http://localhost:3000`.
2. Click **BEGIN DEMO** or manually click **Enable Microphone**.
3. Observe the state changes and live latency metrics on the right dashboard.

## Acceptance Test
- Start the server, enable the microphone.
- Speak out loud: "Hello, this is my first test."
- The system should respond naturally via Rime TTS.
- The latency metric should report < 400ms.

## Stress Test
- Say a long sentence. While the bot is replying, loudly interrupt it.
- Observe the active generation is aborted and dropped.
- The state instantly switches to `RECOVERING` and back to `LISTENING`.

## Limitations
- Mobile Safari enforces strict AudioContext rules, requiring specific user gestures to unlock playback.
- Background tabs in browsers throttle timers, which may delay VAD detection or network polling.
