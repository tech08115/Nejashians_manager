"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const polls_1 = require("../bot/polls");
const report_1 = require("../bot/report");
const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID);
// Daily at 8 AM
node_cron_1.default.schedule("0 8 * * *", async () => {
    await (0, polls_1.sendDailyPoll)();
    await (0, report_1.reportSalawat)(GROUP_CHAT_ID, "daily");
});
// Weekly on Sunday at 8 AM
node_cron_1.default.schedule("0 8 * * 0", async () => {
    //   await sendWeeklyPoll();
    await (0, report_1.reportSalawat)(GROUP_CHAT_ID, "weekly");
});
