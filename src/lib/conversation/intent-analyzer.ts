import { IntentAnalysis } from "@/types/conversation";
import { eventBus } from "../event-bus";

export class IntentAnalyzer {
  public async analyze(text: string): Promise<IntentAnalysis> {
    // Phase 8: Placeholder logic mapping raw text to an intent structure.
    // In production, this will hit a fast specialized NLP classification model.
    const lower = text.toLowerCase();
    let intent = "inform";
    let priority: "low" | "normal" | "high" | "critical" = "normal";
    
    if (lower.includes("stop") || lower.includes("cancel") || lower.includes("nevermind")) {
      intent = "abort";
      priority = "critical";
    } else if (lower.includes("urgent") || lower.includes("emergency")) {
      intent = "alert";
      priority = "high";
    } else if (lower.includes("weather") || lower.includes("time") || lower.includes("calculate")) {
      intent = "tool_request";
    }

    const analysis: IntentAnalysis = {
      intent,
      entities: {},
      confidence: 0.85,
      language: "en",
      priority,
      estimatedComplexity: text.length > 50 ? 5 : 1,
      conversationCategory: "general",
    };

    eventBus.emit("CONVERSATION_INTENT_ANALYZED", {
      timestamp: performance.now(),
      intent: analysis.intent,
      confidence: analysis.confidence
    });

    return analysis;
  }
}

export const intentAnalyzer = new IntentAnalyzer();
