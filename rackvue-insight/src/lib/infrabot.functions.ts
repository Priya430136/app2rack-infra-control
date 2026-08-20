import { createServerFn } from "@tanstack/react-start";
import api from "./api";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const chatInfraBot = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMessage[] }) => input)
  .handler(async ({ data }) => {
    // Answers (AI if configured, rule-based reference content otherwise) are
    // generated server-side, grounded in the user's real fleet - see
    // server/src/services/infrabot-engine.service.js.
    const { data: res } = await api.post("/infrabot/chat", { messages: data.messages });
    return { reply: res.reply as string, source: res.source as "ai" | "fallback" };
  });
