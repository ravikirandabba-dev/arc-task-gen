# VoicePilot AI - Real-time Cooking Execution Assistant

**Team Members:** Ravi Kiran, Aneesh, and Koushik


VoicePilot AI is a voice-native cooking execution assistant designed for hands-busy environments. It solves the critical hard problem of **real-time interruption and recovery**, allowing users to interrupt the AI mid-sentence to correct instructions or ask questions, without suffering from audio overlap or stale network state loops.

## Architecture

The system is built on a decoupled, event-driven architecture using Next.js 15:
1. **Microphone Manager:** Raw WebAudio capture with debounced Voice Activity Detection (VAD).
2. **Interrupt Engine:** The central Finite State Machine (FSM) that dictates \LISTENING\ -> \THINKING\ -> \SPEAKING\ -> \INTERRUPTED\ -> \RECOVERING\.
3. **Turn Fencing (Voice Session Manager):** Drops "stale" asynchronous callbacks from network payloads that arrive after an interruption.
4. **Playback Controller:** Strict, latency-measured WebAudio playback wrapper.
5. **TTS Proxy:** Secure Next.js backend proxy (\/api/speech\) securely handling third-party API limits and keys.

## Setup Instructions

1. Clone the repository.
2. Ensure you are running Node.js >= 18.
3. Duplicate \.env.example\ to \.env\ and add your keys:
   \\\ash
   cp .env.example .env
   \\\
   Fill in \RIME_API_KEY=\<YOUR_KEY>\.
4. Install dependencies:
   \\\ash
   npm install
   \\\
5. Build and run the production server:
   \\\ash
   npm run build
   npm run start
   \\\
6. Navigate to \http://localhost:3000\.

## Third-party Services & Configurations

- **TTS Provider:** Rime AI
- **Rime Model ID:** \mistv2\
- **Speaker:** \peak\
- **Language:** \en\
- **Endpoint:** \https://users.rime.ai/v1/rime-tts\
- **Audio Format:** \udio/mp3\ (consumed via chunks directly into WebAudio \decodeAudioData\)
- **Transport:** HTTPS POST

## Known Limitations & Failure Behaviors

- **Mocked STT/LLM:** The current repository provides a local \DevelopmentLLMProvider\ with simulated Cooking Assistant responses to allow strict focus on the TTS audio pipeline without needing additional expensive LLM API keys.
- **Hardware Silence Latency:** Depending on the browser (Chrome vs Safari) and OS audio driver, WebAudio \source.stop()\ can occasionally drop the \onended\ event entirely. We implemented a 25ms failsafe timeout.
- **Network Failures:** If the Rime API is unreachable or returns a 5xx error, the generation is aborted, the FSM transitions gracefully back to \LISTENING\, and the system logs a \GENERATION_ERROR\.

