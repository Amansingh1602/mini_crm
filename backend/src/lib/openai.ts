import OpenAI from 'openai';
import { env } from '../config/env';

let groqClient: OpenAI | null = null;

export function getGroqClient(): OpenAI {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: env.GROQ_BASE_URL,
    });
  }
  return groqClient;
}

export default getGroqClient;
