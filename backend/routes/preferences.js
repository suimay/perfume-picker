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
      `SELECT n.name AS note, up.type
       FROM user_preferences up
       JOIN notes n ON up.note_id = n.id
       WHERE up.user_id = ?`,
      [userId]
    );

    const likes = [];
    const dislikes = [];
    rows.forEach(({ note, type }) => {
      if (type === "LIKE") {
        likes.push(note);
      } else if (type === "DISLIKE") {
        dislikes.push(note);
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

  const normalizeList = (list) =>
    Array.from(
      new Set(
        (Array.isArray(list) ? list : [])
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      )
    );

  const likesClean = normalizeList(likes);
  const dislikesClean = normalizeList(dislikes);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("DELETE FROM user_preferences WHERE user_id = ?", [
      userId,
    ]);

    const upsertNoteAndSave = async (noteValue, type) => {
      const noteName = typeof noteValue === "string" ? noteValue.trim() : "";
      if (!noteName) {
        return;
      }

      // notes 테이블에 이름 기준으로 추가하거나 기존 id 재사용
      const [noteResult] = await conn.query(
        "INSERT INTO notes (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
        [noteName]
      );
      const noteId = noteResult.insertId;

      await conn.query(
        "INSERT INTO user_preferences (user_id, note_id, type) VALUES (?, ?, ?)",
        [userId, noteId, type]
      );
    };

    for (const note of likesClean) {
      await upsertNoteAndSave(note, "LIKE");
    }

    for (const note of dislikesClean) {
      await upsertNoteAndSave(note, "DISLIKE");
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
