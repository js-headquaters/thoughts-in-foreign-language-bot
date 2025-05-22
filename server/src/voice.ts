import { OpenAI } from "openai";

import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_TOKEN,
});

export async function audioToText(
  audioFileUrl: string,
  userId: number
): Promise<{ answer: string; cost: number } | null> {
  const audioFileResponse = await fetch(audioFileUrl);

  console.log(`Sending audio to Whisper, {userId: ${userId}}`);

  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioFileResponse,
    response_format: "verbose_json",
    language: "ru",
  });

  const cost = getWhisperCost(Number(response.duration));

  console.log(`Estimated audio parsing cost ${userId}: $${cost.toFixed(4)}`);

  const answer = response.text;
  console.log(`Received answer from Whisper, {userId: ${userId}}`, answer);

  return { answer, cost };
}

function getWhisperCost(durationInSeconds: number): number {
  const durationInMinutes = Math.ceil(durationInSeconds / 60);
  return durationInMinutes * 0.006;
}
