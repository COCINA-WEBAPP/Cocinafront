import { api } from "./api";

export type ChefBotRole = "user" | "assistant";

export interface ChefBotMessage {
  role: ChefBotRole;
  content: string;
}

export async function sendChefBotMessage(
  messages: ChefBotMessage[],
  recipeId?: string,
): Promise<string> {
  const res = await api.post<{ reply: string }>("/chefbot/message", {
    messages,
    ...(recipeId ? { recipeId } : {}),
  });
  return res.reply;
}
