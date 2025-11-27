// 파일: backend/middleware/auth.js
// 아주 단순한 세션 기반 로그인 확인 미들웨어입니다.
export const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "로그인이 필요합니다." });
  }
  next();
};

