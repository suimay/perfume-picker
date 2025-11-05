// 파일: backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";

import { pool } from "../db.js";

const router = express.Router();

// 회원가입 엔드포인트
router.post("/register", async (req, res) => {
  const { email, password, nickname } = req.body ?? {};

  if (!email || !password || !nickname) {
    return res
      .status(400)
      .json({ success: false, message: "필수 정보가 누락되었습니다." });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "이미 가입된 이메일입니다." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [email, passwordHash, nickname]
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("[auth] register error:", error);
    return res
      .status(500)
      .json({ success: false, message: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

// 로그인 엔드포인트
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, nickname, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password_hash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        email: userRow.email,
        nickname: userRow.nickname,
      },
    });
  } catch (error) {
    console.error("[auth] login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "로그인 처리 중 오류가 발생했습니다." });
  }
});

export default router;
