// 파일: backend/routes/preferences.js
import express from "express";

import { pool } from "../db.js";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

// 내 선호/비선호 조회
router.get("/preferences", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT n.id AS noteId, n.name, up.type
       FROM user_preferences up
       JOIN notes n ON up.note_id = n.id
       WHERE up.user_id = ?`,
      [userId]
    );
    return res.json({ success: true, preferences: rows });
  } catch (error) {
    console.error("[preferences] get error:", error);
    return res
      .status(500)
      .json({ success: false, message: "선호 정보를 불러오지 못했습니다." });
  }
});

// 선호/비선호 저장
router.post("/preferences", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { likes = [], dislikes = [] } = req.body ?? {};

  try {
    const ensureNoteIds = async (names) => {
      const ids = [];
      for (const name of names) {
        if (!name) continue;
        await pool.query("INSERT IGNORE INTO notes (name) VALUES (?)", [name]);
        const [row] = await pool.query("SELECT id FROM notes WHERE name = ?", [name]);
        if (row[0]) ids.push(row[0].id);
      }
      return ids;
    };

    const likeIds = await ensureNoteIds(likes);
    const dislikeIds = await ensureNoteIds(dislikes);

    await pool.query("DELETE FROM user_preferences WHERE user_id = ?", [userId]);

    const values = [
      ...likeIds.map((id) => [userId, id, "LIKE"]),
      ...dislikeIds.map((id) => [userId, id, "DISLIKE"]),
    ];

    if (values.length) {
      await pool.query(
        "INSERT INTO user_preferences (user_id, note_id, type) VALUES ?",
        [values]
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[preferences] post error:", error);
    return res
      .status(500)
      .json({ success: false, message: "선호 정보를 저장하지 못했습니다." });
  }
});

export default router;

