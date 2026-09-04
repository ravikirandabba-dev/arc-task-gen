"use client";

import React, { Component, ReactNode } from "react";
import { VoiceEngineError } from "@/lib/errors";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isEngineError = this.state.error instanceof VoiceEngineError;
      
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 font-mono">
          <div className="max-w-2xl border border-red-500/30 bg-red-950/20 p-8 rounded-lg flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-red-400">System Failure</h1>
            <p className="text-white/70">The VoicePilot AI Engine encountered an unrecoverable state.</p>
            
            <div className="bg-black/50 p-4 rounded text-sm text-red-300 font-mono overflow-auto border border-red-900/50">
              {isEngineError && <div className="font-bold mb-2">Code: {(this.state.error as VoiceEngineError).code}</div>}
              {this.state.error?.message}
            </div>
            
            <button
              className="mt-4 px-6 py-2 bg-red-900/40 text-red-200 border border-red-700/50 rounded hover:bg-red-800/40 transition-colors self-start"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reboot Engine
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
