import LLMPkg from "llmpkg";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SendMessageOptions {
  messages: Message[];
  maxTokens?: number;
}

export interface StructuredMessage {
  explanation: string;
  decision: boolean;
}

export async function sendMessage({
  messages,
  maxTokens = 3000,
}: SendMessageOptions): Promise<StructuredMessage> {
  const llmpkg = new LLMPkg({
    apiKey: process.env.LLM_API_KEY,
  });

  const completion = await llmpkg.completions({
    model: process.env.MODEL,
    messages: messages,
    tools: [
      {
        type: "function",
        function: {
          name: "approveTransfer",
          description:
            "Approve the money transfer request and provide explanation",
          parameters: {
            type: "object",
            properties: {
              explanation: {
                type: "string",
                description:
                  "Explanation for why the money transfer is approved",
              },
            },
            required: ["explanation"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "rejectTransfer",
          description:
            "Reject the money transfer request and provide explanation",
          parameters: {
            type: "object",
            properties: {
              explanation: {
                type: "string",
                description:
                  "Explanation for why the money transfer is rejected",
              },
            },
            required: ["explanation"],
          },
        },
      },
    ],
  });

  const toolCall = completion.messages[0].tool_calls?.[0];

  if (!toolCall) {
    // If no tool call, use the model's response as explanation and default to reject
    return {
      explanation: completion.messages[0].content || "Transfer rejected",
      decision: false,
    };
  }

  const args = JSON.parse(toolCall.function.arguments);

  return {
    explanation: args.explanation,
    decision: toolCall.function.name === "approveTransfer",
  };
}
