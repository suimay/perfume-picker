import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRouter from "./routes/auth.js";
import perfumesRouter from "./routes/perfumes.js";
import weatherRouter from "./routes/weather.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../frontend");

app.use(express.static(frontendDir));

app.use("/api", authRouter);
app.use("/api", perfumesRouter);
app.use("/api", weatherRouter);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`HYANG server listening on port ${PORT}`);
});
