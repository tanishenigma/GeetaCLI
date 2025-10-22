import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_NAME = ".geeta-cli-config.json";
const CONFIG_PATH = path.join(os.homedir(), CONFIG_NAME);

let _data = null;

function load() {
  if (_data) return _data;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      _data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) || {};
    } else {
      _data = {};
    }
  } catch (e) {
    _data = {};
  }
  // ensure bookmarks array
  if (!_data.bookmarks) _data.bookmarks = [];
  return _data;
}

function save() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(_data, null, 2), "utf8");
  } catch (e) {
    console.log(e);
  }
}

export const config = {
  get: (k) => load()[k],
  set: (k, v) => {
    load()[k] = v;
    save();
  },
};

// Theme palettes named after the five Pandavas
export const themes = {
  yudhisthira: {
    highlight: "#FFD700",
    border: "#9A8C6A",
    book: "#E6C07B",
    chapter: "#C6D68F",
    verse: "#61AFEF",
    fg: "#ECEFF4",
    bg: "#16161A",
    statusBg: "#2B2B2F",
  },
  bhima: {
    highlight: "#FF5555",
    border: "#884444",
    book: "#FFB86C",
    chapter: "#F1FA8C",
    verse: "#FF79C6",
    fg: "#F8F8F2",
    bg: "#282A36",
    statusBg: "#23242A",
  },
  arjuna: {
    highlight: "#61AFEF",
    border: "#3B6F9A",
    book: "#8BE9FD",
    chapter: "#50FA7B",
    verse: "#F1FA8C",
    fg: "#EDF6FF",
    bg: "#071425",
    statusBg: "#082235",
  },
  nakula: {
    highlight: "#50FA7B",
    border: "#2F7A3A",
    book: "#3BE38A",
    chapter: "#B2FF59",
    verse: "#C3E88D",
    fg: "#F7FFF7",
    bg: "#07130A",
    statusBg: "#072917",
  },
  sahadeva: {
    highlight: "#BD93F9",
    border: "#6E4BAF",
    book: "#8BE9FD",
    chapter: "#50FA7B",
    verse: "#F8F8F2",
    fg: "#F8F8F2",
    bg: "#1E1B2F",
    statusBg: "#2A2540",
  },
};

export function getTheme() {
  const t = config.get("theme") || "arjuna";
  return themes[t] || themes["arjuna"];
}

export function getBookmarks() {
  return load().bookmarks || [];
}

export function addBookmark(chapter, verse, note = "", chapterTitle = "") {
  const data = load();
  data.bookmarks = data.bookmarks || [];
  data.bookmarks.push({
    chapter: String(chapter),
    verse: Number(verse),
    note: note || "",
    chapterTitle: chapterTitle || "",
  });
  save();
}

export function removeBookmark(index) {
  const data = load();
  if (!data.bookmarks) return;
  data.bookmarks.splice(index, 1);
  save();
}

export default { config, getBookmarks, addBookmark, removeBookmark };
