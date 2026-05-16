import { api } from "./api";

export type ChefBotRole = "user" | "assistant";

export interface ChefBotMessage {
  role: ChefBotRole;
  content: string;
}

export async function sendChefBotMessage(
  messages: ChefBotMessage[],
): Promise<string> {
  const res = await api.post<{ reply: string }>("/chefbot/message", {
    messages,
  });
  return res.reply;
}
