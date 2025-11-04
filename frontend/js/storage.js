const PREFERENCE_KEY = "hyang.preferences";
const BOOKMARK_KEY = "hyang.bookmarks";

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("Failed to parse stored data:", error);
    return fallback;
  }
};

export const loadPreferences = () => {
  return safeParse(localStorage.getItem(PREFERENCE_KEY), []);
};

export const savePreferences = (preferences) => {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
};

export const loadBookmarks = () => {
  return safeParse(localStorage.getItem(BOOKMARK_KEY), []);
};

export const saveBookmarks = (bookmarkIds) => {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarkIds));
};

export const toggleBookmark = (perfumeId) => {
  const current = new Set(loadBookmarks());
  if (current.has(perfumeId)) {
    current.delete(perfumeId);
  } else {
    current.add(perfumeId);
  }
  const result = Array.from(current);
  saveBookmarks(result);
  return result;
};

export const isBookmarked = (perfumeId) => {
  return loadBookmarks().includes(perfumeId);
};
