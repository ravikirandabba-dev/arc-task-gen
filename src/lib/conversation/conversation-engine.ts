import { voiceSessionManager } from "../voice-session-manager";
import { conversationMemory } from "./conversation-memory";
import { intentAnalyzer } from "./intent-analyzer";
import { promptBuilder } from "./prompt-builder";
import { DevelopmentLLMProvider } from "../providers/development-llm-provider";
import { AssistantResponse, ConversationTurn, UserMessage } from "@/types/conversation";
import { TurnId, SessionId, GenerationId } from "@/types/interrupt";
import { eventBus } from "../event-bus";

export class ConversationEngine {
  private llmProvider = new DevelopmentLLMProvider();

  public async processUserAudio(
    audioBlob: Blob | null,
    turnId: TurnId,
    sessionId: SessionId,
    generationId: GenerationId
  ): Promise<AssistantResponse | null> {
    
    // Simulate STT decoding since we do not have a real STT provider yet
    const turnCount = conversationMemory.getRecentTurns().length;
    let simulatedTranscribedText = "Hello!";
    if (turnCount === 0) simulatedTranscribedText = "How do I make the carbonara?";
    else if (turnCount === 1) simulatedTranscribedText = "Wait, how much cheese did you say?";
    else simulatedTranscribedText = "Okay, what is the next step?";

    // 1. Analyze Intent
    const intentAnalysis = await intentAnalyzer.analyze(simulatedTranscribedText);
    
    // 2. Build User Message Record
    const userMsg: UserMessage = {
      id: `msg_u_${crypto.randomUUID()}`,
      timestamp: performance.now(),
      turnId,
      sessionId,
      role: "user",
      content: simulatedTranscribedText,
      metadata: { intent: intentAnalysis },
      interrupted: false,
      cancelled: false,
      recovered: false
    };

    // 3. Update Conversation Memory
    const turn: ConversationTurn = {
      turnId,
      sessionId,
      startedAt: performance.now(),
      userMessage: userMsg,
      status: "active"
    };
    conversationMemory.addTurn(turn);
    
    // 4. Build Prompt
    const prompt = promptBuilder.buildPrompt(conversationMemory.getRecentTurns(), simulatedTranscribedText);

    try {
      // 5. Generate LLM Response
      const response = await this.llmProvider.generate(prompt, turnId, sessionId, generationId);
      
      // Check for staleness post-generation
      if (voiceSessionManager.isStale(generationId)) {
         turn.status = "cancelled";
         return null;
      }
      
      // 6. Finalize Turn in Memory
      turn.assistantMessage = {
        id: response.id,
        timestamp: response.createdAt,
        turnId,
        sessionId,
        role: "assistant",
        content: response.text,
        generationId,
        metadata: {},
        interrupted: false,
        cancelled: false,
        recovered: false
      };
      turn.status = "completed";

      return response;
    } catch (e) {
      turn.status = "cancelled";
      throw e;
    }
  }

  public handleInterruption(turnId: TurnId): void {
    conversationMemory.markInterruption(turnId);
    
    const turns = conversationMemory.getRecentTurns();
    const active = turns.find(t => t.turnId === turnId);
    if (active) {
      active.status = "interrupted";
      if (active.assistantMessage) active.assistantMessage.interrupted = true;
    }
  }

  public handleRecovery(turnId: TurnId): void {
    conversationMemory.markRecovery(turnId);
    eventBus.emit("TURN_RECOVERED", { timestamp: performance.now(), turnId });
  }

  public cancelGeneration(generationId: GenerationId): void {
    this.llmProvider.cancel(generationId);
  }
}

export const conversationEngine = new ConversationEngine();

