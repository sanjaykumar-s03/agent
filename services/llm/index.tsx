import LLMPkg from "llmpkg";
import { zodResponseFormat } from "llmpkg/helpers/zod";
import { z } from "zod";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SendMessageOptions {
  messages: Message[];
  maxTokens?: number;
}

// Define the message schema once
export const structuredMessageSchema = z.object({
  explanation: z.string(),
  decision: z.boolean(),
});

// Infer the type from the schema
export type StructuredMessage = z.infer<typeof structuredMessageSchema>;

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
    response_format: zodResponseFormat(structuredMessageSchema, "event"),
  });

  console.log("event", completion.choices);
  const event = completion.choices[0].message.parsed;

  if (!event) {
    throw new Error("Failed to parse LLM response");
  }
  return event;
}
