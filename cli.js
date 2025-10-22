#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import {
  addBookmark,
  getBookmarks,
  config as configStore,
} from "./utils/config.js";

// Ensure UTF-8 encoding for proper IAST character display
process.stdout.setDefaultEncoding("utf8");
process.stderr.setDefaultEncoding("utf8");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let geetaPath = path.join(process.cwd(), "geeta");
if (!fs.existsSync(geetaPath)) {
  geetaPath = path.join(__dirname, "geeta");
}
// -----------------------------------

// Early handler for random verse flag (e.g., -r or --random)
{
  const rawArgs = process.argv.slice(2);
  const subcommands = [
    "verse",
    "chapter",
    "search",
    "demo",
    "bookmark",
    "bookmarks",
  ];
  if (
    (rawArgs.includes("-r") || rawArgs.includes("--random")) &&
    !subcommands.includes(rawArgs[0])
  ) {
    // no subcommand -> print random verse and exit
    const rand = getRandomVerse();
    // getRandomVerse already prints and exits on error; if it returns, exit now
    process.exit(0);
  }
}

// Helper: Load all chapters
function loadChapters() {
  const files = fs.readdirSync(geetaPath).filter((f) => f.endsWith(".json"));
  const parsed = files
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(geetaPath, file), "utf-8"))
    )
    // Only include entries that have a non-empty verses array — these are real chapters
    .filter((ch) => ch && Array.isArray(ch.verses) && ch.verses.length > 0);
  return parsed;
}

// Helper: Get random item
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Main logic: Generate random verse
function getRandomVerse(chapterId = null) {
  // --- FIX 3: Add Error Handling ---
  let chapters;
  try {
    chapters = loadChapters();
  } catch (err) {
    console.log(
      chalk.red("❌ Error: Could not find or read the 'geeta' directory.")
    );
    console.log(chalk.gray(`   (Looking in: ${geetaPath})`));
    console.log(
      chalk.gray(
        "   Make sure the 'geeta' folder with JSON files exists next to the script."
      )
    );
    process.exit(1);
  }
  // ---------------------------------

  let chapter;

  if (chapterId) {
    // --- FIX 2: Parse chapterId as a number ---
    chapter = chapters.find((ch) => ch.id === parseInt(chapterId));
    // ------------------------------------------

    if (!chapter) {
      console.log(chalk.red(`❌ Chapter ${chapterId} not found.`));
      process.exit(1);
    }
  } else {
    chapter = randomItem(chapters);
  }

  const verse = randomItem(chapter.verses);

  console.log(
    chalk.bold.cyan(
      `📖 Bhagavad-Gītā - Chapter ${chapter.id}: ${chapter.title}`
    )
  );
  console.log(chalk.gray(chapter.description));
  console.log("\n" + chalk.yellow(`🕉️ ${verse.id}`));
  console.log(chalk.green(verse.transliteration));
  console.log("\n" + chalk.magentaBright(`💬 Translation:`));
  console.log(verse.translation);
  console.log("\n" + chalk.blueBright(`📚 Purport:`));
  console.log(verse.purport.split("\n")[0] + "..."); // show first paragraph
  console.log("\n🙏 Hare Kṛṣṇa 🙏");
}

// Utility: get a specific verse by chapter and verse number
function getVerse(chapterId, verseNum) {
  const chapters = loadChapters();
  const chapter = chapters.find((ch) => ch.id === chapterId.toString());
  if (!chapter) return null;
  // verse.id looks like "VERSE 1" in the data — match the numeric part
  const verse = chapter.verses.find((v) => {
    const m = String(v.id).match(/\d+/);
    return m && m[0] === String(verseNum);
  });
  return verse ? { chapter, verse } : null;
}

// Utility: get whole chapter
function getChapter(chapterId) {
  const chapters = loadChapters();
  return chapters.find((ch) => ch.id === chapterId.toString()) || null;
}

// Utility: search across transliteration and translation
function searchQuery(q) {
  const chapters = loadChapters();
  const query = q.toLowerCase();
  const results = [];
  for (const ch of chapters) {
    if (!Array.isArray(ch.verses)) continue;
    for (const v of ch.verses) {
      const text = (
        (v.translation || "") +
        " \n " +
        (v.transliteration || "")
      ).toLowerCase();
      if (text.includes(query)) {
        const m = String(v.id).match(/\d+/);
        results.push({
          chapter: ch.id,
          chapterTitle: ch.title,
          verse: m ? m[0] : v.id,
          text: v.translation || v.transliteration || "",
        });
      }
    }
  }
  return results;
}

program
  .name("geeta")
  .description(
    chalk.cyanBright("⠀⠀⠀⠀⠀⠀⣀⡀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⢀⢀⡀⠀⡀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
      chalk.blue("⠀⠀⠀⠀⠀⢠⡇⡇⢠") +
      chalk.yellow("⣟") +
      chalk.white("⢁⠀⡔⡴⠀⠀⠀⠀⠀⠀⠀⠀⣰") +
      chalk.yellow("⣣⣮⣾⣡⣼⣟⣠") +
      chalk.blue("⣂⣄⡀⠀⠀⠀⠀⠀⠀⠀\n") +
      "⠀⠀⢰⡘" +
      chalk.yellow("⣦⡰⣿⣾⣼⣿⣆") +
      "⠈⣇⣇⠀⠀⠀⠀⠀⢠⠀" +
      chalk.blue("⣷⣿⣿⣿⣟") +
      chalk.yellow(
        "⡛⢉⣹⠿⣁⣀⠀⠀⠀⠀⠀⠀⠀⠀\n" +
          "⠀⠀⠀⠱" +
          chalk.yellow("⡼⣧⡟⣿⣿⣿⣧⣿⣿") +
          chalk.white("⢢⢀⡀⠀⠀⢈⢦") +
          chalk.yellow("⣿⢯⣶⣷⣆⢹⣾⣿⠟⣙⡀") +
          chalk.blue("⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠈⣉⠲⣔" +
          chalk.yellow("⣾⣿") +
          "⢇⡞⠉⠉⠛⢿⡿⣿⢸⣧⠗⠀⠀⠈⢎" +
          chalk.blue("⣿⡎⣿⣿⠿⢧⣿⣷⠟") +
          chalk.white("⠃⠈⠁⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠈⠙⢮" +
          chalk.yellow("⣻⣿⣼⡇⣴⣾⣿⡿⣿⢸") +
          chalk.blue("⣿⣿⣾⣿⣿⣶⣸⣿⣿⣿⣿⣯") +
          chalk.cyanBright("⣉⣩⠤⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠉⢻" +
          chalk.blue("⣿⣿⣮⠻⣽⠿⢟⣱⢧⣾⣿⣿⣿⣿⣶⣿⣿⣟⣯") +
          chalk.yellow("⣍⡉⠛⠻⣶⣤⡀") +
          chalk.cyanBright("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠘⢮⣛⠛⠣⣽" +
          chalk.blue("⣿⣿⣽⣿⣿⣿⣿⢻⡟⣿⣿⣿⣯⣝⠛⢿⣿⣶⡦⣝⡳⣤⡀") +
          chalk.white("⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠙⠢⠤⢤" +
          chalk.blue("⣼⣿⣿⣿⣿⣿⣿⣿⣽⡟⣧⠘⣿⣿⣿⣿⣷⣷⣌⢻⡿⢧⣍⠫⣿⠆") +
          chalk.magenta("⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⣸" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣮⣿⡟⡉⠛⣿⣿⣿⣧⣿⢶⣭⢙⣛⣳⠾⢤⣤⣄") +
          chalk.yellow("⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀" +
          chalk.green("⣴") +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⠃⠈⠆⡿⢿⣿⣿⣿⣷⣿⣿⣿⣷") +
          chalk.yellow("⣿⠟⠉⠉⢳") +
          chalk.white("⠀⠀\n") +
          "⠀⠀⠀⡀⢸" +
          chalk.blue("⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⠀⠀⢀⣳⣮⣽⣿⣿⣿⣿⣿⣿⣿⣿⡄") +
          chalk.cyanBright("⠀⠀⠀⢀⠀\n") +
          "⠀⠀⢸⡁⠸" +
          chalk.blue("⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣋⠚⢵⣦⠀⠾⠛⠛⠉⡉⠉⠻⣿⣿⣿⣿⣿⣻⣿⣝⠓⡄⣸⡄") +
          chalk.white("\n") +
          "⠀⠀" +
          chalk.blue("⣸⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠛⠛⠛⠀⠘⠁⠀⠀⣰⣿⣿⣿⣿⣦⣾⣿⣿⣿⣿⣿⣦⠝⣫⡿⠃") +
          chalk.yellow("\n") +
          "⠀⠀" +
          chalk.blue("⣿⣈⠛⣻⣿⣿⣿⣿⠁⣠⣶⣿⣿⣷⣄⠀⠀⠀⠀⣾⣿⡿⢟⣧⡽⠋⣽⣿⠿⣿⣿⣿⣯⡁") +
          chalk.white("⠀⠀\n") +
          "⠀⠀⠻" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣾⣿⠻⣿⢿⣿⡗⠀⠀⠀⠀⠈⠉⠉⠉⠉⠈⢛⣽⣿⣆⣿⣿⣿⡻⢿⣷⡄") +
          chalk.magenta("⠀\n") +
          "⠀⠀⠰⣀⣹" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣦⣙⡿⠚⠋⠁⠀⢠⣡⠀⣾⡄⠀⠀⠀⠀⠀⣹⢿⡷⢿⣿⣿⣿⣷⡄⠙⣷") +
          chalk.white("⠀\n") +
          "⠀⠀⠀⢸" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⠿⠁⠀⠀⠀⠀⠈⠙⣯⣉⣀⣠⡄⠀⠀⠘⠃⣼⣷⣿⣿⣿⣿⣾⡬⠃") +
          chalk.cyanBright("⠀\n") +
          "⠀⠀⠀⢿⡏⢸" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠘⠒⢾⣿⣿⡿⠋⠀⠀⠀⠀⣰⣿⣹⣿⣿⠿⣿⣿⣿⡇") +
          chalk.white("⠀⠀\n") +
          "⠀⠀⠀⠘⠧⡈⠻" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠉⠛⠁⠀⠀⠠⣢⣾⣿⣯⣿⣟⣰⠿⠋⣹") +
          chalk.yellow("⠁⠀⠀\n") +
          "⠀⠀⢰⡂⠀⢀" +
          chalk.blue("⣼⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣄⣀⡀⠀⠀⠀⣄⡴⠋⢀⣿⣿⣿⣿⣿⣿⣿⡀⠶⠋⡆") +
          chalk.magenta("⠀⠀\n") +
          "⠀⠀⢨⠛⠿⠿" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠈⠉⠉⠀⠩⠋⢀⡔⢹⣿⣿⣿⣿⣿⢿⣿⣿⠶⠟") +
          chalk.white("⠁⠀⠀\n") +
          "⠀⠀⠈" +
          chalk.magenta("⣳⣶⣒") +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣿⠛⠀⠀⠀⠀⠀⠀⠠⠎⠀⣾⣿⣿⣿⣿⣯⣇⡸⠇") +
          chalk.cyanBright("⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠸⡇⢠⡏⣽" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⡦⠴⠃") +
          chalk.white("⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠘⢿" +
          chalk.blue("⣿⡟⣿⡿⠟⠋⠉⣿⣿⡄⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⢻⣿⡿⠟⡏⡇") +
          chalk.yellow("⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⡨⠷⠋⠉⠀⠀⠀⠀⠀⠹" +
          chalk.blue("⣿⣿⣿⣆⠀⠀⠀⠈⢢⠀⠀⠀⠀⠀⢸⣻⡁⠀⠀⠉⠒⠄") +
          chalk.cyanBright("⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻" +
          chalk.blue("⣿⣿⣿⣷⣄⡈⠉⢥⠑⠀⠀⠀⣨⣾⢿⡇") +
          chalk.white("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙" +
          chalk.blue("⣿⣿⣿⣻⣶⣶⣿⣻⣶⣾⣿⣹⣟⠋") +
          chalk.magenta("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠁⣄⠛⠋⣻" +
          chalk.blue("⣿⣿⣿⣿⣿⣿⣿⣿⡟⠛") +
          chalk.white("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠒⠉⠁⠀⠛" +
          chalk.blue("⣿⣿⣿⠁⠈") +
          chalk.cyanBright("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛" +
          chalk.blue("⣿⡏") +
          chalk.magenta("⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n") +
          "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n\n"
      ) +
      chalk.yellow("          Hare Kṛṣṇa Hare Kṛṣṇa Kṛṣṇa Kṛṣṇa Hare Hare\n") +
      chalk.yellow("          Hare Rāma Hare Rāma Rāma Rāma Hare Hare\n\n") +
      "     CLI to read Śrīmad-Bhāgavat-gītā verses 🕉️"
  )
  .version("1.0.0")
  .option("-r, --random", "Display a random verse")
  .option("-c, --chapter <number>", "Get a verse from a specific chapter");

program
  .command("verse <chapter> <verse>")
  .description("Display a specific verse")
  .action((chapter, verse) => {
    const r = getVerse(chapter, verse);
    if (r) {
      console.log(
        `${r.chapter.id} ${r.verse.id} - ${
          r.verse.translation || r.verse.transliteration
        }`
      );
    } else {
      console.error("Verse not found");
    }
  });

program
  .command("chapter <chapter>")
  .description("Display a specific chapter")
  .action((chapter) => {
    const c = getChapter(chapter);
    if (c) {
      console.log(`${c.id} ${c.title}`);
      c.verses.forEach((v) => {
        const m = String(v.id).match(/\d+/);
        const num = m ? m[0] : v.id;
        console.log(`${num}. ${v.translation || v.transliteration}`);
      });
    } else {
      console.error("Chapter not found");
    }
  });

program
  .command("search <query>")
  .description("Search the Bhagavad-Gītā")
  .action((query) => {
    const results = searchQuery(query);
    console.log(`Found ${results.length} results for "${query}":`);
    results.forEach((result) => {
      console.log(`${result.chapter}:${result.verse} - ${result.text}`);
    });
  });

program
  .command("demo")
  .description("Run a simple demo without TUI")
  .action(() => {
    const chapters = loadChapters();
    console.log(
      "Available chapters:",
      chapters
        .map((c) => `${c.id} ${c.title}`)
        .slice(0, 10)
        .join(" | ")
    );
    const sample = chapters[0];
    const firstVerse = sample.verses.find((v) =>
      Boolean(v.translation || v.transliteration)
    );
    console.log(
      `Sample Verse: ${sample.id} ${firstVerse.id} - ${
        firstVerse.translation || firstVerse.transliteration
      }`
    );
    const results = searchQuery("Kṛṣṇa");
    console.log(
      `Search sample for "Kṛṣṇa": ${results.length} results (showing up to 5)`
    );
    results
      .slice(0, 5)
      .forEach((r) => console.log(`${r.chapter}:${r.verse} - ${r.text}`));
  });

program
  .command("bookmark <chapter> <verse> [note]")
  .description("Add a bookmark")
  .action((chapter, verse, note) => {
    // Load chapter info to get the title
    const chapters = loadChapters();
    const chapterData = chapters.find((ch) => ch.id === chapter.toString());
    const chapterTitle = chapterData ? chapterData.title : "";
    addBookmark(chapter, parseInt(verse), note || "", chapterTitle);
    console.log(`Bookmark added for Chapter ${chapter}:${verse}`);
  });

program
  .command("bookmarks")
  .description("List all bookmarks")
  .action(() => {
    const b = getBookmarks();
    console.log("Bookmarks:");
    b.forEach((bm, i) => {
      console.log(
        `${i + 1}. Chapter ${bm.chapter}:${bm.verse}${
          bm.note ? ` - ${bm.note}` : ""
        }`
      );
    });
  });

program
  .command("theme [name]")
  .description(
    "Get or set theme (yudhisthira, bhima, arjuna, nakula, sahadeva)"
  )
  .action((name) => {
    const availableThemes = [
      "yudhisthira",
      "bhima",
      "arjuna",
      "nakula",
      "sahadeva",
    ];

    if (!name) {
      // Show current theme and available themes
      const current = configStore.get("theme") || "arjuna";
      console.log(chalk.bold("\n🎨 Current theme:"), chalk.cyan(current));
      console.log(chalk.bold("\n📋 Available themes:"));
      availableThemes.forEach((t) => {
        const indicator = t === current ? chalk.green("✓") : " ";
        console.log(`  ${indicator} ${t}`);
      });
      console.log(chalk.gray("\nUsage: geeta theme <name>"));
      console.log(chalk.gray("Example: geeta theme bhima\n"));
    } else {
      const themeName = name.toLowerCase();
      if (availableThemes.includes(themeName)) {
        configStore.set("theme", themeName);
        console.log(chalk.green(`✓ Theme changed to: ${themeName}`));
      } else {
        console.log(chalk.red(`✗ Invalid theme: ${name}`));
        console.log(
          chalk.gray("Available themes:"),
          availableThemes.join(", ")
        );
      }
    }
  });

// Interactive reader using the blessed UI
program
  .command("read")
  .description("Start interactive reader")
  .action(() => {
    try {
      // dynamic import will be handled below
    } catch (err) {
      // ignore
    }
    import("./utils/ui.js")
      .then(({ default: GeetaUI }) => {
        const ui = new GeetaUI();

        // Build single-book model for the Gita
        const chaptersRaw = loadChapters().sort(
          (a, b) => Number(a.id) - Number(b.id)
        );
        const books = [{ abbrev: "GITA", name: "Bhagavad-Gītā" }];
        const bookData = {
          chapters: chaptersRaw.map((ch) => ({
            chapter: Number(ch.id),
            title: ch.title,
            description: ch.description,
            verses: ch.verses.map((v) => {
              const m = String(v.id).match(/\d+/);
              return {
                verse: m ? Number(m[0]) : v.id,
                text: v.translation || v.transliteration || "",
                purport: v.purport || "",
                raw: v,
              };
            }),
          })),
        };

        ui.setBooks(books);

        // Track selection
        let currentSelection = { chapter: null, verse: null };

        // Initialize chapters immediately (no books panel to select from)
        ui.setChapters(
          bookData.chapters.map((c) => ({
            number: c.chapter,
            title: c.title,
          }))
        );
        ui.setStatus("Navigate chapters and verses - Press 'h' for help");
        // Auto-select first chapter to show content on startup
        if (bookData.chapters.length > 0) {
          ui.chaptersList.select(0);
          ui.chaptersList.emit("select", null, 0);
        }

        // Chapter selection handler
        ui.chaptersList.on("select", (item, index) => {
          const selectedChapter = bookData.chapters[index];
          const verseNumbers = selectedChapter.verses.map((v) => v.verse);
          verseNumbers.unshift("Whole chapter");
          ui.setVerses(verseNumbers);
          ui.displayScripture(
            books[0],
            selectedChapter,
            selectedChapter.verses
          );
          ui.setStatus(`Reading: Bhagavad-Gītā ${selectedChapter.chapter}`);
          currentSelection = { chapter: selectedChapter.chapter, verse: null };
          ui.versesList.focus();
        });

        // Verse selection handler
        ui.versesList.on("select", (item, index) => {
          const chapterIndex = ui.chaptersList.selected;
          const selectedChapter = bookData.chapters[chapterIndex];
          if (!selectedChapter) return;
          if (index === 0) {
            // Whole chapter selected
            ui.displayScripture(
              books[0],
              selectedChapter,
              selectedChapter.verses
            );
            currentSelection = {
              chapter: selectedChapter.chapter,
              verse: null,
            };
            ui.setStatus(
              `Reading: Chapter ${selectedChapter.chapter} - ${selectedChapter.title}`
            );
          } else {
            // Single verse selected - use the unified displayScripture
            const v = selectedChapter.verses[index - 1];
            ui.displayScripture(books[0], selectedChapter, [v]);
            currentSelection = {
              chapter: selectedChapter.chapter,
              verse: v.verse,
            };
            ui.setStatus(
              `Chapter ${selectedChapter.chapter}:${v.verse} - ${selectedChapter.title}`
            );
          }
          ui.render();
        });

        // Search key
        ui.screen.key("s", () => {
          ui.showSearchPrompt((query) => {
            const results = searchQuery(query);
            ui.showSearchResults(results, query, (result) => {
              // navigate to result
              const chIdx = bookData.chapters.findIndex(
                (c) => Number(c.chapter) === Number(result.chapter)
              );
              if (chIdx !== -1) {
                ui.chaptersList.select(chIdx);
                ui.chaptersList.emit("select", null, chIdx);
                // select verse
                const verseIdx = bookData.chapters[chIdx].verses.findIndex(
                  (v) => Number(v.verse) === Number(result.verse)
                );
                if (verseIdx !== -1) {
                  ui.versesList.select(verseIdx + 1);
                  ui.versesList.emit("select", null, verseIdx + 1);
                }
              }
            });
          });
        });

        // Bookmarks key
        ui.screen.key("b", () => {
          const bookmarks = getBookmarks();
          ui.showBookmarks(
            bookmarks,
            (bookmark) => {
              const chIdx = bookData.chapters.findIndex(
                (c) => Number(c.chapter) === Number(bookmark.chapter)
              );
              if (chIdx !== -1) {
                ui.chaptersList.select(chIdx);
                ui.chaptersList.emit("select", null, chIdx);
                const verseIdx = bookData.chapters[chIdx].verses.findIndex(
                  (v) => Number(v.verse) === Number(bookmark.verse)
                );
                if (verseIdx !== -1) {
                  ui.versesList.select(verseIdx + 1);
                  ui.versesList.emit("select", null, verseIdx + 1);
                }
              }
            },
            (updated) => {
              // Save updated bookmarks
              configStore.set("bookmarks", updated);
            }
          );
        });

        // Random key
        ui.screen.key("r", () => {
          const rand = randomItem(bookData.chapters);
          const rv = randomItem(rand.verses);
          const chIdx = bookData.chapters.findIndex(
            (c) => c.chapter === rand.chapter
          );
          if (chIdx !== -1) {
            ui.chaptersList.select(chIdx);
            ui.chaptersList.emit("select", null, chIdx);
            const verseIdx = rand.verses.findIndex((v) => v.verse === rv.verse);
            if (verseIdx !== -1) {
              ui.versesList.select(verseIdx + 1);
              ui.versesList.emit("select", null, verseIdx + 1);
            }
          }
        });

        // Add bookmark key
        ui.screen.key("a", () => {
          if (currentSelection.chapter && currentSelection.verse) {
            const notePrompt = blessed.prompt({
              parent: ui.screen,
              border: { type: "line" },
              height: "shrink",
              width: "half",
              top: "center",
              left: "center",
              label: " Add Bookmark Note (optional) ",
              tags: true,
              keys: true,
              vi: true,
            });
            notePrompt.input(
              "Enter a note for this bookmark (or leave empty):",
              "",
              (err, note) => {
                if (!err) {
                  // Get the chapter title for the bookmark
                  const chIdx = bookData.chapters.findIndex(
                    (c) => c.chapter === currentSelection.chapter
                  );
                  const chapterTitle =
                    chIdx !== -1 ? bookData.chapters[chIdx].title : "";
                  addBookmark(
                    currentSelection.chapter,
                    currentSelection.verse,
                    note || "",
                    chapterTitle
                  );
                  ui.setStatus(
                    `Bookmark added: Bhagavad-Gītā ${currentSelection.chapter}:${currentSelection.verse}`
                  );
                }
                ui.render();
              }
            );
          } else {
            ui.setStatus("No verse selected. Please select a verse first.");
          }
        });

        // Theme picker
        ui.screen.key("t", () => {
          ui.showThemePicker();
        });

        // Initialize: Focus chapters list and auto-select first chapter
        ui.chaptersList.focus();
        ui.chaptersList.select(0);
        // Trigger the select event to load the first chapter's content
        ui.chaptersList.emit("select", null, 0);
        ui.render();
      })
      .catch((err) => {
        console.error("Error starting interactive mode:", err && err.message);
        console.error(
          "If running in a limited terminal, try the command-line commands instead:"
        );
        console.error("  node cli.js demo");
      });
  });

// Parse arguments once all commands and options are registered
program.parse(process.argv);

// Handle top-level options if no subcommand was provided
const opts = program.opts();
// program.args contains leftover arguments; when a subcommand is used it will be non-empty
const hasSubcommand = program.args && program.args.length > 0;
if (!hasSubcommand) {
  if (opts.random) {
    getRandomVerse();
    process.exit(0);
  }
  if (opts.chapter) {
    getRandomVerse(opts.chapter);
    process.exit(0);
  }
}
