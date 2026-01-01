"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const polls_1 = require("./polls");
const helpers_1 = require("../utils/helpers");
const token = process.env.TELEGRAM_BOT_TOKEN;
exports.bot = new node_telegram_bot_api_1.default(token, { polling: true });
// Poll answer handling (collective Salawat + individual book)
exports.bot.on("poll_answer", async (answer) => {
    const userId = answer.user.id;
    const optionIndex = answer.option_ids[0];
    // Example: map poll to count
    const count = (0, helpers_1.mapOptionToCount)(optionIndex);
    // Update Salawat collective
    if (answer.poll_id.startsWith("SALAWAT")) {
        await (0, polls_1.updateSalawatTotal)(count);
    }
    // Book poll handling
    else if (answer.poll_id.startsWith("BOOK")) {
        await (0, polls_1.updateBookLog)(userId, answer.user.first_name, optionIndex);
    }
});
