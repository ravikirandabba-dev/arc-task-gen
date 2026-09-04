# Interruption Engine

The core innovation of VoicePilot AI lies in its ability to safely process real-time audio overlap.

## Micro-Interruptions
A standard voice agent waits until a prompt is fully synthesized and spoken before listening again. VoicePilot AI keeps the microphone active via `MicrophoneManager` *while* the `PlaybackController` is generating sound (full-duplex).

When the VAD signals a `DETECTED` event, the `InterruptEngine`:
1. Transitions the FSM to `INTERRUPTED`.
2. Triggers `playbackController.flushAudioQueue()`.
3. Commands `voiceSessionManager.invalidateCurrentTurn()`.

## Conversational Fencing
Because LLMs and network TTS operations are asynchronous, a race condition exists where an interrupted query might return text *after* the user has started speaking again.
The `VoiceSessionManager` issues sequential, UUID-based `TurnId` and `GenerationId` pairs. 
When any asynchronous operation finishes, it checks `voiceSessionManager.isStale(generationId)`. If true, the system silently drops the response and emits a `STALE_RESPONSE_DROPPED` telemetry event, preventing auditory collision.
