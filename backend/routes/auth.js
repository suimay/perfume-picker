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

    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [email, passwordHash, nickname]
    );

    req.session.userId = result.insertId;
    return res
      .status(201)
      .json({ success: true, user: { id: result.insertId, email, nickname } });
  } catch (error) {
    console.error("[auth] register error:", error);
    return res
      .status(500)
      .json({ success: false, message: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

// 로그인 엔드포인트 (평문 비밀번호 비교 버전)
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, email, password_hash, nickname FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const user = rows[0];
    // 현재는 해시가 아닌 평문이라고 가정하고 문자열 비교
    if (password !== user.password_hash) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    req.session.userId = user.id;
    return res.json({
      success: true,
      user: { id: user.id, email: user.email, nickname: user.nickname },
    });
  } catch (error) {
    console.error("[auth] login error:", error);
    return res.status(500).json({ error: "서버 오류" });
  }
});

// 로그아웃 엔드포인트
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
