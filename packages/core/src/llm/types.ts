export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCall[] }
  | { role: "tool"; content: string; toolCallId: string; name: string };

export interface ToolSpec {
  name: string;
  description: string;
  /** JSON schema of the arguments object. */
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolSpec[];
  temperature?: number;
  json?: boolean;
  signal?: AbortSignal;
  onToken?: (delta: string) => void;
}

export interface ChatResponse {
  content: string;
  toolCalls: ToolCall[];
}

export interface ModelInfo {
  name: string;
  size?: number;
  family?: string;
}

export interface Provider {
  readonly name: string;
  chat(req: ChatRequest): Promise<ChatResponse>;
  embed(model: string, input: string[]): Promise<number[][]>;
  models(): Promise<ModelInfo[]>;
  ping(): Promise<boolean>;
}
