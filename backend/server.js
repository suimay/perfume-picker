// 파일: backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import session from "express-session";

import authRouter from "./routes/auth.js";
import perfumesRouter from "./routes/perfumes.js";
import bookmarksRouter from "./routes/bookmarks.js";
import weatherRouter from "./routes/weather.js";
import preferencesRouter from "./routes/preferences.js";
import recommendationsRouter from "./routes/recommendations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/.env를 확실히 불러오도록 경로 고정
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// 요청 로깅 미들웨어
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hyang-dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

const FRONT_DIR = path.resolve(__dirname, "../frontend");

// 정적 파일 서빙
app.use(express.static(FRONT_DIR));

// API 라우터 연결
app.use("/api", authRouter);
app.use("/api", perfumesRouter);
app.use("/api", bookmarksRouter);
app.use("/api", weatherRouter);
app.use("/api", preferencesRouter);
app.use("/api", recommendationsRouter);

// 루트 요청은 index.html 반환
app.get("/", (_req, res) => {
  res.sendFile(path.join(FRONT_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`HYANG 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
