export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolRegistryInterface {
  register(tool: ToolSchema): void;
  getTools(): ToolSchema[];
  hasTool(name: string): boolean;
  execute(name: string, args: Record<string, unknown>): Promise<unknown>;
}

export class ToolRegistry implements ToolRegistryInterface {
  private tools = new Map<string, ToolSchema>();

  public register(tool: ToolSchema): void {
    this.tools.set(tool.name, tool);
  }

  public getTools(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public async execute(name: string): Promise<unknown> {
    if (!this.hasTool(name)) {
      throw new Error(`Tool ${name} not found`);
    }
    // Phase 8: Execution is a placeholder for future implementations
    return { success: true, message: `Simulated execution of tool: ${name}` };
  }
}

export const toolRegistry = new ToolRegistry();

// Pre-register future supported tools as requested
toolRegistry.register({ name: "Calculator", description: "Mathematical calculations", parameters: {} });
toolRegistry.register({ name: "Calendar", description: "Manage events and schedule", parameters: {} });
toolRegistry.register({ name: "Search", description: "Web search", parameters: {} });
toolRegistry.register({ name: "Browser", description: "Interact with web pages", parameters: {} });
toolRegistry.register({ name: "Reminder", description: "Set time-based reminders", parameters: {} });
toolRegistry.register({ name: "Notes", description: "Save and retrieve notes", parameters: {} });
toolRegistry.register({ name: "Weather", description: "Check current weather", parameters: {} });
toolRegistry.register({ name: "Files", description: "Read/write local files", parameters: {} });
