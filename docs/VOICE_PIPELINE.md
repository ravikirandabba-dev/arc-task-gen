# Voice Pipeline

The Voice Pipeline is the sensory layer of VoicePilot AI, abstracting all Web Audio API complexities away from the cognitive components.

## Microphone Management
The `MicrophoneManager` handles `getUserMedia` requests. It connects a `MediaStreamSource` to an `AnalyserNode` which calculates the Root Mean Square (RMS) of the audio buffer continuously. This drives the simulated Voice Activity Detection (VAD).

## Recording
When VAD goes high, the `RecordingManager` instantiates a `MediaRecorder`, collecting `audio/webm` chunks. Upon silence, it resolves a single consolidated `Blob`.

## Playback
The `PlaybackController` consumes synthesized audio streams. Crucially, it manages its own async decoding context, allowing it to abort playback instantaneously during interruptions without bleeding audio into the next turn.
