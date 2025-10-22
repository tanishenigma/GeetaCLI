# Geeta CLI - Usage Guide

## ✅ Global Installation Complete!

The `geeta` command is now available globally in your terminal.

## 📖 Basic Commands

### Random Verse
```bash
geeta -r                    # Get a random verse
geeta -r -c 5              # Get a random verse from chapter 5
```

### Interactive Reader (TUI)
```bash
geeta read                 # Start the interactive terminal UI
```

**Navigation in Interactive Mode:**
- `Tab` / `Shift+Tab` - Switch between panels
- `Arrow Keys` - Navigate lists / Scroll scripture
- `Enter` - Select chapter/verse
- `h` - Help menu
- `s` - Search
- `b` - View bookmarks
- `a` - Add bookmark
- `t` - Change theme (Yudhisthira, Bhima, Arjuna, Nakula, Sahadeva)
- `r` - Random verse
- `Ctrl+C` - Quit

### Specific Verses
```bash
geeta verse 2 47           # Chapter 2, Verse 47
geeta chapter 1            # Read entire Chapter 1
```

### Search
```bash
geeta search "karma"       # Search for a term
geeta search "Krishna"
```

### Bookmarks
```bash
geeta bookmark 2 47 "favorite verse"    # Add bookmark with note
geeta bookmarks                         # List all bookmarks
```

### Theme Management
```bash
geeta theme                    # Show current theme and available options
geeta theme arjuna            # Change to Arjuna theme (blue)
geeta theme bhima             # Change to Bhima theme (red)
geeta theme yudhisthira       # Change to Yudhisthira theme (golden)
geeta theme nakula            # Change to Nakula theme (green)
geeta theme sahadeva          # Change to Sahadeva theme (purple)
```

### Demo
```bash
geeta demo                 # Run a simple demo
```

## 🎨 Available Themes

The interactive reader includes 5 Pandava-themed color schemes:
- **Yudhisthira** - Golden/wisdom theme
- **Bhima** - Red/strength theme
- **Arjuna** - Blue/focus theme (default)
- **Nakula** - Green/nature theme
- **Sahadeva** - Purple/mystical theme

Press `t` in interactive mode to switch themes.

## 🔄 Uninstalling

If you need to uninstall:
```bash
sudo npm unlink -g geeta
```

## 📝 Configuration

Settings and bookmarks are stored in: `~/.geeta-cli-config.json`

---

🙏 **Hare Krsna** 🙏
