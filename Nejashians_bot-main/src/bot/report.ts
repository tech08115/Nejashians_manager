import { prisma } from "../prisma/client";
import { bot } from "./bot";

const PAGES_PER_DAY = Number(process.env.PAGES_PER_DAY || 6);

export const reportSalawat = async (chatId: number, type: "daily" | "weekly") => {
  let start: Date;
  const today = new Date();
  if(type === "daily") {
    start = new Date(today);
    start.setHours(0,0,0,0);
  } else {
    start = new Date(today);
    start.setDate(today.getDate() - 7);
  }

  const total = await prisma.salawatCollection.aggregate({
    _sum: { total: true },
    where: { date: { gte: start, lte: today } }
  });

  await bot.sendMessage(chatId, `Your Path of Barakah –  ${type === "daily" ? "today's Salawat Summary" : "this week's Salawat Summary"}:\n You have sent ${total._sum.total || 0} Salawat.`);
};

export const reportBookReaders = async (chatId: number, type: "daily" | "weekly") => {
  let start: Date;
  const today = new Date();
  if(type === "daily") {
    start = new Date(today);
    start.setHours(0,0,0,0);
  } else {
    start = new Date(today);
    start.setDate(today.getDate() - 7);
    start.setHours(0,0,0,0);
  }

  // Fetch logs in range with user info
  const logs = await prisma.bookLog.findMany({
    where: { date: { gte: start, lte: today } },
    include: { user: true }
  });

  // Group by user
  const byUser: Record<string, { name: string; totalPages: number; daysActive: Set<string>; dates: Date[]; currentStreak?: number; longestStreak?: number }> = {};
  for (const log of logs) {
    const key = log.user.telegramId;
    if (!byUser[key]) {
      byUser[key] = { name: log.user.name, totalPages: 0, daysActive: new Set<string>(), dates: [], currentStreak: log.user.currentStreak, longestStreak: log.user.longestStreak };
    }
    byUser[key].totalPages += log.pages;
    const dayKey = log.date.toISOString().split('T')[0];
    if (log.pages > 0) {
      byUser[key].daysActive.add(dayKey);
    }
    byUser[key].dates.push(log.date);
  }

  // Compute streak (consecutive active days up to today) for weekly only
  function computeStreak(days: Set<string>): number {
    let streak = 0;
    const date = new Date(today);
    date.setHours(0,0,0,0);
    while (true) {
      const dayKey = date.toISOString().split('T')[0];
      if (days.has(dayKey)) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  // Sort by totalPages descending for nicer ranking output
  const usersSorted = Object.values(byUser).sort((a, b) => b.totalPages - a.totalPages);
  const lines: string[] = [];
  usersSorted.forEach(u => {
    const computedStreak = type === 'weekly' ? computeStreak(u.daysActive) : (u.daysActive.size > 0 ? 1 : 0);
    const current = u.currentStreak ?? computedStreak;
    const longest = u.longestStreak ?? current;
    // Telegram Markdown: bold name and pages for emphasis
    lines.push(`*${u.name}*: *${u.totalPages}* pages — ${u.daysActive.size} day(s) active — current ${current} — longest ${longest}`);
  });

  const header = `*Reading Progress Spotlight – Weekly Rankings* ${type === 'daily' ? '*today*' : '*this week*'} (pages/day = ${PAGES_PER_DAY})`;
  const body = lines.length ? lines.join('\n') : 'No readers yet.';
  await bot.sendMessage(chatId, `${header}\n${body}`, { parse_mode: 'Markdown' });
};

