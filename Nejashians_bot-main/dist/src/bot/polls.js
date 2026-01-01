"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookLog = exports.updateSalawatTotal = exports.sendDailyPoll = void 0;
const bot_1 = require("./bot");
const client_1 = require("../prisma/client");
const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID);
const sendDailyPoll = async () => {
    // salawat poll
    await bot_1.bot.sendPoll(GROUP_CHAT_ID, "How many Salawat do you send today?", ["10", "20", "100", "200", "300"], { is_anonymous: true, allows_multiple_answers: false });
    // Book poll
    await bot_1.bot.sendPoll(GROUP_CHAT_ID, "Did you read the book today?", ["Yes", "No"], { is_anonymous: false });
};
exports.sendDailyPoll = sendDailyPoll;
// Update collective Salawat total
const updateSalawatTotal = async (count) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await client_1.prisma.salawatCollection.findUnique({ where: { date: new Date(today) } });
    if (existing) {
        await client_1.prisma.salawatCollection.update({
            where: { date: new Date(today) },
            data: { total: existing.total + count }
        });
    }
    else {
        await client_1.prisma.salawatCollection.create({ data: { date: new Date(today), total: count } });
    }
};
exports.updateSalawatTotal = updateSalawatTotal;
// Update book log for user
const updateBookLog = async (telegramId, name, optionIndex) => {
    const today = new Date();
    const status = optionIndex === 0 ? "READER" : "MASTER_READER";
    await client_1.prisma.user.upsert({
        where: { telegramId: String(telegramId) },
        update: {},
        create: { telegramId: String(telegramId), name }
    });
    await client_1.prisma.bookLog.create({
        data: {
            user: { connect: { telegramId: String(telegramId) } },
            date: today,
            pages: 0,
            status
        }
    });
};
exports.updateBookLog = updateBookLog;
