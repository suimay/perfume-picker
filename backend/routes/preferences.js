// 파일: backend/routes/preferences.js
import express from "express";

import { pool } from "../db.js";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

// 선호/비선호 조회
router.get("/", requireLogin, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.query(
      "SELECT note_key, preference FROM user_note_preferences WHERE user_id = ?",
      [userId]
    );

    const likes = [];
    const dislikes = [];
    rows.forEach(({ note_key: noteKey, preference }) => {
      if (preference === "LIKE") {
        likes.push(noteKey);
      } else if (preference === "DISLIKE") {
        dislikes.push(noteKey);
      }
    });

    return res.json({ likes, dislikes });
  } catch (error) {
    console.error("[preferences][GET] error:", error);
    return res.status(500).json({ error: "선호 정보를 불러오지 못했습니다." });
  }
});

// 선호/비선호 저장
router.post("/", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { likes = [], dislikes = [] } = req.body ?? {};

  if (!Array.isArray(likes) || !Array.isArray(dislikes)) {
    return res
      .status(400)
      .json({ error: "likes와 dislikes는 배열이어야 합니다." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "DELETE FROM user_note_preferences WHERE user_id = ?",
      [userId]
    );

    const insertOne = async (noteKey, preference) => {
      await conn.query(
        "INSERT INTO user_note_preferences (user_id, note_key, preference) VALUES (?, ?, ?)",
        [userId, noteKey, preference]
      );
    };

    for (const note of likes) {
      if (typeof note === "string" && note.trim()) {
        await insertOne(note.trim(), "LIKE");
      }
    }

    for (const note of dislikes) {
      if (typeof note === "string" && note.trim()) {
        await insertOne(note.trim(), "DISLIKE");
      }
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    console.error("[preferences][POST] error:", error);
    return res
      .status(500)
      .json({ error: "선호 정보를 저장하지 못했습니다." });
  } finally {
    conn.release();
  }
});

export default router;

