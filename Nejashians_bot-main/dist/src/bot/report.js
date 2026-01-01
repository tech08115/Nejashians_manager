"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportSalawat = void 0;
const client_1 = require("../prisma/client");
const bot_1 = require("./bot");
const reportSalawat = async (chatId, type) => {
    let start;
    const today = new Date();
    if (type === "daily") {
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
    }
    else {
        start = new Date(today);
        start.setDate(today.getDate() - 7);
    }
    const total = await client_1.prisma.salawatCollection.aggregate({
        _sum: { total: true },
        where: { date: { gte: start, lte: today } }
    });
    await bot_1.bot.sendMessage(chatId, `Total Salawat ${type === "daily" ? "today" : "this week"}: ${total._sum.total || 0}`);
};
exports.reportSalawat = reportSalawat;
