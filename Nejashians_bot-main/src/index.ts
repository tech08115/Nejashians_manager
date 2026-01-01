import express from "express";
import "./bot/bot";
import "./cron/scheduler";


const app = express();
app.use(express.json());

app.get("/", (_, res) => res.send("Fatawa bot is running!"));

// Start server
app.listen(3000, () => {
  console.log("Server running...");
});
