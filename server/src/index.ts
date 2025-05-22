import dotenv from "dotenv";
import { audioToText } from "./voice";
import { Context, Telegraf } from "telegraf";
import { Update, Message } from "telegraf/typings/core/types/typegram";
import {
  initializeDatabase,
  saveTranslation,
  getUserSettings,
  createOrUpdateUser,
} from "./db/database";

dotenv.config();

const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
// Grab the Mixpanel factory
// var Mixpanel = require("mixpanel");

// Replace these with your actual tokens
const MODEL = "gpt-4o-2024-08-06";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPEN_AI_TOKEN;
const MIXPANEL_TOKEN = "1bb7b1746414ee14cecf6f8e70123b59";
// var mixpanel = Mixpanel.init(MIXPANEL_TOKEN);

// Initialize OpenAI configuration
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Initialize Telegram Bot
const bot = new Telegraf(TELEGRAM_BOT_TOKEN!);

// Initialize database
let db: any;

async function translateText(text: string, targetLanguage: string = "espanol") {
  const messages = [
    {
      role: "system",
      content: `You are a translator. Translate the following text to ${targetLanguage}. Only respond with the translation, nothing else.`,
    },
    {
      role: "user",
      content: text,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: messages,
  });

  return completion.choices[0].message.content;
}

bot.on("voice", async (ctx: any) => {
  console.log(">> ctx.message", ctx.message);
  const voice = ctx.message.voice;
  const voiceUrl = await ctx.telegram.getFileLink(voice.file_id);
  const llmResponse = await audioToText(voiceUrl.toString(), ctx.from.id);

  if (!llmResponse) {
    await ctx.reply(
      "Пардон, я не понял вас. Если такое повторяется, произошла какая-то ошибка..."
    );
    return;
  }

  const { answer: originalText, cost } = llmResponse;

  if (!originalText) {
    await ctx.reply(
      "Пардон, я не понял вас. Если такое повторяется, произошла какая-то ошибка..."
    );
    return;
  }

  handleText(ctx, originalText);
});

async function handleText(ctx: any, text: string) {
  // Get user settings
  const userSettings = await getUserSettings(db, ctx.from.id);
  if (!userSettings) {
    // Create new user with default settings
    await createOrUpdateUser(db, ctx.from.id);
  }

  // Translate the text
  const translatedText = await translateText(
    text,
    userSettings?.translation_language || "espanol"
  );

  // Save to database
  await saveTranslation(db, ctx.from.id, text, translatedText);

  // Send response to user
  await ctx.reply(`Translation: ${translatedText}`);
}

bot.command("start", async (ctx: Context) => {
  console.log("Bot started");
  const userId = ctx.from?.id;

  if (userId) {
    await createOrUpdateUser(db, userId);
    await ctx.reply(
      "Welcome! I'm ready to translate your voice messages to Spanish. Just send me a voice message!"
    );
  }
});

bot.command("language", async (ctx: Context) => {
  const userId = ctx.from?.id;
  const message = ctx.message as Message.TextMessage;
  const newLanguage = message.text.split(" ")[1];

  if (userId && newLanguage) {
    await createOrUpdateUser(db, userId, newLanguage);
    await ctx.reply(`Language changed to: ${newLanguage}`);
  } else {
    await ctx.reply("Please specify a language. Example: /language espanol");
  }
});

// Handle incoming messages
bot.on("text", async (ctx) => {
  const userMessage = ctx.message?.text;
  handleText(ctx, userMessage);
});

// async function handleText(ctx: Context<Update>, userMessage: string) {
//   const chatId = ctx.from?.id;
//   console.log(">> userMessage", userMessage);

//   // mixpanel.people.set('chatId', {
//   //     $chatId: chatId,
//   //     $name: msg.from.username,
//   // });

//   // Check if the message is the /reset command
//   // if (userMessage === '/reset') {
//   //     // Clear the conversation history for this user
//   //     // mixpanel.track('Reset context', {
//   //     //     distinct_id: chatId,
//   //     // });
//   //     conversationHistory.set(chatId, getRandomNumberInRange(MIN_NUMBER, MAX_NUMBER));
//   //     await bot.sendMessage(chatId, 'Контекст разговора очищен');
//   //     return;
//   // }

//   // mixpanel.track('Send message', {
//   //     distinct_id: chatId,
//   // });

//   const messages = [];

//   // Add user's message to history
//   messages.push({
//     role: "system",
//     content: `Yo estudio español. El número es ${conversationHistory.get(
//       chatId
//     )}. El usuario debe escribir este número en palabras en español (por ejemplo: "uno", "dos", "tres", etc.). Verifica si el usuario escribió el número correctamente y responde en español. Si es correcto, da un ejemplo de una oración usando ese número. Si es incorrecto, explica el error y da la respuesta correcta.`,
//   });
//   messages.push({
//     role: "user",
//     content: `The user wrote the number : ${userMessage}`,
//   });

//   console.log(">> messages", messages);

//   try {
//     // Send conversation history to OpenAI
//     const completion = await openai.chat.completions.create({
//       model: MODEL,
//       messages: messages,
//     });

//     // Get OpenAI's response
//     const aiResponse = completion.choices[0].message.content;

//     // Add AI's response to conversation history
//     // messages.push({ role: "assistant", content: aiResponse });

//     // Send the response back to the user
//     await ctx.reply(aiResponse);

//     sendRandomNumber(ctx);
//   } catch (error) {
//     console.error("Error:", error);
//     await ctx.reply("Sorry, there was an error processing your request.");
//   }
// }

console.log("Bot is running...");

async function main() {
  // Initialize database
  db = await initializeDatabase();
  await bot.launch();
}

main();
