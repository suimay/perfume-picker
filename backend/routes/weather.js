// 파일: backend/routes/weather.js
import express from "express";
import fetch from "node-fetch";

import { config } from "dotenv";

config();

const router = express.Router();

const FALLBACK_NO_KEY = {
  temp: 25,
  humidity: 50,
  description: "맑음(더미)",
};

const FALLBACK_ERROR = {
  temp: 24,
  humidity: 55,
  description: "날씨 불러오기 실패(더미)",
};

// 날씨 정보 조회
router.get("/weather", async (req, res) => {
  const apiKey = process.env.OPENWEATHER_KEY;
  const { lat, lon, city = "Seoul" } = req.query ?? {};

  if (!apiKey) {
    return res.json(FALLBACK_NO_KEY);
  }

  const endpoint = new URL("https://api.openweathermap.org/data/2.5/weather");
  endpoint.search = new URLSearchParams({
    ...(lat && lon ? { lat, lon } : { q: city }),
    appid: apiKey,
    units: "metric",
    lang: "kr",
  }).toString();

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`OpenWeather 응답 코드: ${response.status}`);
    }

    const payload = await response.json();
    const temp = payload?.main?.temp ?? FALLBACK_ERROR.temp;
    const humidity = payload?.main?.humidity ?? FALLBACK_ERROR.humidity;
    const description =
      payload?.weather?.[0]?.description ?? FALLBACK_ERROR.description;

    return res.json({ temp, humidity, description });
  } catch (error) {
    console.error("[weather] fetch error:", error);
    return res.json(FALLBACK_ERROR);
  }
});

export default router;
