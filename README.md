# Geeta CLI 🕉️

A beautiful command-line interface tool coded in an hour to read and explore the Bhagavad Gita (Śrīmad-Bhāgavat-gītā) with an interactive terminal UI, multiple Pandava-themed color schemes, bookmarks, and powerful search functionality.

```
          Hare Kṛṣṇa Hare Kṛṣṇa Kṛṣṇa Kṛṣṇa Hare Hare
          Hare Rāma Hare Rāma Rāma Rāma Hare Hare
```

## ✨ Features

- 📖 **Complete Bhagavad Gita** - All 18 chapters with Sanskrit transliteration, English translation, and purports
- 🎨 **Pandava Themes** - Five beautiful color themes named after the Pandava brothers (Yudhisthira, Bhima, Arjuna, Nakula, Sahadeva)
- 💻 **Interactive TUI** - Beautiful terminal user interface with keyboard navigation
- 🔖 **Bookmarks** - Save your favorite verses with personal notes
- 🔍 **Search** - Search across all verses, translations, and transliterations
- 🎲 **Random Verse** - Get inspired by a random verse from the Gita
- ⚡ **Fast & Lightweight** - Pure JavaScript, no browser needed

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g geeta-cli
```

### Local Installation

```bash
npm install geeta-cli
npx geeta
```

## 🚀 Usage

### Interactive Mode

Launch the beautiful TUI interface:

```bash
geeta read
```

**Keyboard Shortcuts:**
- `↑/↓` or `j/k` - Navigate through lists
- `Tab` - Switch between panels (Chapters → Verses → Scripture)
- `Enter` - Select chapter/verse
- `t` - Toggle theme picker
- `s` - Search across all verses
- `b` - Add current verse to bookmarks
- `B` - View all bookmarks
- `Ctrl+C` - Exit

### Command Line Mode

Get a random verse:
```bash
geeta --random
geeta -r
```

Get a random verse from a specific chapter:
```bash
geeta -r -c 2
```

Display a specific verse:
```bash
geeta verse 2 47
```

Display a whole chapter:
```bash
geeta chapter 1
```

Search for text:
```bash
geeta search "Krishna"
```

Manage bookmarks:
```bash
geeta bookmark 2 47 "My favorite verse"
geeta bookmarks
```

Change theme:
```bash
geeta theme arjuna
geeta theme bhima
```

Available themes: `yudhisthira`, `bhima`, `arjuna`, `nakula`, `sahadeva`

## 🎨 Themes

Each theme is named after one of the five Pandava brothers and features unique color schemes:

- **Yudhisthira** 👑 - Gold and righteous tones
- **Bhima** 💪 - Bold red and powerful colors
- **Arjuna** 🏹 - Serene blue and focused hues
- **Nakula** 🐎 - Natural green and balanced shades
- **Sahadeva** 🔮 - Mystical purple and wise tones

## 📚 Content

The Bhagavad Gita is presented with:
- **Sanskrit Transliteration** (IAST format)
- **English Translation**
- **Detailed Purports** explaining the philosophical meaning
- All 18 chapters with complete verses

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/tanishenigma/geetCLI.git
cd geetCLI

# Install dependencies
npm install

# Link for local development
npm link

# Run
geeta read
```

## 📄 License

MIT

## 🙏 Acknowledgments

- Bhagavad Gita text and translations
- Built with [Blessed](https://github.com/chjj/blessed) for the beautiful TUI
- [Commander.js](https://github.com/tj/commander.js) for CLI framework
- [Chalk](https://github.com/chalk/chalk) for terminal colors

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/tanishenigma/geetCLI/issues).

---

**Hare Kṛṣṇa** 🙏
# geetaCLI
