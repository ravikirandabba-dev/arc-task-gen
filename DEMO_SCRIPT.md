# VoicePilot AI - Demo Script (4–5 Minutes)

## 0:00–0:30: The Problem
*(Speaker stands on stage. Screen shows a standard voice assistant on a phone.)*
"Everyone uses voice assistants today. But try interrupting one. Try giving it a complex command, changing your mind halfway through, or speaking over it when it starts hallucinating. It's frustrating. It acts like a walkie-talkie, not a human. Traditional voice AI architectures are strictly half-duplex: you speak, you wait, it speaks, you wait."

## 0:30–1:00: Why Voice is Essential
"But in professional settings—coding, 3D modeling, operating complex software—your hands and eyes are occupied. Voice is the ultimate high-bandwidth, hands-free interface. We can't settle for walkie-talkies. We need full-duplex, interruptible, conversational intelligence."

## 1:00–2:00: Live Product
*(Speaker transitions to VoicePilot AI Mission Control screen)*
"This is VoicePilot AI. It runs directly in the browser. I'll click 'Enable Microphone'. Notice the State Machine on the right. 
*(Speaker says: 'Hello, VoicePilot.')*
It immediately shifts from LISTENING, to THINKING, to SPEAKING. Rime TTS brings it to life. The entire round trip happens in milliseconds. It feels like a real conversation."

## 2:00–3:00: Interruption
"Now for the hard part. I'm going to ask it a long question, and then intentionally cut it off."
*(Speaker says: 'Tell me a long story about the history of the universe.')*
*(Bot begins speaking...)*
*(Speaker interrupts loudly: 'Actually, just summarize it in one sentence!')*
"Look at the dashboard. The moment I spoke, the `InterruptEngine` aborted the active network request, flushed the audio queues, dropped the stale text generation, and instantly transitioned to RECOVERING and back to LISTENING. It didn't just stop playing audio—it completely severed the stale computational branches to save bandwidth and compute."

## 3:00–3:45: Engineering Evidence
*(Screen shows RIME_EVIDENCE.md and Telemetry Dashboards)*
"We didn't just build a UI; we built an observability layer. We tracked latency under stress tests. As you can see, our P50 interruption-to-silence latency is strictly under 100ms. Even under rapid-fire speaking and simulated network throttling, our state machine guarantees no crossed wires and no 'zombie' audio clips playing out of turn."

## 3:45–4:30: Rime Integration
"None of this feels real if the voice doesn't sound human or if it takes 2 seconds to generate. We partnered our engine with Rime's ultra-low latency TTS. Our Next.js backend securely proxies the audio stream, while the client decodes chunks dynamically using the Web Audio API. This means we get Rime's sub-200ms TTFB while maintaining complete control to abort the stream client-side via native `AbortController`s."

## 4:30–5:00: Conclusion
"VoicePilot AI proves that voice interfaces don't have to be clunky. With the right architecture—combining a rigorous state machine, robust network abortion, and Rime's flagship models—we can finally talk to computers the way we talk to each other. Thank you."
