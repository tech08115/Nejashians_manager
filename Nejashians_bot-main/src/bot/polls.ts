import { bot } from "./bot";
import { registerPoll } from './pollRegistry';
import { prisma } from "../prisma/client";

const PAGES_PER_DAY = Number(process.env.PAGES_PER_DAY || 6);

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID);

export const sendDailyPoll = async () => {
  // Salawat poll
  const salawatMsg = await bot.sendPoll(
    GROUP_CHAT_ID,
    `{إِنَّ اللَّهَ وَمَلائِكَتَهُ يُصَلُّونَ عَلَىٰ النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا}\n\nHow many Salawat did you send on day ${new Date().toISOString().split('T')[0]}?`,
    ["10", "20", "100", "200", "300"],
    { is_anonymous: true, allows_multiple_answers: true, message_thread_id: Number(process.env.SALAWAT_TOPIC_ID) }
  );
  registerPoll(salawatMsg.poll?.id, 'SALAWAT');

  // Book poll
  const bookMsg = await bot.sendPoll(
    GROUP_CHAT_ID,
    "Did you read the book today?",
    ["Yes", "No"],
    { is_anonymous: false, allows_multiple_answers: false, message_thread_id: Number(process.env.BOOK_CHECKUP_TOPIC_ID) }
  );
  registerPoll(bookMsg.poll?.id, 'BOOK');
};

// Update collective Salawat total
export const updateSalawatTotal = async (count: number) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const existing = await prisma.salawatCollection.findUnique({ where: { date: today } });

  if (existing) {
    await prisma.salawatCollection.update({
      where: { date: today },
      data: { total: existing.total + count }
    });
  } else {
    await prisma.salawatCollection.create({ data: { date: today, total: count } });
  }
};

// Set today's Salawat total to an exact value (idempotent snapshot from poll)
export const setSalawatTotal = async (total: number) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const key = { date: today };
  const existing = await prisma.salawatCollection.findUnique({ where: key });

  if (existing) {
    await prisma.salawatCollection.update({ where: key, data: { total } });
  } else {
    await prisma.salawatCollection.create({ data: { date: key.date, total } });
  }
};

// Update book log for user
export const updateBookLog = async (telegramId: number, name: string, optionIndex: number) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const status = optionIndex === 0 ? "READER" : "MASTER_READER"; // adjust if needed

  // Ensure user exists
  const user = await prisma.user.upsert({
    where: { telegramId: String(telegramId) },
    update: { name },
    create: { telegramId: String(telegramId), name }
  });

  // Reading only increments pages when optionIndex indicates 'Yes'
  const increment = optionIndex === 0 ? PAGES_PER_DAY : 0;

  const existing = await prisma.bookLog.findFirst({
    where: { user: { telegramId: String(telegramId) }, date: today }
  });

  if (existing) {
    // Prevent duplicate increments for the same day if already logged reading
    const alreadyCountedToday = existing.pages >= PAGES_PER_DAY;
    const pagesToAdd = !alreadyCountedToday ? increment : 0;
    await prisma.bookLog.update({
      where: { id: existing.id },
      data: { pages: existing.pages + pagesToAdd, status }
    });
  } else {
    await prisma.bookLog.create({
      data: {
        user: { connect: { telegramId: String(telegramId) } },
        date: today,
        pages: increment,
        status
      }
    });
  }

  // Update streaks only when reading occurs today (increment > 0)
  if (increment > 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last = user.lastActiveDate ? new Date(user.lastActiveDate) : undefined;

    // Normalize lastActiveDate to midnight for safe comparison
    if (last) last.setHours(0,0,0,0);

    let newCurrent = user.currentStreak || 0;
    if (!last) {
      newCurrent = 1;
    } else if (last.getTime() === today.getTime()) {
      // Already counted today, keep streak
      newCurrent = user.currentStreak || 1;
    } else if (last.getTime() === yesterday.getTime()) {
      newCurrent = (user.currentStreak || 0) + 1;
    } else {
      newCurrent = 1;
    }

    const newLongest = Math.max(user.longestStreak || 0, newCurrent);

    await prisma.user.update({
      where: { telegramId: String(telegramId) },
      data: {
        lastActiveDate: today,
        currentStreak: newCurrent,
        longestStreak: newLongest,
      },
    });
  }
};
