import { dummyUser, perfumeList, preferenceLabels } from "./data.js";
import {
  isBookmarked,
  loadBookmarks,
  loadPreferences,
  savePreferences,
  toggleBookmark,
} from "./storage.js";

// 변경 시작
const API_BASE = "/api";
const USER_STORAGE_KEY = "hyang.user";
let cachedApiPerfumes = null;
let isScrollHandlerRegistered = false;

const resultView = {
  boardEl: null,
  emptyStateEl: null,
  summaryEl: null,
  weatherEl: null,
  loadingEl: null,
  preferences: { notes: [], exclude: [], context: [] },
};

const catalogView = {
  listEl: null,
  emptyStateEl: null,
  countEl: null,
  searchInput: null,
  seasonSelect: null,
  sortSelect: null,
  baseItems: [],
};

const mypageView = {
  nicknameEl: null,
  emailEl: null,
  avatarInitialEl: null,
  preferenceEl: null,
  bookmarkCountEl: null,
  bookmarkMetaEl: null,
  bookmarkGrid: null,
  bookmarkEmptyEl: null,
  logoutButton: null,
  bookmarks: [],
};

const safeJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_error) {
      // ignore parse failure and fall through to split
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.values(value)
      .flat()
      .filter((item) => typeof item === "string" && item.trim().length > 0);
  }
  return [];
};

const safeJsonObject = (value) => {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (_error) {
      return {};
    }
  }
  return {};
};

const ACCENT_PALETTE = {
  citrus: "#f7c948",
  sweet: "#f5a9c9",
  cozy: "#d8c7f6",
  cool: "#85c8ff",
  calm: "#a6d7a9",
  woody: "#c5aa8f",
  aqua: "#7fd0ff",
  floral: "#f5b0ff",
  powder: "#e3d5ff",
  musk: "#d3cfc7",
  oriental: "#f1c27d",
};

const DEFAULT_ACCENT = "#9bb6ff";

const TAG_SEASON_HINT = {
  citrus: "summer",
  aqua: "summer",
  floral: "spring",
  woody: "autumn",
  sweet: "winter",
  cozy: "winter",
  cool: "winter",
  calm: "spring",
  powder: "winter",
};

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const mixWithWhite = (hex, weight = 0.5) => {
  const { r, g, b } = hexToRgb(hex);
  const ratio = clamp01(weight);
  const mix = (channel) => Math.round(channel + (255 - channel) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const buildPrimaryCardTheme = (accent) => {
  if (!accent) {
    return {};
  }
  const start = mixWithWhite(accent, 0.78);
  const end = mixWithWhite(accent, 0.52);
  return {
    gradient: `linear-gradient(165deg, ${start} 0%, ${end} 100%)`,
    border: withAlpha(accent, 0.28),
    shadow: `0 36px 60px ${withAlpha(accent, 0.24)}`,
  };
};

const SEASON_LABELS_KR = ["봄", "여름", "가을", "겨울"];
const TIME_LABELS_KR = ["아침", "낮", "저녁", "밤"];
const SEASON_INDEX_MAP = {
  spring: 0,
  summer: 1,
  autumn: 2,
  fall: 2,
  winter: 3,
};
const TIME_KEYWORDS = {
  night: ["night", "nocturne", "midnight", "dark", "evening"],
  evening: ["evening", "amber", "date", "romance", "warm", "cozy"],
  morning: ["morning", "dawn", "sunrise", "daybreak"],
  day: ["day", "daily", "fresh", "citrus", "aqua", "marine", "bright"],
};
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const matchMediaQuery = (query) =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(query)
    : undefined;

const addMediaChangeListener = (mediaQueryList, handler) => {
  if (!mediaQueryList || typeof handler !== "function") {
    return () => {};
  }
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", handler);
    return () => mediaQueryList.removeEventListener("change", handler);
  }
  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(handler);
    return () => mediaQueryList.removeListener(handler);
  }
  return () => {};
};

const syncBackgroundAnimation = () => {
  if (prefersReducedMotion()) return;
  const durationMs = 16000;
  const offset = Date.now() % durationMs;
  if (document && document.body) {
    document.body.style.animationDelay = `-${offset}ms`;
  }
  if (document && document.documentElement) {
    document.documentElement.style.setProperty(
      "--bg-shift-offset",
      `-${offset}ms`
    );
  }
};

const renderTagPills = (element, tags) => {
  if (!element) {
    return;
  }
  const unique = Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => (tag ? String(tag).trim() : ""))
        .filter((tag) => tag.length > 0)
    )
  );
  if (!unique.length) {
    element.innerHTML = `<span class="detail-tag">#향기</span>`;
    return;
  }
  element.innerHTML = unique
    .map((tag) => `<span class="detail-tag">#${tag}</span>`)
    .join("");
};

const renderNoteChips = (element, notes) => {
  if (!element) {
    return;
  }
  const list = (notes ?? [])
    .map((note) => (note ? String(note).trim() : ""))
    .filter((note) => note.length > 0);
  if (!list.length) {
    element.innerHTML = `<span class="note-chip">정보 준비 중</span>`;
    return;
  }
  element.innerHTML = list
    .map((note) => `<span class="note-chip">${note}</span>`)
    .join("");
};

const deriveMetricValue = (perfume, key, fallback) => {
  if (
    perfume &&
    typeof perfume[key] === "number" &&
    !Number.isNaN(perfume[key])
  ) {
    return Math.max(0, Math.min(10, perfume[key]));
  }
  const tagKeys = (perfume?.tags ?? []).map(toKey);
  const richTags = ["woody", "oriental", "musk", "amber"];
  const cozyTags = ["sweet", "cozy", "gourmand", "vanilla"];
  const freshTags = ["aqua", "citrus", "fresh", "green"];
  if (tagKeys.some((tag) => richTags.includes(tag))) {
    return key === "longevity" ? 8.2 : 7.8;
  }
  if (tagKeys.some((tag) => cozyTags.includes(tag))) {
    return key === "longevity" ? 7.2 : 6.8;
  }
  if (tagKeys.some((tag) => freshTags.includes(tag))) {
    return key === "longevity" ? 6.5 : 5.8;
  }
  return fallback;
};

const computeSeasonSuggestion = (perfume) => {
  const seasons = perfume?.seasonality ?? [];
  for (const season of seasons) {
    const index = SEASON_INDEX_MAP[toKey(season)];
    if (typeof index === "number") {
      return { index, badge: `${SEASON_LABELS_KR[index]} 추천` };
    }
  }
  const hint = TAG_SEASON_HINT[toKey(perfume?.primaryTag)];
  if (hint) {
    const index = SEASON_INDEX_MAP[toKey(hint)] ?? 1;
    return { index, badge: `${SEASON_LABELS_KR[index]} 추천` };
  }
  return { index: 1, badge: `${SEASON_LABELS_KR[1]} 추천` };
};

const computeTimeSuggestion = (perfume) => {
  const description = (perfume?.description ?? "").toLowerCase();
  const tagKeys = (perfume?.tags ?? []).map(toKey);
  const weatherKeys = (perfume?.weather ?? []).map(toKey);
  const contexts = safeJsonArray(
    perfume?.contexts ?? perfume?.context_json
  ).map(toKey);
  const combined = [...tagKeys, ...weatherKeys, ...contexts];
  const matches = (keywords) =>
    keywords.some(
      (token) => combined.includes(token) || description.includes(token)
    );
  if (matches(TIME_KEYWORDS.night)) {
    return { index: 3, badge: "밤 추천" };
  }
  if (matches(TIME_KEYWORDS.evening)) {
    return { index: 2, badge: "저녁 추천" };
  }
  if (matches(TIME_KEYWORDS.morning)) {
    return { index: 0, badge: "아침 추천" };
  }
  if (matches(TIME_KEYWORDS.day)) {
    return { index: 1, badge: "낮 추천" };
  }
  return { index: 2, badge: "저녁 추천" };
};

const buildScaleTrack = (container, labels, activeIndex, accent) => {
  if (!container || !Array.isArray(labels) || !labels.length) {
    return;
  }
  const maxIndex = labels.length - 1;
  const safeIndex = Math.max(0, Math.min(maxIndex, activeIndex ?? 0));
  const denominator = Math.max(maxIndex, 1);
  const percent = (safeIndex / denominator) * 100;
  const ticksHtml = labels
    .map((_, index) => {
      const position = (index / denominator) * 100;
      return `<span class="metric-scale__tick" style="left:${position}%"></span>`;
    })
    .join("");
  const labelsHtml = labels
    .map((label, index) => {
      const position = (index / denominator) * 100;
      const activeClass =
        index === safeIndex
          ? "metric-scale__label is-active"
          : "metric-scale__label";
      return `<span class="${activeClass}" style="left:${position}%">${label}</span>`;
    })
    .join("");
  container.innerHTML = `
    <div class="metric-scale__line">
      ${ticksHtml}
      <span class="metric-scale__marker" style="left:${percent}%; background:${accent};"></span>
    </div>
    <div class="metric-scale__labels">
      ${labelsHtml}
    </div>
  `;
};

const SIMILAR_LIMIT = 3;
const findSimilarPerfumes = (currentPerfume) => {
  if (!currentPerfume) {
    return [];
  }
  const targetTags = new Set((currentPerfume.tags ?? []).map(toKey));
  const normalizedList = perfumeList
    .map(normalizePerfumeForUi)
    .filter((item) => item && item.id && item.id !== currentPerfume.id);
  const scored = normalizedList
    .map((item) => {
      const itemTags = (item.tags ?? []).map(toKey);
      let score = 0;
      itemTags.forEach((tag) => {
        if (targetTags.has(tag)) {
          score += 1;
        }
      });
      if (toKey(item.primaryTag) === toKey(currentPerfume.primaryTag)) {
        score += 1.5;
      }
      return { item, score };
    })
    .filter(({ score }) => score > 0);
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.slice(0, SIMILAR_LIMIT).map(({ item }) => item);
  if (picked.length < SIMILAR_LIMIT) {
    normalizedList
      .filter((item) => !picked.some((pickedItem) => pickedItem.id === item.id))
      .slice(0, SIMILAR_LIMIT - picked.length)
      .forEach((item) => picked.push(item));
  }
  return picked;
};

const buildNotePyramidSvg = () => `
  <svg class="note-pyramid" viewBox="0 0 200 200" role="presentation" aria-hidden="true">
    <g fill="none" stroke="rgba(31, 36, 48, 0.18)" stroke-width="2" stroke-linecap="round">
      <path d="M 10 190 L 100 10 L 190 190 Z" />
      <line x1="10" y1="130" x2="190" y2="130" />
      <line x1="10" y1="70" x2="190" y2="70" />
    </g>
    <polygon class="note-pyramid__layer note-pyramid__layer--base" points="10,130 190,130 190,190 10,190"></polygon>
    <polygon class="note-pyramid__layer note-pyramid__layer--middle" points="10,70 190,70 190,130 10,130"></polygon>
    <polygon class="note-pyramid__layer note-pyramid__layer--top" points="100,10 190,70 10,70"></polygon>
    <text class="note-pyramid__label" x="100" y="45" text-anchor="middle">Top Notes</text>
    <text class="note-pyramid__label" x="100" y="105" text-anchor="middle">Heart Notes</text>
    <text class="note-pyramid__label" x="100" y="165" text-anchor="middle">Base Notes</text>
  </svg>
`;

const pickAccentColor = (perfume) => {
  const candidates = [
    ...(Array.isArray(perfume.tags) ? perfume.tags : []),
    ...(Array.isArray(perfume.accords) ? perfume.accords : []),
  ];
  for (const rawTag of candidates) {
    const key = String(rawTag).toLowerCase();
    if (ACCENT_PALETTE[key]) {
      return ACCENT_PALETTE[key];
    }
  }
  return DEFAULT_ACCENT;
};

const applyAccentToElement = (element, accent) => {
  if (!element || !accent) {
    return;
  }
  element.style.setProperty("--card-accent", accent);
  element.style.setProperty("--card-accent-soft", withAlpha(accent, 0.12));
  element.style.setProperty("--card-accent-strong", withAlpha(accent, 0.32));
};

const formatTagLabel = (tag) => {
  const key = String(tag);
  const mapped = preferenceLabels[key];
  if (mapped) {
    return mapped;
  }
  return key;
};

const normalizePreferenceToken = (token) => {
  if (!token) {
    return "";
  }
  return String(token)
    .trim()
    .replace(/[_\s]+/g, " ")
    .toLowerCase();
};

const formatHashtagLabel = (token) => {
  const normalized = normalizePreferenceToken(token);
  if (!normalized) {
    return "";
  }
  return `#${normalized.replace(/\s+/g, "-")}`;
};

const TAG_ICON_MAP = {
  citrus: "🍋",
  sweet: "🍯",
  cozy: "☁️",
  cool: "❄️",
  calm: "🌿",
  woody: "🌲",
  aqua: "💧",
  floral: "🌸",
  powder: "🫧",
  musk: "🧴",
  amber: "🕯️",
  gourmand: "🍬",
  green: "🌱",
  fresh: "✨",
};

const SEASON_ICON_MAP = {
  spring: "🌸 봄",
  summer: "☀️ 여름",
  autumn: "🍂 가을",
  fall: "🍂 가을",
  winter: "❄️ 겨울",
  rainy: "🌧️ 비오는 날",
  humid: "💧 습한 날",
  dry: "🌤️ 건조한 날",
};

const WEATHER_EMOJI_MAP = {
  sunny: "☀️ 맑음",
  cloudy: "⛅ 흐림",
  rainy: "🌧️ 비",
  snowy: "❄️ 눈",
  humid: "💧 습함",
  dry: "🌤️ 건조",
  windy: "🌬️ 바람",
  night: "🌙 밤",
};

const AVATAR_WEATHER_EMOJIS = [
  "☀️",
  "🌤️",
  "⛅",
  "🌧️",
  "⛈️",
  "🌦️",
  "❄️",
  "🌫️",
  "🌪️",
  "💨",
  "🌈",
  "⭐",
];

const pickWeatherAvatarEmoji = (seedValue) => {
  if (seedValue && typeof seedValue === "string" && seedValue.length > 0) {
    const total = Array.from(seedValue).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    );
    return AVATAR_WEATHER_EMOJIS[total % AVATAR_WEATHER_EMOJIS.length];
  }
  const randomIndex = Math.floor(Math.random() * AVATAR_WEATHER_EMOJIS.length);
  return AVATAR_WEATHER_EMOJIS[randomIndex];
};

const CONTEXT_ICON_MAP = {
  night: "🌙 밤",
  evening: "🌙 밤",
  day: "☀️ 낮",
  daytime: "☀️ 낮",
  indoor: "🏠 실내",
  outdoor: "🌳 실외",
  office: "💼 오피스",
  work: "💼 오피스",
  casual: "👟 캐주얼",
  daily: "🔁 데일리",
  date: "💘 데이트",
  special: "🎇 스페셜",
  party: "🎉 파티",
};

const CONTEXT_KEYWORDS = {
  night: ["night", "evening", "midnight", "amber", "noir", "after dark"],
  day: ["day", "daytime", "sunny", "light", "bright", "fresh"],
  indoor: [
    "indoor",
    "cozy",
    "cocoon",
    "gourmand",
    "vanilla",
    "sweet",
    "comfort",
  ],
  outdoor: [
    "outdoor",
    "marine",
    "sea",
    "ocean",
    "nature",
    "green",
    "forest",
    "field",
  ],
  office: ["office", "work", "meeting", "professional", "clean"],
  casual: ["casual", "weekend", "relax", "soft", "cotton", "powdery"],
  daily: ["daily", "everyday", "routine", "signature"],
  date: ["date", "romance", "romantic", "love", "candle"],
  special: ["special", "party", "evening", "statement", "unique", "signature"],
};

const normalizeNotes = (value) => {
  const parsed = safeJsonObject(value);
  return {
    top: Array.isArray(parsed.top) ? parsed.top : [],
    middle: Array.isArray(parsed.middle) ? parsed.middle : [],
    base: Array.isArray(parsed.base) ? parsed.base : [],
  };
};

const normalizePerfumeForUi = (perfume) => {
  if (!perfume || !perfume.id) {
    return null;
  }

  return {
    ...perfume,
    tags: safeJsonArray(perfume.tags_json ?? perfume.tags),
    accords: Array.isArray(perfume.accords) ? perfume.accords : [],
    seasonality: safeJsonArray(
      perfume.seasonality ??
        perfume.seasonality_json ??
        perfume.seasons ??
        perfume.season
    ),
    weather: safeJsonArray(
      perfume.weather ??
        perfume.weather_json ??
        perfume.climate ??
        perfume.recommended_weather
    ),
    primaryTag:
      perfume.primary_tag ??
      (Array.isArray(perfume.tags) && perfume.tags.length
        ? perfume.tags[0]
        : null),
    accent: perfume.accent ?? null,
    notes: normalizeNotes(perfume.notes_json ?? perfume.notes),
    image_url:
      typeof perfume.image_url === "string" && perfume.image_url.trim().length
        ? perfume.image_url.trim()
        : null,
  };
};

const extractPerfumeArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.perfumes)) {
    return payload.perfumes;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
};

const toKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const buildChip = (icon, label, modifier) => {
  if (!label) {
    return "";
  }
  const iconHtml = icon
    ? `<span class="recommend-chip__icon" aria-hidden="true">${icon}</span>`
    : "";
  const modifierClass = modifier ? ` recommend-chip--${modifier}` : "";
  return `<span class="recommend-chip${modifierClass}">${iconHtml}<span class="recommend-chip__label">${label}</span></span>`;
};

const renderTagChips = (perfume) => {
  const tags = Array.isArray(perfume.tags) ? perfume.tags : [];
  if (!tags.length) {
    return buildChip("#", "향조 정보 준비 중", "tag");
  }
  const chips = [];
  const seen = new Set();
  for (const tag of tags) {
    const key = toKey(tag);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    const icon = TAG_ICON_MAP[key] ?? "#";
    const label = formatTagLabel(tag);
    chips.push(buildChip(icon, label, "tag"));
    if (chips.length >= 6) {
      break;
    }
  }
  return chips.join("");
};

const extractSeasonTokens = (perfume) => {
  const rawSeasons = safeJsonArray(
    perfume.seasonality ??
      perfume.seasonality_json ??
      perfume.seasons ??
      perfume.season
  );
  const tagSet = new Set(
    (Array.isArray(perfume.tags) ? perfume.tags : []).map((tag) => toKey(tag))
  );
  const tokens = new Set();
  rawSeasons.forEach((item) => {
    const key = toKey(item);
    if (!key) {
      return;
    }
    if (key === "fall") {
      tokens.add("autumn");
    } else {
      tokens.add(key);
    }
  });
  ["spring", "summer", "autumn", "fall", "winter", "rainy", "humid"].forEach(
    (candidate) => {
      if (tagSet.has(candidate)) {
        tokens.add(candidate === "fall" ? "autumn" : candidate);
      }
    }
  );
  tagSet.forEach((tag) => {
    const hint = TAG_SEASON_HINT[tag];
    if (hint) {
      tokens.add(hint);
    }
  });
  return Array.from(tokens);
};

const renderSeasonChips = (perfume) => {
  const tokens = extractSeasonTokens(perfume);
  if (!tokens.length) {
    return "";
  }
  return tokens
    .slice(0, 3)
    .map((token) => {
      const label = SEASON_ICON_MAP[token] ?? null;
      if (!label) {
        return buildChip("🗓️", `${token}`, "season");
      }
      const [icon, ...textParts] = label.split(" ");
      const text = textParts.join(" ") || label;
      return buildChip(icon, text, "season");
    })
    .join("");
};

const deriveContextTokens = (perfume) => {
  const base = safeJsonArray(
    perfume.context_json ?? perfume.context ?? perfume.occasion
  )
    .map(toKey)
    .filter(Boolean);
  const allTokens = new Set(base);
  (Array.isArray(perfume.tags) ? perfume.tags : [])
    .map(toKey)
    .filter(Boolean)
    .forEach((token) => allTokens.add(token));
  (Array.isArray(perfume.accords) ? perfume.accords : [])
    .map(toKey)
    .filter(Boolean)
    .forEach((token) => allTokens.add(token));

  Object.entries(CONTEXT_KEYWORDS).forEach(([context, keywords]) => {
    if (
      keywords.some((keyword) =>
        Array.from(allTokens).some((token) => token.includes(keyword))
      )
    ) {
      allTokens.add(context);
    }
  });

  return Array.from(allTokens);
};

const renderContextChips = (perfume) => {
  const tokens = deriveContextTokens(perfume);
  const chips = [];
  const seen = new Set();
  for (const token of tokens) {
    const key = toKey(token);
    if (!key || seen.has(key)) {
      continue;
    }
    const iconLabel = CONTEXT_ICON_MAP[key];
    if (!iconLabel) {
      continue;
    }
    seen.add(key);
    const [icon, ...textParts] = iconLabel.split(" ");
    chips.push(buildChip(icon, textParts.join(" "), "context"));
    if (chips.length >= 3) {
      break;
    }
  }
  return chips.join("");
};

const seasonToEmoji = (token) => {
  const label = SEASON_ICON_MAP[token];
  if (!label) {
    return null;
  }
  return label.split(" ")[0];
};

const weatherToEmoji = (token) => {
  const label = WEATHER_EMOJI_MAP[token];
  if (!label) {
    return null;
  }
  return label.split(" ")[0];
};

const buildSeasonEmojiString = (seasonality) => {
  if (!Array.isArray(seasonality)) {
    return "";
  }
  return seasonality
    .map((token) => seasonToEmoji(token))
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
};

const buildWeatherEmojiString = (weathers) => {
  if (!Array.isArray(weathers)) {
    return "";
  }
  return weathers
    .map((token) => weatherToEmoji(token))
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
};

const TIME_EMOJI_MAP = {
  night: "🌙",
  evening: "🌆",
  day: "🌞",
  morning: "🌅",
};

const pickSeasonEmojiForCatalog = (perfume) => {
  const tokens = extractSeasonTokens(perfume);
  for (const token of tokens) {
    const emoji = seasonToEmoji(token);
    if (emoji) {
      return emoji;
    }
  }
  return "";
};

const pickTimeEmojiForCatalog = (perfume) => {
  const tokens = deriveContextTokens(perfume).map(toKey).filter(Boolean);
  const preferenceOrder = ["night", "evening", "day", "morning"];
  for (const key of preferenceOrder) {
    if (tokens.includes(key) && TIME_EMOJI_MAP[key]) {
      return TIME_EMOJI_MAP[key];
    }
  }
  const hintEmoji = detectTimeHintFromText(perfume);
  if (hintEmoji) {
    return hintEmoji;
  }
  return TIME_EMOJI_MAP.day;
};

const TIME_KEYWORD_HINTS = {
  night: [
    "night",
    "midnight",
    "moon",
    "nocturne",
    "evening walk",
    "야상",
    "밤",
    "달빛",
  ],
  evening: ["evening", "sunset", "dusk", "twilight", "황혼", "석양"],
  morning: ["morning", "dawn", "sunrise", "아침"],
  day: ["day", "noon", "sunny", "낮", "정오"],
};

const detectTimeHintFromText = (perfume) => {
  const sources = [
    perfume.name,
    perfume.description,
    ...(Array.isArray(perfume.tags) ? perfume.tags : []),
    ...(Array.isArray(perfume.accords) ? perfume.accords : []),
  ]
    .filter(Boolean)
    .map((text) => text.toString().toLowerCase());

  const findMatch = (key) =>
    TIME_KEYWORD_HINTS[key].some((keyword) =>
      sources.some((source) => source.includes(keyword))
    );

  const preferenceOrder = ["night", "evening", "morning", "day"];
  for (const key of preferenceOrder) {
    if (findMatch(key)) {
      return TIME_EMOJI_MAP[key];
    }
  }
  return "";
};

const buildCatalogIconRow = (perfume) => {
  const items = [];
  const seasonEmoji = pickSeasonEmojiForCatalog(perfume);
  if (seasonEmoji) {
    items.push({
      className: "ri-leaf-line",
      label: "추천 계절",
      emoji: seasonEmoji,
    });
  }
  const timeEmoji = pickTimeEmojiForCatalog(perfume);
  if (timeEmoji) {
    items.push({
      className: "ri-time-line",
      label: "추천 시간대",
      emoji: timeEmoji,
    });
  }
  if (!items.length) {
    return null;
  }
  const row = document.createElement("div");
  row.className = "catalog-card__iconrow";
  items.forEach(({ className, label, emoji }) => {
    const span = document.createElement("span");
    span.className = "catalog-card__icon";
    span.setAttribute("aria-label", label);
    span.innerHTML = `<i class="${className}" aria-hidden="true"></i><span class="catalog-card__icon-emoji">${emoji}</span>`;
    row.appendChild(span);
  });
  return row;
};

const getPrimaryTagKey = (perfume) => {
  if (perfume.primary_tag) {
    return perfume.primary_tag;
  }
  if (perfume.primaryTag) {
    return perfume.primaryTag;
  }
  if (Array.isArray(perfume.tags) && perfume.tags.length) {
    return perfume.tags[0];
  }
  return null;
};

const renderPerfumeNotes = (perfume) => {
  const { notes } = perfume;
  if (
    !notes ||
    (!notes.top.length && !notes.middle.length && !notes.base.length)
  ) {
    return `<p class="recommend-card__note">노트 정보는 준비 중이에요.</p>`;
  }

  const renderGroup = (title, list) => {
    if (!list.length) {
      return "";
    }
    return `<div class="recommend-card__note-group">
      <h4>${title}</h4>
      <p>${list.join(", ")}</p>
    </div>`;
  };

  return `
    <div class="recommend-card__note-details">
      ${renderGroup("탑", notes.top)}
      ${renderGroup("미들", notes.middle)}
      ${renderGroup("베이스", notes.base)}
    </div>
  `;
};

const buildImageStyle = (perfume) => {
  if (!perfume.image_url) {
    return "";
  }
  const escaped = perfume.image_url
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return `style="background-image: url('${escaped}');"`;
};

const loadStoredWeather = () => {
  try {
    const raw = localStorage.getItem("lastWeather");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("[weather] failed to parse stored snapshot:", error);
    return null;
  }
};

const updateResultWeather = (weather) => {
  if (!resultView.weatherEl) {
    return;
  }
  if (!weather) {
    resultView.weatherEl.textContent =
      "최근 날씨 정보를 불러오지 못했어요. 기본 추천을 보여드릴게요.";
    return;
  }
  const parts = [];
  if (weather.condition) {
    parts.push(weather.condition);
  }
  if (typeof weather.temp === "number") {
    parts.push(`${Math.round(weather.temp)}℃`);
  }
  if (typeof weather.humidity === "number") {
    parts.push(`${Math.round(weather.humidity)}%`);
  }
  resultView.weatherEl.textContent = parts.length
    ? `${parts.join(" · ")} 기준`
    : "최근 날씨 정보를 불러오지 못했어요. 기본 추천을 보여드릴게요.";
};

const ensureResultLoadingEl = () => {
  if (resultView.loadingEl && resultView.loadingEl.ownerDocument === document) {
    return resultView.loadingEl;
  }
  const indicator = document.createElement("div");
  indicator.className = "loading";
  indicator.textContent = "불러오는 중...";
  resultView.loadingEl = indicator;
  return indicator;
};

const setResultLoading = (isLoading) => {
  if (!resultView.boardEl) {
    return;
  }
  if (isLoading) {
    if (resultView.emptyStateEl) {
      resultView.emptyStateEl.hidden = true;
    }
    resultView.boardEl.innerHTML = "";
    resultView.boardEl.appendChild(ensureResultLoadingEl());
    return;
  }
  if (resultView.loadingEl?.parentElement) {
    resultView.loadingEl.parentElement.removeChild(resultView.loadingEl);
  }
};

const logSuccess = (label) => {
  console.info(`${label} success`);
};

const logFailure = (label, error) => {
  console.warn(`${label} failed: ${error?.message ?? error}`);
};

const apiGet = async (path, label = `[GET] ${path}`) => {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    logSuccess(label);
    return data;
  } catch (error) {
    logFailure(label, error);
    throw error;
  }
};

const apiPost = async (path, bodyObj, label = `[POST] ${path}`) => {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj ?? {}),
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    logSuccess(label);
    return data;
  } catch (error) {
    logFailure(label, error);
    throw error;
  }
};

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("[user] failed to parse stored user:", error);
    return null;
  }
};

const saveUser = (user) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("[user] failed to save user:", error);
  }
};

const clearUser = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.warn("[user] failed to clear user:", error);
  }
};

const updateTopbarAuthButton = (profile) => {
  const authButton = document.getElementById("topbarAuthButton");
  if (!authButton) {
    return;
  }
  const labelTarget =
    authButton.querySelector("[data-label]") ||
    authButton.querySelector("span");
  const icon = authButton.querySelector("i");
  const isMyPage = document.body.dataset.page === "mypage";
  if (profile?.email && isMyPage) {
    authButton.href = "javascript:void(0)";
    authButton.setAttribute("aria-label", "로그아웃");
    authButton.dataset.action = "logout";
    if (labelTarget) {
      labelTarget.textContent = "로그아웃";
    }
    if (icon) {
      icon.className = "ri-logout-box-r-line";
    }
  } else if (profile?.email) {
    authButton.href = "mypage.html";
    authButton.removeAttribute("data-action");
    authButton.setAttribute("aria-label", "마이페이지로 이동");
    if (labelTarget) {
      labelTarget.textContent = "마이페이지";
    }
    if (icon) {
      icon.className = "ri-user-heart-line";
    }
  } else {
    authButton.href = "login.html";
    authButton.removeAttribute("data-action");
    authButton.setAttribute("aria-label", "로그인 페이지로 이동");
    if (labelTarget) {
      labelTarget.textContent = "로그인";
    }
    if (icon) {
      icon.className = "ri-arrow-right-line";
    }
  }
};

const updateUserBadge = (profile) => {
  const userNameTarget = document.getElementById("topbarUserName");
  if (userNameTarget) {
    const displayName =
      profile?.nickname ?? profile?.name ?? profile?.email ?? dummyUser.name;
    userNameTarget.textContent = displayName;
  }
  updateTopbarAuthButton(profile);
};

const hydrateUserBadge = () => {
  const stored = loadStoredUser();
  updateUserBadge(stored ?? dummyUser);
};

const applyMyPageProfile = (profile) => {
  const nickname =
    profile?.nickname ?? profile?.name ?? profile?.email ?? dummyUser.name;
  const emailText = profile?.email ?? "로그인하고 나만의 향수를 모아보세요.";
  if (mypageView.nicknameEl) {
    mypageView.nicknameEl.textContent = nickname;
  }
  if (mypageView.emailEl) {
    mypageView.emailEl.textContent = emailText;
  }
  if (mypageView.avatarInitialEl) {
    const seed = profile?.email ?? profile?.nickname ?? profile?.name ?? "";
    const avatarEmoji = pickWeatherAvatarEmoji(seed);
    mypageView.avatarInitialEl.textContent = avatarEmoji;
    mypageView.avatarInitialEl.setAttribute(
      "aria-label",
      `사용자 기분 아이콘 ${avatarEmoji}`
    );
  }
  if (mypageView.logoutButton) {
    const labelTarget =
      mypageView.logoutButton.querySelector("[data-label]") ??
      mypageView.logoutButton;
    const icon = mypageView.logoutButton.querySelector("i");
    if (profile?.email) {
      mypageView.logoutButton.dataset.mode = "logout";
      if (labelTarget) {
        labelTarget.textContent = "로그아웃";
      }
      if (icon) {
        icon.className = "ri-logout-box-r-line";
      }
    } else {
      mypageView.logoutButton.dataset.mode = "login";
      if (labelTarget) {
        labelTarget.textContent = "로그인하기";
      }
      if (icon) {
        icon.className = "ri-login-circle-line";
      }
    }
  }
};

const applyMyPagePreferenceSummary = () => {
  if (!mypageView.preferenceEl) {
    return;
  }
  const preferences = loadPreferences();
  const candidateTokens = [
    ...(Array.isArray(preferences.notes) ? preferences.notes : []),
    ...(Array.isArray(preferences.context) ? preferences.context : []),
  ]
    .map((token) => normalizePreferenceToken(token))
    .filter(Boolean);
  const unique = Array.from(new Set(candidateTokens));
  mypageView.preferenceEl.innerHTML = "";
  if (!unique.length) {
    mypageView.preferenceEl.textContent = "취향 정보 준비 중";
    return;
  }
  unique.slice(0, 6).forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "mypage-pref-tag";
    chip.textContent = label;
    mypageView.preferenceEl.appendChild(chip);
  });
};

const applyBookmarkStats = (count) => {
  if (mypageView.bookmarkCountEl) {
    mypageView.bookmarkCountEl.textContent = String(count);
  }
  if (mypageView.bookmarkMetaEl) {
    mypageView.bookmarkMetaEl.textContent =
      count > 0
        ? `총 ${count}개의 향수를 북마크했어요. 카드에서 바로 상세보기나 북마크 해제가 가능해요.`
        : "마음에 드는 향수를 저장하면 이곳에 카드로 정리돼요.";
  }
};

const initCommonUI = () => {
  const navLinks = document.querySelectorAll(".topbar__nav a");
  const path = window.location.pathname.replace(/\/$/, "");
  let currentFile = path.split("/").pop() || "index.html";
  if (!currentFile.includes(".")) {
    currentFile = "index.html";
  }

  navLinks.forEach((link) => {
    const href = (link.getAttribute("href") ?? "").replace("./", "");
    let normalizedHref = href.split("/").pop() || href;
    if (!normalizedHref || normalizedHref === "/") {
      normalizedHref = "index.html";
    }
    if (!normalizedHref.includes(".")) {
      normalizedHref = `${normalizedHref}.html`;
    }
    if (normalizedHref === currentFile) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });

  const topbar = document.querySelector(".topbar");
  if (topbar && !isScrollHandlerRegistered) {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        topbar.classList.add("scrolled");
      } else {
        topbar.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    isScrollHandlerRegistered = true;
  }

  const fadeTargets = document.querySelectorAll(
    ".container, .hero, .card-grid, .select-main, .catalog-main, .mypage-main"
  );
  fadeTargets.forEach((target) => {
    if (target.dataset.fadeReady === "true") {
      return;
    }
    target.dataset.fadeReady = "true";
    setTimeout(() => {
      target.classList.add("is-visible");
    }, 100);
  });

  document.querySelectorAll("[data-footer-link]").forEach((link) => {
    if (link.dataset.bound === "true") {
      return;
    }
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.footerLink;
      if (target === "terms") {
        alert("환영합니다. 자유롭게 즐겨보세요 ♡⸜(ˆᗜˆ˵ )⸝♡");
      }
      if (target === "privacy") {
        alert("당신의 개인정보는 제 주머니 속으로.");
      }
    });
    link.dataset.bound = "true";
  });
};

const setBookmarkButtonState = (button, active) => {
  if (!button) {
    return;
  }
  button.classList.toggle("bookmark-button--active", active);
  const labelTarget =
    button.querySelector("[data-label]") || button.querySelector("span");
  const text = active ? "북마크 해제" : "북마크";
  if (labelTarget) {
    labelTarget.textContent = text;
  } else {
    button.textContent = text;
  }
  const accent = button.dataset.accent;
  if (active && accent) {
    try {
      const highlight = mixWithWhite(accent, 0.2);
      const border = withAlpha(accent, 0.35);
      button.style.background = highlight;
      button.style.borderColor = border;
      button.style.color = "#fff";
    } catch (_error) {
      button.style.background = "";
      button.style.borderColor = "";
      button.style.color = "";
    }
  } else {
    button.style.background = "";
    button.style.borderColor = "";
    button.style.color = "";
  }
};

const updateBookmarkButtonsIn = (container, perfumeId, active) => {
  if (!container) {
    return;
  }
  container
    .querySelectorAll(`[data-action="bookmark"][data-id="${perfumeId}"]`)
    .forEach((button) => setBookmarkButtonState(button, active));
};

const bindCardActions = (container, { onBookmarkChange } = {}) => {
  if (!container || container.dataset.actionsBound === "true") {
    return;
  }

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const { action, id } = button.dataset;
    if (!id) {
      return;
    }

    if (action === "detail") {
      window.location.href = `detail.html?id=${encodeURIComponent(id)}`;
      return;
    }

    if (action === "bookmark") {
      const updated = toggleBookmark(id);
      const isActive = updated.includes(id);
      updateBookmarkButtonsIn(container, id, isActive);
      if (typeof onBookmarkChange === "function") {
        onBookmarkChange(id, updated, isActive);
      }
    }
  });

  container.dataset.actionsBound = "true";
};

const buildMypageBookmarkCard = (perfume) => {
  if (!perfume || !perfume.id) {
    return null;
  }
  const article = document.createElement("article");
  article.className = "mypage-bookmark-card";
  article.dataset.perfumeId = perfume.id;
  const accent = perfume.accent ?? pickAccentColor(perfume);
  article.style.setProperty("--mypage-card-accent", accent);

  const badge = document.createElement("span");
  badge.className = "mypage-bookmark-card__badge";
  badge.textContent = perfume.brand ?? "HYANG LAB";
  article.appendChild(badge);

  const title = document.createElement("h3");
  title.className = "mypage-bookmark-card__title";
  title.textContent = perfume.name ?? "향수";
  article.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "mypage-bookmark-card__desc";
  desc.textContent = perfume.description ?? "차분하게 감성을 담은 향수예요.";
  article.appendChild(desc);

  const tagsWrapper = document.createElement("div");
  tagsWrapper.className = "mypage-bookmark-card__tags";
  const tags = Array.isArray(perfume.tags) ? perfume.tags : [];
  if (tags.length) {
    tags.slice(0, 3).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "mypage-tag";
      const label = formatHashtagLabel(tag) || "#note";
      chip.textContent = label;
      tagsWrapper.appendChild(chip);
    });
  } else {
    const chip = document.createElement("span");
    chip.className = "mypage-tag";
    chip.textContent = "#ready";
    tagsWrapper.appendChild(chip);
  }
  article.appendChild(tagsWrapper);

  const actions = document.createElement("div");
  actions.className = "mypage-bookmark-card__actions";

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className = "mypage-detail-button";
  detailButton.dataset.action = "detail";
  detailButton.dataset.id = perfume.id;
  detailButton.innerHTML =
    '<span>상세보기</span><i class="ri-arrow-right-line" aria-hidden="true"></i>';
  actions.appendChild(detailButton);

  const bookmarkButton = document.createElement("button");
  bookmarkButton.type = "button";
  bookmarkButton.className = "bookmark-button";
  bookmarkButton.dataset.action = "bookmark";
  bookmarkButton.dataset.id = perfume.id;
  bookmarkButton.innerHTML = "<span data-label>북마크 해제</span>";
  bookmarkButton.dataset.accent = accent;
  setBookmarkButtonState(bookmarkButton, isBookmarked(perfume.id));
  actions.appendChild(bookmarkButton);

  article.appendChild(actions);
  return article;
};

const renderMypageBookmarks = () => {
  const { bookmarkGrid, bookmarkEmptyEl } = mypageView;
  if (!bookmarkGrid || !bookmarkEmptyEl) {
    return;
  }
  bookmarkGrid.innerHTML = "";
  const items = Array.isArray(mypageView.bookmarks) ? mypageView.bookmarks : [];
  if (!items.length) {
    bookmarkGrid.hidden = true;
    bookmarkEmptyEl.hidden = false;
    return;
  }
  bookmarkGrid.hidden = false;
  bookmarkEmptyEl.hidden = true;
  const fragment = document.createDocumentFragment();
  items.forEach((perfume) => {
    const card = buildMypageBookmarkCard(perfume);
    if (card) {
      fragment.appendChild(card);
    }
  });
  bookmarkGrid.appendChild(fragment);
};

const fetchBookmarkPerfumes = async () => {
  const bookmarkIds = loadBookmarks().map((id) => String(id));
  if (!bookmarkIds.length) {
    return [];
  }
  let perfumes = [];
  try {
    perfumes = await fetchPerfumesFromApi();
  } catch (error) {
    console.warn("[mypage] perfume fetch failed, using fallback:", error);
  }
  if (!Array.isArray(perfumes) || !perfumes.length) {
    perfumes = perfumeList.map(normalizePerfumeForUi).filter(Boolean);
  }
  const lookup = new Map();
  perfumes.forEach((perfume) => {
    if (perfume && perfume.id) {
      lookup.set(String(perfume.id), perfume);
    }
  });
  const ordered = [];
  bookmarkIds.forEach((id) => {
    const match = lookup.get(id);
    if (match) {
      ordered.push(match);
    }
  });
  return ordered;
};

const buildOfficialLink = (perfume) => {
  if (!perfume) {
    return "#";
  }
  const directLink =
    perfume.official_url ||
    perfume.purchase_url ||
    perfume.shop_url ||
    perfume.link ||
    perfume.url;
  if (directLink) {
    return directLink;
  }

  const queryBase = [perfume.brand, perfume.name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!queryBase) {
    return "#";
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${queryBase} perfume`
  )}`;
};

const bindRecommendationFlip = (interactiveEl) => {
  if (!interactiveEl || interactiveEl.dataset.flipBound === "true") {
    return;
  }
  const toggle = () => {
    const flipped = interactiveEl.classList.toggle("is-flipped");
    interactiveEl.setAttribute("aria-pressed", String(flipped));
  };
  const handleClick = (event) => {
    if (
      event.target.closest("[data-action]") ||
      event.target.closest("a[href]")
    ) {
      return;
    }
    toggle();
  };
  interactiveEl.addEventListener("click", handleClick);
  interactiveEl.addEventListener("keypress", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  });
  interactiveEl.dataset.flipBound = "true";
};

const createPrimaryRecommendationCard = (perfume) => {
  if (!perfume) {
    return null;
  }

  const accent = pickAccentColor(perfume);
  const article = document.createElement("article");
  article.className = "recommend-card recommend-card--primary";
  article.dataset.perfumeId = perfume.id;
  applyAccentToElement(article, accent);
  const inner = document.createElement("div");
  inner.className = "recommend-card__inner";
  applyAccentToElement(inner, accent);

  const tagChips = renderTagChips(perfume);
  const seasonChips = renderSeasonChips(perfume);
  const contextChips = renderContextChips(perfume);
  const contextSection =
    seasonChips || contextChips
      ? `${seasonChips}${contextChips}`
      : buildChip("🔍", "분위기 탐색", "context");
  const imageStyle = buildImageStyle(perfume);
  inner.innerHTML = `
    <span class="recommend-card__accent" aria-hidden="true"></span>
    <p class="recommend-card__brand">${perfume.brand ?? "HYANG LAB"}</p>
    <h2 class="recommend-card__name">${perfume.name}</h2>
    <div class="recommend-card__media">
      <div class="recommend-card__image" ${imageStyle} role="presentation"></div>
    </div>
    <div class="recommend-card__tags" aria-label="주요 노트">${tagChips}</div>
    <div class="recommend-card__contexts" aria-label="추천 상황">${contextSection}</div>
    <p class="recommend-card__note">${
      perfume.description ?? "어울리는 순간을 위해 준비했어요."
    }</p>
    <div class="recommend-card__cta">
      <button class="recommend-card__link bookmark-button" type="button" data-action="bookmark" data-id="${
        perfume.id
      }">
        <span data-label>북마크</span>
      </button>
    </div>
  `;

  article.appendChild(inner);
  article.addEventListener("click", () => {
    window.location.href = `detail.html?id=${encodeURIComponent(perfume.id)}`;
  });
  const primaryBookmarkBtn = article.querySelector(
    `[data-action="bookmark"][data-id="${perfume.id}"]`
  );
  if (primaryBookmarkBtn) {
    primaryBookmarkBtn.dataset.accent = accent;
    setBookmarkButtonState(primaryBookmarkBtn, isBookmarked(perfume.id));
  }
  return article;
};

const createSecondaryRecommendationCard = (perfume, position = "left") => {
  if (!perfume) {
    return null;
  }
  const accent = pickAccentColor(perfume);
  const article = document.createElement("article");
  article.className = "recommend-card recommend-card--secondary";
  article.dataset.perfumeId = perfume.id;
  if (position === "right") {
    article.classList.add("recommend-card--secondary-right");
  } else {
    article.classList.add("recommend-card--secondary-left");
  }
  applyAccentToElement(article, accent);

  const tagChips = renderTagChips(perfume);
  const seasonChips = renderSeasonChips(perfume);
  const contextChips = renderContextChips(perfume);
  const contextSection =
    seasonChips || contextChips
      ? `${seasonChips}${contextChips}`
      : buildChip("🔍", "분위기 탐색", "context");
  const officialUrl = buildOfficialLink(perfume);
  const imageStyle = buildImageStyle(perfume);
  const roleLabel = position === "left" ? "대안 추천" : "새로운 시도";

  article.innerHTML = `
    <span class="recommend-card__accent" aria-hidden="true"></span>
    <p class="recommend-card__brand">${perfume.brand ?? "HYANG LAB"}</p>
    <h3 class="recommend-card__name">${perfume.name}</h3>
    <div class="recommend-card__media">
      <div class="recommend-card__image" ${imageStyle} role="presentation"></div>
      <span class="recommend-card__badge">${roleLabel}</span>
    </div>
    <div class="recommend-card__content">
      <div class="recommend-card__tags" aria-label="주요 노트">${tagChips}</div>
      <div class="recommend-card__contexts" aria-label="추천 상황">${contextSection}</div>
      <p class="recommend-card__note">${
        perfume.description ?? "다른 분위기를 즐기고 싶을 때 어울려요."
      }</p>
    </div>
    <div class="recommend-card__cta">
      <button class="recommend-card__link bookmark-button" type="button" data-action="bookmark" data-id="${
        perfume.id
      }">
        <span data-label>북마크</span>
      </button>
    </div>
  `;

  article.addEventListener("click", () => {
    window.location.href = `detail.html?id=${encodeURIComponent(perfume.id)}`;
  });
  const secondaryBookmarkBtn = article.querySelector(
    `[data-action="bookmark"][data-id="${perfume.id}"]`
  );
  if (secondaryBookmarkBtn) {
    secondaryBookmarkBtn.dataset.accent = accent;
    setBookmarkButtonState(secondaryBookmarkBtn, isBookmarked(perfume.id));
  }
  return article;
};

const createCatalogCard = (perfume) => {
  if (!perfume || !perfume.id) {
    return null;
  }

  const accent = perfume.accent ?? pickAccentColor(perfume);
  const primaryTagKey = getPrimaryTagKey(perfume);

  const card = document.createElement("article");
  card.className = "catalog-card";
  card.dataset.perfumeId = perfume.id;
  card.style.setProperty("--catalog-accent", accent);

  const figure = document.createElement("div");
  figure.className = "catalog-card__figure";
  figure.setAttribute("aria-hidden", "true");
  if (perfume.image_url) {
    figure.style.backgroundImage = `url("${perfume.image_url}")`;
    figure.classList.add("catalog-card__figure--filled");
  } else {
    figure.innerHTML = '<i class="ri-gallery-line" aria-hidden="true"></i>';
  }

  const divider = document.createElement("span");
  divider.className = "catalog-card__divider";
  divider.style.background = accent;

  const body = document.createElement("div");
  body.className = "catalog-card__body";

  const top = document.createElement("div");
  top.className = "catalog-card__top";
  const brand = document.createElement("span");
  brand.className = "catalog-card__brand";
  brand.textContent = perfume.brand ?? "HYANG";
  const title = document.createElement("h3");
  title.className = "catalog-card__title";
  title.textContent = perfume.name ?? "향수";
  top.append(brand, title);
  body.append(top);

  const iconRow = buildCatalogIconRow(perfume);
  if (iconRow || primaryTagKey) {
    const metaRow = document.createElement("div");
    metaRow.className = "catalog-card__meta-row";
    if (iconRow) {
      metaRow.append(iconRow);
    }
    if (primaryTagKey) {
      const tagBadge = document.createElement("span");
      tagBadge.className = "catalog-card__tag-text";
      tagBadge.textContent = primaryTagKey.toLowerCase();
      metaRow.append(tagBadge);
    }
    body.append(metaRow);
  }

  card.append(figure, divider, body);

  const goToDetail = () => {
    window.location.href = `detail.html?id=${encodeURIComponent(perfume.id)}`;
  };

  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `${perfume.name ?? "향수"} 상세보기`);
  card.addEventListener("click", goToDetail);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToDetail();
    }
  });

  return card;
};

const renderRecommendationBoard = (items, { source } = {}) => {
  if (!resultView.boardEl) {
    return;
  }

  const prepared = [];
  const seen = new Set();
  const pushItem = (item) => {
    const normalized = normalizePerfumeForUi(item);
    if (!normalized || seen.has(normalized.id)) {
      return;
    }
    prepared.push(normalized);
    seen.add(normalized.id);
  };

  (items ?? []).forEach(pushItem);

  if (prepared.length < 3) {
    perfumeList.forEach((fallback) => {
      if (prepared.length >= 3) {
        return;
      }
      pushItem(fallback);
    });
  }

  if (!prepared.length) {
    showEmptyState(
      "추천할 향수가 없어요",
      "취향을 조금만 더 업데이트하면 새로운 향수를 소개해드릴 수 있어요."
    );
    return;
  }

  const [primary, ...rest] = prepared;
  const fragment = document.createDocumentFragment();
  const left = rest[0] ?? null;
  const right = rest[1] ?? null;

  if (left) {
    const leftCard = createSecondaryRecommendationCard(left, "left");
    if (leftCard) {
      fragment.appendChild(leftCard);
    }
  }

  const primaryCard = createPrimaryRecommendationCard(primary);
  if (primaryCard) {
    fragment.appendChild(primaryCard);
  }

  if (right) {
    const rightCard = createSecondaryRecommendationCard(right, "right");
    if (rightCard) {
      fragment.appendChild(rightCard);
    }
  }

  resultView.boardEl.innerHTML = "";
  resultView.boardEl.appendChild(fragment);

  if (resultView.summaryEl) {
    const preferenceLabelsText = (resultView.preferences?.notes ?? [])
      .map((key) => preferenceLabels[key] ?? key)
      .filter(Boolean);
    const preferencePart = preferenceLabelsText.length
      ? `${preferenceLabelsText.join(", ")} 취향`
      : "선택한 취향";
    const summaryText =
      source === "dummy"
        ? `${preferencePart}에 맞춘 임시 추천이에요.`
        : `${preferencePart}과 최근 날씨를 바탕으로 향수를 골라봤어요.`;
    resultView.summaryEl.textContent = summaryText;
  }
};

const renderCardHtml = (item) => {
  const tags = safeJsonArray(item.tags_json ?? item.tags)
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join(" ");
  return `
    <h3 class="card__title">${item.name}</h3>
    <p class="muted">${item.brand ?? ""}</p>
    <div>${tags}</div>
    <p>${item.description ?? ""}</p>
    <div class="card__actions" style="margin-top:10px; display:flex; gap:8px;">
      <button class="card__link" data-id="${
        item.id
      }" data-action="detail" type="button">상세보기</button>
      <button class="bookmark-button" data-id="${
        item.id
      }" data-action="bookmark" type="button">북마크</button>
    </div>
  `;
};

const createCardElement = (item) => {
  const normalized = normalizePerfumeForUi(item);
  if (!normalized) {
    return null;
  }

  const accent = normalized.accent ?? pickAccentColor(normalized);
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.perfumeId = normalized.id;
  article.innerHTML = `
    <div class="card__image" aria-hidden="true"></div>
    <div class="card__body">
      <span class="tag">${normalized.brand ?? "HYANG"}</span>
      ${renderCardHtml(normalized)}
    </div>
  `;

  const bookmarkButton = article.querySelector('[data-action="bookmark"]');
  if (bookmarkButton) {
    bookmarkButton.dataset.accent = accent;
    setBookmarkButtonState(bookmarkButton, isBookmarked(normalized.id));
  }
  return article;
};

const renderResultCards = (container, perfumes) => {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  perfumes.forEach((perfume) => {
    const card = createCardElement(perfume);
    if (card) {
      container.appendChild(card);
    }
  });
};

const showEmptyState = (title, description) => {
  setResultLoading(false);
  if (resultView.summaryEl && title && description) {
    resultView.summaryEl.textContent = `${title} · ${description}`;
  }
  if (resultView.boardEl) {
    const empty = document.createElement("div");
    empty.className = "recommend-empty";
    empty.innerHTML = `
      <p class="recommend-empty__title">${title}</p>
      <p class="recommend-empty__desc">${description}</p>
      <a class="recommend-empty__action" href="select.html">취향 선택하러 가기</a>
    `;
    resultView.boardEl.innerHTML = "";
    resultView.boardEl.appendChild(empty);
  }
};

const renderCardsFromApi = (payload) => {
  if (!resultView.boardEl) {
    return;
  }
  const items = extractPerfumeArray(payload).slice(0, 8);
  if (!items.length) {
    showEmptyState(
      "추천할 향수가 없어요",
      "선호하는 취향을 조금 더 넓혀보면 어떨까요?"
    );
    return;
  }

  setResultLoading(false);
  console.info("[result] rendering API recommendations");
  renderRecommendationBoard(items, { source: "api" });
};

const renderCardsFromDummy = () => {
  if (!resultView.boardEl) {
    return;
  }

  const { notes } = resultView.preferences;
  const matches =
    notes.length === 0
      ? perfumeList
      : perfumeList.filter(
          (perfume) =>
            Array.isArray(perfume.tags) &&
            perfume.tags.some((tag) => notes.includes(tag))
        );

  if (!matches.length) {
    showEmptyState(
      "추천할 향수가 없어요",
      "다른 취향을 선택하면 새로운 향수를 소개해드릴게요."
    );
    return;
  }

  setResultLoading(false);
  console.info("[result] rendering dummy recommendations");
  renderRecommendationBoard(matches, { source: "dummy" });
  console.info("[result] fallback to dummy data");
};

const WEATHER_ICON_MAP = {
  맑음: "ri-sun-line",
  흐림: "ri-cloudy-line",
  비: "ri-rainy-line",
  눈: "ri-snowy-line",
};

const recommendByWeatherCard = (info) => {
  const { condition, temp } = info;
  if (condition === "맑음" && temp >= 18 && temp <= 26) {
    return {
      id: "amber-night",
      name: "Amber Night",
      sub: "Nocturne",
      desc: "따뜻한 앰버와 우디 노트가 밤 공기와 어울리는 향.",
    };
  }
  if ((condition === "흐림" || condition === "비") && temp < 18) {
    return {
      id: "cotton-haze",
      name: "Cedar Mist",
      sub: "Forest",
      desc: "젖은 숲의 공기를 닮은 차분한 시더와 그린 하모니.",
    };
  }
  if (temp > 26) {
    return {
      id: "citrus-dawn",
      name: "Citrus Day",
      sub: "Fresh",
      desc: "밝은 햇살처럼 상큼한 시트러스가 기분을 가볍게 띄워줘요.",
    };
  }
  return {
    id: "floral-mist",
    name: "Soft Blossom",
    sub: "Daydream",
    desc: "가볍고 포근한 플로럴 향으로 언제나 부담 없이.",
  };
};

const applyWeatherCard = (weatherInfo) => {
  const conditionEl = document.getElementById("weatherCondition");
  const tempEl = document.getElementById("weatherTemp");
  const humidityEl = document.getElementById("weatherHumidity");
  const iconEl = document.getElementById("weatherIcon");

  if (conditionEl) {
    conditionEl.textContent = weatherInfo.condition;
  }
  if (tempEl) {
    tempEl.textContent = `${Math.round(weatherInfo.temp)}℃`;
  }
  if (humidityEl) {
    humidityEl.textContent = `${Math.round(weatherInfo.humidity)}%`;
  }
  if (iconEl) {
    iconEl.className = WEATHER_ICON_MAP[weatherInfo.condition] || "ri-sun-line";
  }

  const instantTempEl = document.getElementById("instantWeatherTemp");
  const instantHumidityEl = document.getElementById("instantWeatherHumidity");
  const instantIconEl = document.getElementById("instantWeatherIcon");

  const instantConditionEl = document.getElementById("instantWeatherStatus");
  if (instantConditionEl) {
    instantConditionEl.textContent = weatherInfo.condition;
  }
  if (instantTempEl) {
    instantTempEl.textContent = `${Math.round(weatherInfo.temp)}℃`;
  }
  if (instantHumidityEl) {
    instantHumidityEl.textContent = `${Math.round(weatherInfo.humidity)}%`;
  }
  if (instantIconEl) {
    instantIconEl.className =
      WEATHER_ICON_MAP[weatherInfo.condition] || "ri-sun-line";
  }

  const recommendation = recommendByWeatherCard(weatherInfo);
  const nameEl = document.getElementById("recommendName");
  const subEl = document.getElementById("recommendSub");
  const descEl = document.getElementById("recommendDesc");
  if (nameEl) {
    nameEl.textContent = recommendation.name;
  }
  if (subEl) {
    subEl.textContent = recommendation.sub;
  }
  if (descEl) {
    descEl.textContent = recommendation.desc;
  }

  const instantNameEl = document.getElementById("instantRecommendName");
  const instantBrandEl = document.getElementById("instantRecommendBrand");
  const instantDescEl = document.getElementById("instantRecommendDesc");
  const instantLink = document.getElementById("instantRecommendLink");
  if (instantNameEl) {
    instantNameEl.textContent = recommendation.name;
  }
  if (instantBrandEl) {
    instantBrandEl.textContent = recommendation.sub;
  }
  if (instantDescEl) {
    instantDescEl.textContent = recommendation.desc;
  }
  if (instantLink) {
    instantLink.href = `detail.html?id=${encodeURIComponent(
      recommendation.id ?? recommendation.name
    )}`;
  }

  try {
    localStorage.setItem(
      "lastWeather",
      JSON.stringify({
        condition: weatherInfo.condition,
        temp: weatherInfo.temp,
        humidity: weatherInfo.humidity,
      })
    );
  } catch (error) {
    console.warn("[weather] snapshot save failed:", error);
  }
};

const setupHeroInteractions = () => {
  const heroSection = document.querySelector(".hero");
  const heroLogo = document.querySelector(".hero__logo");
  const ctaButton = document.querySelector(".hero__cta");
  const aboutSection = document.getElementById("about");

  if (ctaButton && aboutSection && ctaButton.dataset.bound !== "true") {
    ctaButton.addEventListener("click", (event) => {
      event.preventDefault();
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ctaButton.dataset.bound = "true";
  }

  if (!heroSection || !heroLogo) {
    return;
  }

  const desktopQuery = matchMediaQuery("(min-width: 720px)");
  const motionQuery = matchMediaQuery("(prefers-reduced-motion: reduce)");
  const maxOffset = 16;
  let rafId = null;
  let parallaxEnabled = false;

  const applyParallax = (event) => {
    if (!parallaxEnabled) {
      return;
    }
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    const rect = heroSection.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    const offsetX = Math.max(-1, Math.min(1, relativeX * 2)) * maxOffset;
    const offsetY = Math.max(-1, Math.min(1, relativeY * 2)) * maxOffset;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      heroLogo.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      rafId = null;
    });
  };

  const resetLogo = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      heroLogo.style.transform = "translate3d(0, 0, 0)";
      rafId = null;
    });
  };

  const enableParallax = () => {
    if (parallaxEnabled) {
      return;
    }
    heroSection.addEventListener("pointermove", applyParallax);
    heroSection.addEventListener("pointerleave", resetLogo);
    parallaxEnabled = true;
  };

  const disableParallax = () => {
    if (!parallaxEnabled) {
      return;
    }
    heroSection.removeEventListener("pointermove", applyParallax);
    heroSection.removeEventListener("pointerleave", resetLogo);
    parallaxEnabled = false;
    resetLogo();
  };

  const evaluateParallax = () => {
    const matchesDesktop = desktopQuery
      ? desktopQuery.matches
      : window.innerWidth >= 720;
    if (!prefersReducedMotion() && matchesDesktop) {
      enableParallax();
    } else {
      disableParallax();
    }
  };

  evaluateParallax();
  addMediaChangeListener(desktopQuery, evaluateParallax);
  addMediaChangeListener(motionQuery, evaluateParallax);
  if (!desktopQuery && typeof window !== "undefined") {
    window.addEventListener("resize", evaluateParallax);
  }
};

const setupHomeScrollReveals = () => {
  const buildObserver = (selector, { threshold, delayStep }) => {
    const targets = document.querySelectorAll(selector);
    if (!targets.length) {
      return;
    }
    if (prefersReducedMotion()) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    if (typeof IntersectionObserver !== "function") {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    targets.forEach((target, index) => {
      target.style.transitionDelay = `${index * (delayStep ?? 0)}s`;
      observer.observe(target);
    });
  };

  buildObserver(".about-card", { threshold: 0.25, delayStep: 0.08 });
  buildObserver(".flow-step", { threshold: 0.4, delayStep: 0.12 });
};

const setupInstantFlipCard = () => {
  const card = document.getElementById("instantWeatherCard");
  if (!card || card.dataset.bound === "true") {
    return;
  }

  const tiltQuery = matchMediaQuery("(min-width: 720px)");
  const motionQuery = matchMediaQuery("(prefers-reduced-motion: reduce)");
  let tiltEnabled = false;
  let rafId = null;
  const tiltState = { x: 0, y: 0 };

  const applyTiltTransform = () => {
    if (!tiltEnabled) {
      card.style.transform = "";
      return;
    }
    const baseRotation = card.classList.contains("is-flipped") ? 180 : 0;
    card.style.transform = `perspective(1000px) rotateX(${tiltState.x}deg) rotateY(${baseRotation + tiltState.y}deg)`;
  };

  const resetTilt = () => {
    tiltState.x = 0;
    tiltState.y = 0;
    applyTiltTransform();
  };

  const handlePointerMove = (event) => {
    if (!tiltEnabled) {
      return;
    }
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    const targetY = Math.max(-1, Math.min(1, relativeX * 2)) * 6;
    const targetX = Math.max(-1, Math.min(1, relativeY * -2)) * 6;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      tiltState.x = Number(targetX.toFixed(3));
      tiltState.y = Number(targetY.toFixed(3));
      applyTiltTransform();
      rafId = null;
    });
  };

  const enableTilt = () => {
    if (tiltEnabled) {
      return;
    }
    card.addEventListener("pointermove", handlePointerMove);
    card.addEventListener("pointerleave", resetTilt);
    tiltEnabled = true;
    applyTiltTransform();
  };

  const disableTilt = () => {
    if (!tiltEnabled) {
      return;
    }
    card.removeEventListener("pointermove", handlePointerMove);
    card.removeEventListener("pointerleave", resetTilt);
    tiltEnabled = false;
    card.style.transform = "";
  };

  const evaluateTilt = () => {
    const matchesDesktop = tiltQuery
      ? tiltQuery.matches
      : window.innerWidth >= 720;
    if (!prefersReducedMotion() && matchesDesktop) {
      enableTilt();
    } else {
      disableTilt();
    }
  };

  const toggle = () => {
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(flipped));
    if (tiltEnabled) {
      applyTiltTransform();
    }
  };

  card.addEventListener("click", toggle);
  card.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.code === "Space"
    ) {
      event.preventDefault();
      toggle();
    }
  });

  evaluateTilt();
  addMediaChangeListener(tiltQuery, evaluateTilt);
  addMediaChangeListener(motionQuery, evaluateTilt);
  if (!tiltQuery && typeof window !== "undefined") {
    window.addEventListener("resize", evaluateTilt);
  }

  card.dataset.bound = "true";
};

const setupAuthForms = () => {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const loginHelper = document.getElementById("loginHelper");

  if (loginHelper && window.location.hash === "#registered") {
    loginHelper.textContent = "회원가입 완료! 로그인 해주세요.";
    loginHelper.hidden = false;
    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  if (loginForm && loginForm.dataset.bound !== "true") {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const email = (formData.get("email") ?? "").toString().trim();
      const password = (formData.get("password") ?? "").toString().trim();

      if (!email || !password) {
        if (loginError) {
          loginError.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
        }
        return;
      }

      if (loginError) {
        loginError.textContent = "";
      }
      if (loginHelper) {
        loginHelper.hidden = true;
      }

      apiPost("/login", { email, password }, "[auth] login")
        .then((data) => {
          if (data?.success) {
            const user = data.user ?? { email };
            saveUser(user);
            updateUserBadge(user);
            if (loginForm.id && loginForm.id === "loginForm") {
              loginForm.reset();
            }
            if (window.location.pathname.endsWith("login.html")) {
              window.location.href = "mypage.html";
            }
            console.info("[auth] login logical success");
          } else if (loginError) {
            loginError.textContent =
              data?.message ?? "로그인에 실패했습니다. 다시 시도해주세요.";
            console.warn("[auth] login logical failure");
          }
        })
        .catch(() => {
          console.warn("[auth] login network failure - using fallback user");
          const fallbackUser = { email };
          saveUser(fallbackUser);
          updateUserBadge(fallbackUser);
          if (window.location.pathname.endsWith("login.html")) {
            window.location.href = "mypage.html";
          }
        });
    });
    loginForm.dataset.bound = "true";
  }

  const registerForm = document.getElementById("registerForm");
  const registerError = document.getElementById("registerError");
  if (registerForm && registerForm.dataset.bound !== "true") {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const email = (formData.get("email") ?? "").toString().trim();
      const password = (formData.get("password") ?? "").toString().trim();
      const nickname = (formData.get("nickname") ?? "").toString().trim();

      if (!email || !password || !nickname) {
        if (registerError) {
          registerError.textContent = "모든 정보를 입력해주세요.";
        }
        return;
      }

      if (registerError) {
        registerError.textContent = "";
      }

      try {
        const response = await apiPost(
          "/register",
          { email, password, nickname },
          "[auth] register"
        );
        if (response?.success) {
          registerForm.reset();
          window.location.href = "login.html#registered";
          return;
        }
        if (registerError) {
          registerError.textContent =
            response?.message ?? "회원가입에 실패했습니다. 다시 시도해주세요.";
        }
      } catch (_error) {
        console.warn("[auth] register network failure - using fallback user");
        const fallbackUser = { email, nickname };
        saveUser(fallbackUser);
        updateUserBadge(fallbackUser);
        registerForm.reset();
        window.location.href = "mypage.html";
      }
    });
    registerForm.dataset.bound = "true";
  }
};

const fetchPerfumesFromApi = async () => {
  if (cachedApiPerfumes) {
    return cachedApiPerfumes;
  }
  const payload = await apiGet("/perfumes", "[perfumes] fetch");
  const perfumes = extractPerfumeArray(payload)
    .map(normalizePerfumeForUi)
    .filter(Boolean);
  cachedApiPerfumes = perfumes;
  return perfumes;
};

const getPreferencePayload = () => loadPreferences();

const initHomePage = () => {
  console.info("[home] init");
  initCommonUI();

  setupInstantFlipCard();
  setupHeroInteractions();
  setupHomeScrollReveals();

  const fallbackWeather = { condition: "맑음", temp: 22, humidity: 45 };

  const loadTodayWeather = async () => {
    try {
      const response = await fetch(`${API_BASE}/weather`);
      if (!response.ok) {
        throw new Error(`${response.status}`);
      }
      const data = await response.json();
      applyWeatherCard({
        condition: data.description ?? fallbackWeather.condition,
        temp: typeof data.temp === "number" ? data.temp : fallbackWeather.temp,
        humidity:
          typeof data.humidity === "number"
            ? data.humidity
            : fallbackWeather.humidity,
      });
    } catch (error) {
      console.warn("[home] weather fetch failed, using fallback:", error);
      applyWeatherCard(fallbackWeather);
    }
  };

  loadTodayWeather();
};

const initSelectPage = () => {
  console.info("[select] init");
  initCommonUI();

  const form = document.getElementById("preferenceForm");
  if (!form) {
    return;
  }

  const stored = getPreferencePayload();
  const presetNotes = new Set(stored.notes ?? []);
  const presetExclude = new Set(stored.exclude ?? []);

  form.querySelectorAll('input[name="notes"]').forEach((checkbox) => {
    checkbox.checked = presetNotes.has(checkbox.value);
  });

  form.querySelectorAll('input[name="exclude"]').forEach((checkbox) => {
    checkbox.checked = presetExclude.has(checkbox.value);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const notes = Array.from(
      form.querySelectorAll('input[name="notes"]:checked')
    ).map((input) => input.value);

    const exclude = Array.from(
      form.querySelectorAll('input[name="exclude"]:checked')
    ).map((input) => input.value);

    const preferencePayload = { notes, exclude, context: [] };
    savePreferences(preferencePayload);
    window.location.href = "result.html";
  });
};

const initResultPage = async () => {
  console.info("[result] init");
  initCommonUI();

  resultView.boardEl = document.getElementById("recommendBoard");
  resultView.emptyStateEl = null;
  resultView.summaryEl = document.getElementById("resultSummary");
  resultView.weatherEl = document.getElementById("resultWeather");

  if (!resultView.boardEl) {
    return;
  }

  bindCardActions(resultView.boardEl);

  const storedWeather = loadStoredWeather();
  updateResultWeather(storedWeather);

  const preferences = getPreferencePayload();
  resultView.preferences = preferences;

  const readable = preferences.notes
    .map((key) => preferenceLabels[key] ?? key)
    .join(", ");

  if (resultView.summaryEl) {
    resultView.summaryEl.textContent = preferences.notes.length
      ? `${readable} 취향을 중심으로 추천을 준비하고 있어요.`
      : "취향이 설정되지 않았어요. 먼저 선호하는 향을 선택해주세요.";
  }

  if (!preferences.notes.length) {
    showEmptyState(
      "취향이 없어요",
      "취향을 먼저 등록하면 추천을 받을 수 있어요."
    );
    return;
  }

  setResultLoading(true);

  try {
    const response = await apiPost(
      "/recommendations",
      preferences,
      "[recommendations] fetch"
    );
    renderCardsFromApi(response);
  } catch (error) {
    console.warn("[result] recommendations API error, falling back:", error);
    renderCardsFromDummy();
  } finally {
    setResultLoading(false);
  }
};

const initDetailPage = async () => {
  console.info("[detail] init");
  initCommonUI();

  const params = new URLSearchParams(window.location.search);
  const perfumeId = params.get("id");
  const shell = document.getElementById("detailShell");
  const notesPanel = document.getElementById("detailNotesPanel");
  const metricsPanel = document.getElementById("detailMetricsPanel");
  const similarPanel = document.getElementById("detailSimilarPanel");

  if (!perfumeId || !shell) {
    return;
  }

  const applyPerfumeDetails = (source) => {
    const perfume = normalizePerfumeForUi(source);
    if (!perfume) {
      window.location.href = "result.html";
      return;
    }

    const accent = perfume.accent ?? pickAccentColor(perfume);
    const accentSoft = withAlpha(accent, 0.16);
    const highlight = withAlpha(accent, 0.24);
    shell.style.setProperty("--detail-accent", accent);
    shell.style.setProperty("--detail-accent-soft", accentSoft);
    shell.style.setProperty("--note-highlight", highlight);

    const mediaWrapper = document.getElementById("detailMedia");
    const imageEl = document.getElementById("detailImage");
    if (mediaWrapper) {
      mediaWrapper.style.background = `linear-gradient(135deg, ${mixWithWhite(
        accent,
        0.65
      )}, ${mixWithWhite(accent, 0.35)})`;
      if (imageEl && perfume.image_url) {
        imageEl.src = perfume.image_url;
        imageEl.alt = `${perfume.name ?? ""} 향수 이미지`;
        imageEl.hidden = false;
        mediaWrapper.classList.remove("is-placeholder");
      } else if (imageEl) {
        imageEl.hidden = true;
        mediaWrapper.classList.add("is-placeholder");
      }
    }

    const brandEl = document.getElementById("detailBrand");
    const titleEl = document.getElementById("detailTitle");
    const descriptionEl = document.getElementById("detailDescription");
    const tagListEl = document.getElementById("detailTagList");
    const bookmarkButton = document.getElementById("detailBookmarkButton");
    const officialLink = document.getElementById("detailOfficialLink");
    const topEl = document.getElementById("detailTopNotes");
    const heartEl = document.getElementById("detailHeartNotes");
    const baseEl = document.getElementById("detailBaseNotes");
    const notesVisual = document.getElementById("detailNotesVisual");
    const notesList = document.getElementById("detailNotesList");
    const seasonBadge = document.getElementById("detailSeasonBadge");
    const timeBadge = document.getElementById("detailTimeBadge");
    const seasonScale = document.getElementById("detailSeasonScale");
    const timeScale = document.getElementById("detailTimeScale");
    const longevityValueEl = document.getElementById("detailLongevityValue");
    const longevityBar = document.getElementById("detailLongevityBar");
    const sillageValueEl = document.getElementById("detailSillageValue");
    const sillageBar = document.getElementById("detailSillageBar");
    const similarGrid = document.getElementById("detailSimilarGrid");

    if (brandEl) {
      brandEl.textContent = perfume.brand ?? "HYANG";
    }
    if (titleEl) {
      titleEl.textContent = perfume.name ?? "향수 정보";
    }
    if (descriptionEl) {
      descriptionEl.textContent =
        perfume.description ?? "향수 설명이 준비 중입니다.";
    }
    const breadcrumbCurrent = document.getElementById(
      "detailBreadcrumbCurrent"
    );
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = perfume.name ?? "향수 상세";
    }

    if (tagListEl) {
      const tagCandidates = [
        ...(perfume.notes.top ?? []),
        ...(perfume.notes.middle ?? []),
        ...(perfume.notes.base ?? []),
        ...(perfume.tags ?? []),
      ];
      renderTagPills(tagListEl, tagCandidates);
    }

    const heartNotes =
      perfume.notes.middle.length > 0
        ? perfume.notes.middle
        : perfume.notes.heart ?? [];
    renderNoteChips(topEl, perfume.notes.top);
    renderNoteChips(heartEl, heartNotes);
    renderNoteChips(baseEl, perfume.notes.base);

    if (bookmarkButton) {
      bookmarkButton.dataset.accent = accent;
      setBookmarkButtonState(bookmarkButton, isBookmarked(perfume.id));
      if (bookmarkButton.dataset.bound !== "true") {
        bookmarkButton.addEventListener("click", () => {
          const updated = toggleBookmark(perfume.id);
          const isActive = updated.includes(perfume.id);
          setBookmarkButtonState(bookmarkButton, isActive);
        });
        bookmarkButton.dataset.bound = "true";
      }
    }

    if (officialLink) {
      officialLink.href = buildOfficialLink(perfume);
    }

    const hasNotes =
      (perfume.notes.top?.length ?? 0) +
        (heartNotes?.length ?? 0) +
        (perfume.notes.base?.length ?? 0) >
      0;
    if (notesPanel) {
      notesPanel.hidden = !hasNotes;
    }
    if (hasNotes && notesVisual) {
      notesVisual.innerHTML = buildNotePyramidSvg();
      notesVisual.style.setProperty("--note-highlight", highlight);
      notesVisual.dataset.hover = "";
      if (notesList) {
        notesList.dataset.hover = "";
        if (notesList.dataset.bound !== "true") {
          notesList.querySelectorAll(".note-block").forEach((block) => {
            block.tabIndex = 0;
            const noteKey = block.dataset.note;
            const setHover = (value) => {
              notesVisual.dataset.hover = value ?? "";
              notesList.dataset.hover = value ?? "";
            };
            block.addEventListener("mouseenter", () => setHover(noteKey));
            block.addEventListener("mouseleave", () => setHover(""));
            block.addEventListener("focusin", () => setHover(noteKey));
            block.addEventListener("focusout", () => setHover(""));
          });
          notesList.dataset.bound = "true";
        }
      }
    }

    if (metricsPanel) {
      metricsPanel.hidden = false;
      const longevity = deriveMetricValue(perfume, "longevity", 7);
      const sillage = deriveMetricValue(perfume, "sillage", 6);
      if (longevityValueEl) {
        longevityValueEl.textContent = `${Math.round(longevity)}/10`;
      }
      if (longevityBar) {
        longevityBar.style.width = `${(longevity / 10) * 100}%`;
        longevityBar.style.background = accent;
      }
      if (sillageValueEl) {
        sillageValueEl.textContent = `${Math.round(sillage)}/10`;
      }
      if (sillageBar) {
        sillageBar.style.width = `${(sillage / 10) * 100}%`;
        sillageBar.style.background = accent;
      }
      const seasonSuggestion = computeSeasonSuggestion(perfume);
      const timeSuggestion = computeTimeSuggestion(perfume);
      if (seasonBadge) {
        seasonBadge.textContent = seasonSuggestion.badge;
      }
      if (timeBadge) {
        timeBadge.textContent = timeSuggestion.badge;
      }
      buildScaleTrack(
        seasonScale,
        SEASON_LABELS_KR,
        seasonSuggestion.index,
        accent
      );
      buildScaleTrack(timeScale, TIME_LABELS_KR, timeSuggestion.index, accent);
    }

    if (similarPanel && similarGrid) {
      const similarItems = findSimilarPerfumes(perfume);
      similarGrid.innerHTML = "";
      similarItems.forEach((item) => {
        const cardAccent = item.accent ?? pickAccentColor(item);
        const gradient = `linear-gradient(135deg, ${cardAccent}, ${mixWithWhite(
          cardAccent,
          0.5
        )})`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "similar-card";
        button.style.setProperty("--similar-gradient", gradient);
        button.dataset.id = item.id;
        button.innerHTML = `
          <span class="similar-card__title">${item.name ?? "향수"}</span>
          <span class="similar-card__brand">${item.brand ?? "HYANG"}</span>
        `;
        similarGrid.appendChild(button);
      });
      similarPanel.hidden = !similarItems.length;
      if (similarGrid.dataset.bound !== "true") {
        similarGrid.addEventListener("click", (event) => {
          const targetCard = event.target.closest(".similar-card");
          if (!targetCard) {
            return;
          }
          const targetId = targetCard.dataset.id;
          if (targetId) {
            window.location.href = `detail.html?id=${encodeURIComponent(
              targetId
            )}`;
          }
        });
        similarGrid.dataset.bound = "true";
      }
    }

    shell.hidden = false;
  };

  try {
    const perfumes = await fetchPerfumesFromApi();
    const target = perfumes.find((item) => item.id === perfumeId);
    if (target) {
      applyPerfumeDetails(target);
      return;
    }
    console.warn("[detail] perfume not found in API, using fallback");
  } catch (_error) {
    console.warn("[detail] API error, using fallback");
  }

  const fallback = perfumeList.find((item) => item.id === perfumeId);
  applyPerfumeDetails(fallback);
};

const initCatalogPage = async () => {
  console.info("[catalog] init");
  catalogView.listEl = document.getElementById("catalogList");
  catalogView.emptyStateEl = document.getElementById("catalogEmptyState");
  catalogView.countEl = document.getElementById("catalogResultCount");
  catalogView.searchInput = document.getElementById("catalogSearchInput");
  catalogView.seasonSelect = document.getElementById("catalogSeasonFilter");
  catalogView.sortSelect = document.getElementById("catalogSortSelect");
  catalogView.baseItems = [];

  const { listEl, emptyStateEl } = catalogView;
  if (!listEl || !emptyStateEl) {
    return;
  }

  bindCardActions(listEl);

  const renderCatalog = (items) => {
    listEl.innerHTML = "";
    if (!items.length) {
      emptyStateEl.hidden = false;
      emptyStateEl.classList.add("is-visible");
      if (catalogView.countEl) {
        catalogView.countEl.textContent = "0개의 향수";
      }
      return;
    }

    emptyStateEl.hidden = true;
    emptyStateEl.classList.remove("is-visible");

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = createCatalogCard(item);
      if (card) {
        fragment.appendChild(card);
      }
    });
    listEl.appendChild(fragment);
    if (catalogView.countEl) {
      catalogView.countEl.textContent = `${items.length}개의 향수`;
    }
  };

  const applyCatalogFilters = () => {
    if (
      !Array.isArray(catalogView.baseItems) ||
      !catalogView.baseItems.length
    ) {
      listEl.innerHTML = "";
      emptyStateEl.hidden = false;
      emptyStateEl.classList.add("is-visible");
      if (catalogView.countEl) {
        catalogView.countEl.textContent = "0개의 향수";
      }
      return;
    }

    let items = catalogView.baseItems.slice();
    const query = (catalogView.searchInput?.value ?? "").trim().toLowerCase();
    if (query) {
      items = items.filter((perfume) => {
        const text = [
          perfume.name,
          perfume.brand,
          ...(Array.isArray(perfume.tags) ? perfume.tags : []),
          ...(Array.isArray(perfume.accords) ? perfume.accords : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      });
    }

    const seasonValue = catalogView.seasonSelect?.value ?? "all";
    if (seasonValue !== "all") {
      items = items.filter((perfume) =>
        Array.isArray(perfume.seasonality)
          ? perfume.seasonality.includes(seasonValue)
          : false
      );
    }

    const sortValue = catalogView.sortSelect?.value ?? "name-asc";
    items.sort((a, b) => {
      const nameA = (a.name ?? "").toLowerCase();
      const nameB = (b.name ?? "").toLowerCase();
      const brandA = (a.brand ?? "").toLowerCase();
      const brandB = (b.brand ?? "").toLowerCase();

      switch (sortValue) {
        case "name-desc":
          return nameB.localeCompare(nameA, "ko");
        case "brand-asc":
          return brandA.localeCompare(brandB, "ko");
        default:
          return nameA.localeCompare(nameB, "ko");
      }
    });

    renderCatalog(items);
  };

  const handleToolbarChange = () => {
    applyCatalogFilters();
  };

  if (catalogView.searchInput) {
    catalogView.searchInput.addEventListener("input", handleToolbarChange);
  }
  if (catalogView.seasonSelect) {
    catalogView.seasonSelect.addEventListener("change", handleToolbarChange);
  }
  if (catalogView.sortSelect) {
    catalogView.sortSelect.addEventListener("change", handleToolbarChange);
  }

  try {
    const perfumes = await fetchPerfumesFromApi();
    catalogView.baseItems = perfumes.map(normalizePerfumeForUi).filter(Boolean);
  } catch (error) {
    console.warn("[catalog] API error, using fallback");
    catalogView.baseItems = perfumeList
      .map(normalizePerfumeForUi)
      .filter(Boolean);
  }
  applyCatalogFilters();
};

const initMyPage = async () => {
  console.info("[mypage] init");
  mypageView.nicknameEl = document.getElementById("mypageNickname");
  mypageView.emailEl = document.getElementById("mypageEmail");
  mypageView.avatarInitialEl = document.getElementById("mypageAvatarInitial");
  mypageView.preferenceEl = document.getElementById("mypagePreferenceHint");
  mypageView.bookmarkCountEl = document.getElementById("mypageBookmarkCount");
  mypageView.bookmarkMetaEl = document.getElementById("mypageBookmarkMeta");
  mypageView.bookmarkGrid = document.getElementById("mypageBookmarkGrid");
  mypageView.bookmarkEmptyEl = document.getElementById("mypageBookmarkEmpty");
  mypageView.logoutButton = document.getElementById("mypageLogoutButton");
  mypageView.bookmarks = [];

  applyMyPageProfile(loadStoredUser());
  applyMyPagePreferenceSummary();
  applyBookmarkStats(0);

  const wireLogoutButton = (button) => {
    if (!button || button.dataset.bound === "true") {
      return;
    }
    button.addEventListener("click", (event) => {
      const action = button.dataset.action;
      if (action === "logout") {
        clearUser();
        updateUserBadge(dummyUser);
        applyMyPageProfile(null);
        applyBookmarkStats(mypageView.bookmarks.length);
        return;
      }
      if (button.dataset.mode === "login") {
        window.location.href = "login.html";
        return;
      }
    });
    button.dataset.bound = "true";
  };

  wireLogoutButton(mypageView.logoutButton);
  wireLogoutButton(document.getElementById("topbarAuthButton"));

  if (mypageView.bookmarkGrid) {
    bindCardActions(mypageView.bookmarkGrid, {
      onBookmarkChange: (_id, updatedIds, isActive) => {
        applyBookmarkStats(updatedIds.length);
        if (!isActive) {
          const remaining = new Set(updatedIds.map((value) => String(value)));
          mypageView.bookmarks = (mypageView.bookmarks ?? []).filter((item) =>
            remaining.has(String(item.id))
          );
          renderMypageBookmarks();
        }
      },
    });
  }

  try {
    const bookmarks = await fetchBookmarkPerfumes();
    mypageView.bookmarks = bookmarks;
  } catch (error) {
    console.warn("[mypage] bookmark load fallback:", error);
    mypageView.bookmarks = [];
  }
  applyBookmarkStats(mypageView.bookmarks.length);
  renderMypageBookmarks();
};

const pageInitializers = {
  home: initHomePage,
  select: initSelectPage,
  result: initResultPage,
  detail: initDetailPage,
  catalog: initCatalogPage,
  mypage: initMyPage,
};

document.addEventListener("DOMContentLoaded", () => {
  syncBackgroundAnimation();
  initCommonUI();
  hydrateUserBadge();
  setupAuthForms();

  const pageKey = document.body.dataset.page;
  const initializer = pageInitializers[pageKey];
  if (typeof initializer === "function") {
    Promise.resolve(initializer()).catch((error) => {
      console.warn(`[${pageKey}] init error: ${error?.message ?? error}`);
    });
  }
});
// 변경 끝
