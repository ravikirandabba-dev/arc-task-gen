# Conversation Engine

The Conversation Engine acts as the Cognitive Intelligence layer of the application. It sits between Speech-To-Text (Input) and Text-To-Speech (Output).

## Intent Analyzer
An extraction layer that classifies incoming text streams for semantic intent before passing it to the Prompt Builder.

## Conversation Memory
A singleton tracker that maintains rolling histories of `ConversationSession` and `ConversationTurn` objects. It is fully aware of interruptions and labels specific turns as `interrupted: true` so the LLM context window natively understands when the agent was cut off.

## Prompt Builder
Concatenates System Instructions, Tool Schemas, and the rolling Conversation Memory into structured provider payloads.

## Tool Registry
A plugin architecture ready for external integrations (Calendar, Code Execution, Calculator). The LLM Provider can trigger bound tools safely through isolated schema contracts.
