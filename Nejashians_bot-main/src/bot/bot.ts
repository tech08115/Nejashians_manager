import TelegramBot from "node-telegram-bot-api";
import { updateSalawatTotal, setSalawatTotal, updateBookLog } from "./polls";
import { isSalawatPoll, isBookPoll, registerPoll } from './pollRegistry';
import { mapOptionToCount } from "../utils/helpers";

console.log("🔹 Starting bot...");

const token = process.env.TELEGRAM_BOT_TOKEN!;
export const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (err) => {
  console.error("❌ Polling error:", err);
});



// Optional startup message to verify bot works
const targetChatId = Number(process.env.GROUP_CHAT_ID);
if (targetChatId) {
  bot.sendMessage(targetChatId,  "✅ Bot is online and listening.", { message_thread_id: Number(process.env.SALAWAT_TOPIC_ID) }).catch(() => {});
}


// Poll answer handling (collective Salawat + individual book)
bot.on("poll_answer", async (answer) => {
  const userId = answer.user.id;
  const optionIndexes = answer.option_ids || [];
  // Sum all selected options (supports multiple answers)
  const count = optionIndexes.reduce((sum, idx) => sum + mapOptionToCount(idx), 0);

  if (isSalawatPoll(answer.poll_id)) {
    await updateSalawatTotal(count);

  } else if (isBookPoll(answer.poll_id)) {
    // For book poll we still pass the first option index (Yes/No)
    const first = optionIndexes[0] ?? 0;
    await updateBookLog(userId, answer.user.first_name, first);
  }
});

// Poll snapshot updates: compute total as sum(option.value * voter_count)
bot.on("poll", async (poll) => {
  if (!poll?.id) return;
  // Try to classify and register polls when received, in case sendPoll didn't populate poll.id
  const optionsText = (poll.options || []).map(o => String(o.text).trim());
  const allNumeric = optionsText.every(t => /^\d+$/.test(t));
  const isYesNo = optionsText.length === 2 && optionsText[0].toLowerCase() === 'yes' && optionsText[1].toLowerCase() === 'no';

  if (allNumeric && poll.is_anonymous && poll.allows_multiple_answers) {
    registerPoll(poll.id, 'SALAWAT');
  } else if (isYesNo && !poll.is_anonymous) {
    registerPoll(poll.id, 'BOOK');
  }

  if (!isSalawatPoll(poll.id)) return;

  const total = (poll.options || []).reduce((acc, opt) => {
    const value = parseInt(String(opt.text), 10);
    const num = Number.isFinite(value) ? value : 0;
    return acc + num * (opt.voter_count || 0);
  }, 0);

  await setSalawatTotal(total);
});

// Simple command handlers
bot.on('message', async (msg) => {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const parts = text.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = (parts[1] || '').toLowerCase();

  // /book_report [daily|weekly]
  if (cmd === '/book_report') {
    const scope = arg === 'weekly' ? 'weekly' : 'daily';
    const { reportBookReaders } = await import('./report');
    await reportBookReaders(chatId, scope as 'daily' | 'weekly');
  }

  // /salawat_report [daily|weekly]
  if (cmd === '/salawat_report') {
    const scope = arg === 'weekly' ? 'weekly' : 'daily';
    const { reportSalawat } = await import('./report');
    await reportSalawat(chatId, scope as 'daily' | 'weekly');
  }
});
