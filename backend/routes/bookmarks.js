// 파일: backend/routes/bookmarks.js
import express from "express";

import { pool } from "../db.js";

const router = express.Router();

import { requireLogin } from "../middleware/auth.js";

// 북마크 조회 (향수 정보 포함)
router.get("/bookmarks", requireLogin, async (req, res) => {
  const userId = req.session.userId;

  try {
    const [rows] = await pool.execute(
      `
        SELECT
          b.id AS bookmark_id,
          b.created_at,
          p.id AS perfume_id,
          p.name,
          p.brand,
          p.tags_json,
          p.description
        FROM bookmarks b
        INNER JOIN perfumes p ON p.id = b.perfume_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error("[bookmarks] GET error:", error);
    return res
      .status(500)
      .json({ success: false, message: "북마크 목록을 불러오지 못했습니다." });
  }
});

// 북마크 추가
router.post("/bookmarks", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { perfumeId } = req.body ?? {};

  if (!perfumeId) {
    return res
      .status(400)
      .json({ success: false, message: "perfumeId가 필요합니다." });
  }

  try {
    await pool.execute(
      "INSERT INTO bookmarks (user_id, perfume_id) VALUES (?, ?)",
      [userId, perfumeId]
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.json({ success: true, duplicated: true });
    }
    console.error("[bookmarks] POST error:", error);
    return res
      .status(500)
      .json({ success: false, message: "북마크를 추가하는 중 오류가 발생했습니다." });
  }
});

// 북마크 삭제
router.delete("/bookmarks", requireLogin, async (req, res) => {
  const userId = req.session.userId;
  const { perfumeId } = req.body ?? {};

  if (!perfumeId) {
    return res
      .status(400)
      .json({ success: false, message: "perfumeId가 필요합니다." });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM bookmarks WHERE user_id = ? AND perfume_id = ?",
      [userId, perfumeId]
    );

    if (result.affectedRows === 0) {
      return res.json({ success: true, deleted: false });
    }

    return res.json({ success: true, deleted: true });
  } catch (error) {
    console.error("[bookmarks] DELETE error:", error);
    return res
      .status(500)
      .json({ success: false, message: "북마크를 삭제하는 중 오류가 발생했습니다." });
  }
});

export default router;
