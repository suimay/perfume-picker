// 파일: backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRouter from "./routes/auth.js";
import perfumesRouter from "./routes/perfumes.js";
import bookmarksRouter from "./routes/bookmarks.js";
import weatherRouter from "./routes/weather.js";

dotenv.config();

const app = express();

// 요청 로깅 미들웨어
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONT_DIR = path.resolve(__dirname, "../frontend");

// 정적 파일 서빙
app.use(express.static(FRONT_DIR));

// API 라우터 연결
app.use("/api", authRouter);
app.use("/api", perfumesRouter);
app.use("/api", bookmarksRouter);
app.use("/api", weatherRouter);

// 루트 요청은 index.html 반환
app.get("/", (_req, res) => {
  res.sendFile(path.join(FRONT_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`HYANG 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
