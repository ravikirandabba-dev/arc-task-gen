import { VoiceEngineState } from "@/types/voice";

/**
 * Valid state transitions for the full-duplex voice engine.
 */
const VALID_TRANSITIONS: Record<VoiceEngineState, Set<VoiceEngineState>> = {
  [VoiceEngineState.IDLE]: new Set([VoiceEngineState.LISTENING, VoiceEngineState.ERROR]),
  [VoiceEngineState.LISTENING]: new Set([VoiceEngineState.PROCESSING, VoiceEngineState.IDLE, VoiceEngineState.ERROR]),
  [VoiceEngineState.PROCESSING]: new Set([VoiceEngineState.SPEAKING, VoiceEngineState.INTERRUPTED, VoiceEngineState.ERROR]),
  [VoiceEngineState.SPEAKING]: new Set([VoiceEngineState.INTERRUPTED, VoiceEngineState.IDLE, VoiceEngineState.ERROR]),
  [VoiceEngineState.INTERRUPTED]: new Set([VoiceEngineState.RECOVERING, VoiceEngineState.ERROR]),
  [VoiceEngineState.RECOVERING]: new Set([VoiceEngineState.LISTENING, VoiceEngineState.PROCESSING, VoiceEngineState.IDLE, VoiceEngineState.ERROR]),
  [VoiceEngineState.ERROR]: new Set([VoiceEngineState.IDLE]),
};

/**
 * Finite State Machine for managing Voice Engine states and enforcing transition guards.
 */
export class VoiceStateMachine {
  private currentState: VoiceEngineState;
  private stateChangeListeners: Array<(state: VoiceEngineState) => void> = [];

  constructor(initialState: VoiceEngineState = VoiceEngineState.IDLE) {
    this.currentState = initialState;
  }

  /**
   * Returns the current state of the engine.
   */
  public getState(): VoiceEngineState {
    return this.currentState;
  }

  /**
   * Checks if a transition to the target state is allowed by the guards.
   */
  public canTransition(targetState: VoiceEngineState): boolean {
    const allowed = VALID_TRANSITIONS[this.currentState];
    return allowed.has(targetState);
  }

  /**
   * Attempts to transition to a new state.
   * @param targetState The desired next state.
   * @throws Error if the transition is invalid.
   */
  public transition(targetState: VoiceEngineState): void {
    if (!this.canTransition(targetState)) {
      throw new Error(`Invalid state transition from ${this.currentState} to ${targetState}`);
    }
    this.currentState = targetState;
    this.notifyListeners();
  }

  /**
   * Subscribes to state changes.
   */
  public onStateChange(listener: (state: VoiceEngineState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.stateChangeListeners) {
      listener(this.currentState);
    }
  }
}
