import cron from "node-cron";
import { sendDailyPoll } from "../bot/polls";
import { reportBookReaders, reportSalawat } from "../bot/report";

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID);
const ENABLE_TWO_MIN_TEST = false;

// Ethiopia timezone (Africa/Addis_Ababa)
const TZ = "Africa/Addis_Ababa";

// Daily poll at 8:00 AM Ethiopia time
cron.schedule("0 8 * * *", async () => {
  await sendDailyPoll();
}, { timezone: TZ });

// Salawat report at 10:00 PM Ethiopia time
cron.schedule("0 22 * * *", async () => {
  await reportSalawat(GROUP_CHAT_ID, "daily");
}, { timezone: TZ });

// Weekly on Sunday at 8:00 AM Ethiopia time
cron.schedule("0 8 * * 0", async () => {
  await reportBookReaders(GROUP_CHAT_ID, "weekly");
  await reportSalawat(GROUP_CHAT_ID, "weekly");
}, { timezone: TZ });

// Optional: run reports every 2 minutes for testing purposes
if (ENABLE_TWO_MIN_TEST) {
  cron.schedule("*/2 * * * *", async () => {
   await sendDailyPoll();
  }, { timezone: TZ });

  cron.schedule("*/2 * * * *", async () => {
    await reportSalawat(GROUP_CHAT_ID, "daily");
    await reportBookReaders(GROUP_CHAT_ID, "daily");
  }, { timezone: TZ });
}
