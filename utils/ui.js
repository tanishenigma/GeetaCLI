import blessed from "blessed";
import chalk from "chalk";
import { getTheme, config } from "./config.js";

class GeetaUI {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Geeta CLI",
      fullUnicode: true,
      dockBorders: true,
      forceUnicode: true,
      useBCE: true,
    });

    this.theme = getTheme();
    // track last displayed content for redraw (e.g., on theme change)
    this.lastDisplay = null;
    // track which panel is active (books, chapters, verses)
    this.activePanel = null;
    // Auto-scrolling properties
    this.autoScrollTimer = null;
    this.scrollDirection = 1; // 1 for right, -1 for left
    this.initLayout();

    // Handle exit - only Ctrl+C quits the app
    this.screen.key("C-c", () => {
      process.exit(0);
    });
  }

  initLayout() {
    // Define active/inactive box styles
    const activeBoxStyle = {
      border: {
        type: "line",
        fg: this.theme.highlight,
      },
      style: {
        selected: {
          bg: this.theme.highlight,
          fg: this.theme.bg,
        },
        border: {
          fg: this.theme.highlight,
          bold: true,
        },
        label: {
          fg: this.theme.highlight,
          bold: true,
        },
      },
    };

    const inactiveBoxStyle = {
      border: {
        type: "line",
        fg: this.theme.border,
      },
      style: {
        selected: {
          bg: this.theme.highlight,
          fg: this.theme.bg,
        },
        border: {
          fg: this.theme.border,
        },
        label: {
          fg: this.theme.book,
        },
      },
    };

    // Books list (single-source) is not shown in this layout.
    // Leaving commented here so we can re-enable easily if multi-book support returns.
    /*
    this.booksList = blessed.list({
      parent: this.screen,
      label: " [*] Books ",
      top: 0,
      left: 0,
      width: "25%",
      height: "100%-1",
      keys: true,
      vi: true,
      mouse: true,
      ...activeBoxStyle,
    });
    */
    this.booksList = null;

    // Chapters list (left column, top half)
    this.chaptersList = blessed.list({
      parent: this.screen,
      label: " [ ] Chapters ",
      top: 0,
      left: 0,
      width: "30%",
      height: "50%",
      keys: true,
      vi: true,
      mouse: true,
      scrollable: true,
      alwaysScroll: true,
      invertSelected: false,
      scrollbar: {
        ch: " ",
        style: {
          inverse: true,
        },
      },
      ...inactiveBoxStyle,
    });

    // Verses list (left column, bottom half)
    this.versesList = blessed.list({
      parent: this.screen,
      label: " [ ] Verses ",
      top: "50%",
      left: 0,
      width: "30%",
      height: "50%-1",
      keys: true,
      vi: true,
      mouse: true,
      ...inactiveBoxStyle,
    });

    // Define focus handlers to update styles
    const setActivePanel = (panel) => {
      const resetPanel = (target, label, color) => {
        if (!target) return;
        target.style.border.fg = "white";
        target.style.label.fg = "white";
        target.style.label.bold = false;
        target.setLabel(` [ ] ${label} `);
      };

      resetPanel(this.booksList, "Books", this.theme.book);
      resetPanel(this.chaptersList, "Chapters", this.theme.chapter);
      resetPanel(this.versesList, "Verses", this.theme.verse);

      if (panel) {
        panel.style.border.fg = this.theme.highlight;
        panel.style.label.fg = this.theme.highlight;
        panel.style.label.bold = true;

        if (panel === this.booksList) {
          this.booksList.setLabel(" [*] Books ");
        } else if (panel === this.chaptersList) {
          this.chaptersList.setLabel(" [*] Chapters ");
        } else if (panel === this.versesList) {
          this.versesList.setLabel(" [*] Verses ");
        }
      }

      this.activePanel = panel;
      this.screen.render();
    };

    // Add focus event handlers
    if (this.booksList) {
      this.booksList.on("focus", () => setActivePanel(this.booksList));
    }
    this.chaptersList.on("focus", () => {
      setActivePanel(this.chaptersList);
      this.startAutoScroll();
    });
    this.chaptersList.on("blur", () => {
      this.stopAutoScroll();
    });
    this.versesList.on("focus", () => setActivePanel(this.versesList));

    // Setup tab navigation between panels
    if (this.booksList) {
      this.booksList.key("tab", () => this.chaptersList.focus());
      this.booksList.key("S-tab", () => this.contentBox.focus());
    }
    this.chaptersList.key("tab", () => this.versesList.focus());
    this.versesList.key("tab", () => this.contentBox.focus());

    // Add horizontal scroll support for chapters list - automatic scrolling
    this.chapterTextOffset = 0;

    // Reset offset when changing selection
    this.chaptersList.key(["up", "down", "k", "j"], () => {
      this.chapterTextOffset = 0;
      this.scrollDirection = 1; // Reset direction to right
    });

    // Setup shift+tab for reverse navigation
    this.chaptersList.key("S-tab", () => this.contentBox.focus());
    this.versesList.key("S-tab", () => this.chaptersList.focus());

    // Content box (enable tags for style markup) - right column, full height
    this.contentBox = blessed.box({
      parent: this.screen,
      label: " [ ] Scripture ",
      top: 0,
      left: "30%",
      width: "70%",
      height: "100%-1",
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      focusable: true,
      border: { type: "line" },
      style: {
        border: { fg: this.theme.border },
        focus: {
          border: { fg: this.theme.highlight },
        },
      },
      scrollbar: {
        ch: " ",
        track: {
          bg: this.theme.border,
        },
        style: {
          inverse: true,
        },
      },
    });

    // Add contentBox to focus handlers
    this.contentBox.on("focus", () => {
      // Reset all panels to inactive with visible borders
      if (this.booksList) {
        this.booksList.style.border.fg = "white";
        this.booksList.style.label.fg = this.theme.book;
        this.booksList.style.label.bold = false;
        this.booksList.setLabel(" [ ] Books ");
      }

      this.chaptersList.style.border.fg = "white";
      this.chaptersList.style.label.fg = "white";
      this.chaptersList.style.label.bold = false;
      this.chaptersList.setLabel(" [ ] Chapters ");

      this.versesList.style.border.fg = "white";
      this.versesList.style.label.fg = "white";
      this.versesList.style.label.bold = false;
      this.versesList.setLabel(" [ ] Verses ");

      // Set contentBox as active
      this.contentBox.style.border.fg = this.theme.highlight;
      this.contentBox.setLabel(" [*] Scripture ");

      this.activePanel = this.contentBox;
      this.screen.render();
    });

    // Setup tab navigation for contentBox
    this.contentBox.key("tab", () => this.chaptersList.focus());
    this.contentBox.key("S-tab", () => this.versesList.focus());

    // Status bar
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      content:
        "{center}TAB:Switch | r:Random | a:Add Bookmark | b:Bookmarks | s:Search | h:Help | Ctrl+C:Quit{/center}",
      tags: true,
      style: {
        fg: this.theme.fg,
        bg: this.theme.statusBg,
        bold: true,
      },
    });

    // Help box (hidden by default)
    this.helpBox = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "70%",
      height: "60%",
      content: this.getHelpContent(),
      tags: true,
      border: { type: "line" },
      style: {
        border: { fg: this.theme.highlight },
        fg: this.theme.fg,
      },
      hidden: true,
    });

    // Help key binding
    this.screen.key("h", () => {
      this.helpBox.hidden = !this.helpBox.hidden;
      if (!this.helpBox.hidden) {
        this.helpBox.focus();
      }
      this.screen.render();
    });

    // Help box close handlers
    this.helpBox.key(["escape", "q", "h"], () => {
      this.helpBox.hidden = true;
      // Restore focus to active panel or default to books list
      if (this.activePanel) {
        this.activePanel.focus();
      } else {
        this.chaptersList.focus();
      }
      this.screen.render();
    });
  }

  getHelpContent() {
    return `
      {bold}GeetaCLI Keyboard Shortcuts{/bold}

      {bold}Navigation{/bold}
      - Arrow keys: Navigate lists / Scroll scripture
      - Tab: Switch between panels
      - Shift+Tab: Switch panels (reverse)
      - Enter: Select item

      {bold}Actions{/bold}
      - r: Random verse
      - s: Search (select to navigate)
      - b: View bookmarks (select to navigate)
      - a: Add bookmark
      - t: Change theme

      {bold}Other{/bold}
      - h: Toggle help
      - Esc/q: Close menus
      - Ctrl+C: Quit app
    `;
  }

  setBooks(books) {
    // Store metadata for downstream displays even though no books panel is shown
    this.bookData = books;
    if (Array.isArray(books) && books.length > 0) {
      this.bookTitle = books[0].name;
    }
  }

  setChapters(chapters) {
    // Store chapters for later reference
    this.chaptersData = chapters;
    this.originalChapterItems = chapters.map((c) => {
      if (typeof c === "object" && c.title) {
        return ` ${c.number}. ${c.title}`;
      }
      return ` ${c}`;
    });

    this.chaptersList.setItems(this.originalChapterItems);
    this.screen.render();
  }
  setVerses(verses) {
    this.versesList.setItems(verses.map((v) => ` ${v}`));
    this.screen.render();
  }

  displayScripture(book, chapter, verses) {
    // remember last displayed scripture for redraw on theme change
    this.lastDisplay = { type: "scripture", book, chapter, verses };
    const theme = getTheme();
    const bookName = book?.name || this.bookTitle || " Gita";
    const chapterNum = chapter?.chapter || "";
    const chapterTitle = chapter?.title || "";

    // Get content box width for centering
    const boxWidth = this.contentBox.width - 4; // Account for borders and padding

    // Helper function to center text
    const centerText = (text) => {
      const padding = Math.max(0, Math.floor((boxWidth - text.length) / 2));
      return " ".repeat(padding) + text;
    };

    // Build content
    let content = "";

    // Add book name (centered and bold)
    content += `{bold}${centerText(bookName)}{/bold}\n`;

    // Add chapter info (centered and bold)
    if (chapterNum && chapterTitle) {
      const chapterLine = `Chapter ${chapterNum}: ${chapterTitle}`;
      content += `{bold}${centerText(chapterLine)}{/bold}\n\n`;
    } else if (chapterTitle) {
      content += `{bold}${centerText(chapterTitle)}{/bold}\n\n`;
    }

    // Add verses
    verses.forEach((verse) => {
      content += `{bold}Verse ${verse.verse}{/bold}\n${verse.text}\n\n`;

      // Add purport if available
      if (verse.purport) {
        content += `{bold}Purport:{/bold}\n${verse.purport}\n\n`;
      }
    });
    this.contentBox.setContent(content);
    this.contentBox.setScrollPerc(0); // Reset scroll to top
    this.screen.render();
  }

  setStatus(text) {
    this.statusBar.setContent(`{center}${text}{/center}`);
    this.screen.render();
  }

  showSearchPrompt(callback) {
    const searchPrompt = blessed.prompt({
      parent: this.screen,
      border: { type: "line" },
      height: "shrink",
      width: "half",
      top: "center",
      left: "center",
      label: " Search ",
      tags: true,
      keys: true,
      vi: true,
    });

    searchPrompt.input("Enter search term:", "", (err, value) => {
      if (!err && value) {
        callback(value);
      } else {
        // Cancelled or empty - restore focus
        if (this.activePanel) {
          this.activePanel.focus();
        } else {
          this.contentBox.focus();
        }
      }
      this.screen.render();
    });
  }

  showSearchResults(results, query, onSelect) {
    // remember last search results for redraw on theme change
    this.lastDisplay = { type: "search", results, query };
    if (results.length === 0) {
      this.setStatus("No results found");
      return;
    }

    // Create a list for search results
    const searchList = blessed.list({
      parent: this.screen,
      label: ` Search Results: "${query}" (${results.length}) `,
      top: "center",
      left: "center",
      width: "90%",
      height: "80%",
      keys: true,
      vi: true,
      mouse: true,
      border: { type: "line" },
      style: {
        selected: { bg: this.theme.highlight, bold: true },
        border: { fg: this.theme.highlight },
        label: { fg: this.theme.highlight, bold: true },
        item: { fg: this.theme.fg },
      },
      scrollbar: {
        ch: " ",
        style: {
          inverse: true,
        },
      },
    });

    // Format search results for display
    const items = results.map((result) => {
      // Truncate long verses for display
      const text =
        result.text.length > 100
          ? result.text.substring(0, 100) + "..."
          : result.text;
      const chapterLabel = result.chapterTitle
        ? `${result.chapterTitle} (${result.chapter})`
        : `Chapter ${result.chapter}`;
      return `${chapterLabel}:${result.verse} - ${text}`;
    });

    searchList.setItems(items);
    searchList.focus();

    // Handle selection
    searchList.on("select", (item, index) => {
      const result = results[index];
      searchList.destroy();
      this.screen.render();
      if (onSelect) {
        onSelect(result);
      }
    });

    // Handle cancel
    searchList.key(["escape", "q"], () => {
      searchList.destroy();
      // Restore focus to active panel or default to content box
      if (this.activePanel) {
        this.activePanel.focus();
      } else {
        this.contentBox.focus();
      }
      this.screen.render();
    });

    this.screen.render();
  }

  showBookmarks(bookmarks, onSelect, onUpdate) {
    // remember last bookmarks display for redraw on theme change
    this.lastDisplay = { type: "bookmarks", bookmarks };
    if (bookmarks.length === 0) {
      this.setStatus("No bookmarks found");
      return;
    }

    // Create a box container to hold the list and footer
    const container = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: "80%",
      height: "80%",
      border: { type: "line" },
      style: {
        border: { fg: this.theme.highlight },
      },
    });

    // Create a list for bookmarks
    const bookmarksList = blessed.list({
      parent: container,
      label: " Bookmarks ",
      top: 0,
      left: 0,
      width: "100%-2",
      height: "100%-3",
      keys: true,
      vi: true,
      mouse: true,
      style: {
        selected: { bg: this.theme.highlight, bold: true },
        label: { fg: this.theme.highlight, bold: true },
        item: { fg: this.theme.fg },
      },
      scrollbar: {
        ch: " ",
        style: {
          inverse: true,
        },
      },
    });

    // Add footer with instructions
    const footer = blessed.box({
      parent: container,
      bottom: 0,
      left: 0,
      width: "100%-2",
      height: 1,
      content:
        "{center}Enter:Navigate | d:Delete | e:Edit Note | K/J:Move Up/Down | Esc/q:Close{/center}",
      tags: true,
      style: {
        fg: this.theme.verse,
      },
    });

    // Helper function to refresh the list
    const refreshList = () => {
      const items = bookmarks.map((bookmark, index) => {
        const chapterLabel = bookmark.chapterTitle
          ? `${bookmark.chapterTitle} (${bookmark.chapter})`
          : `Chapter ${bookmark.chapter}`;
        let item = `${index + 1}. ${chapterLabel}:${bookmark.verse}`;
        if (bookmark.note) {
          item += ` - ${bookmark.note}`;
        }
        return item;
      });
      const currentIndex = bookmarksList.selected;
      bookmarksList.setItems(items);
      if (currentIndex < items.length) {
        bookmarksList.select(currentIndex);
      }
      this.screen.render();
    };

    // Format bookmarks for display
    refreshList();

    // Handle cancel - set up BEFORE focusing
    bookmarksList.key(["escape", "q"], () => {
      container.destroy();
      // Restore focus to active panel or default to content box
      if (this.activePanel) {
        this.activePanel.focus();
      } else {
        this.contentBox.focus();
      }
      this.screen.render();
    });

    // Handle selection (Enter)
    bookmarksList.on("select", (item, index) => {
      const bookmark = bookmarks[index];
      container.destroy();
      this.screen.render();
      if (onSelect) {
        onSelect(bookmark);
      }
    });

    // Handle delete (d)
    bookmarksList.key("d", () => {
      const index = bookmarksList.selected;
      if (index >= 0 && index < bookmarks.length) {
        bookmarks.splice(index, 1);
        if (onUpdate) {
          onUpdate(bookmarks);
        }
        if (bookmarks.length === 0) {
          container.destroy();
          this.setStatus("All bookmarks deleted");
          // Restore focus when all bookmarks deleted
          if (this.activePanel) {
            this.activePanel.focus();
          } else {
            this.contentBox.focus();
          }
          this.screen.render();
        } else {
          refreshList();
        }
      }
    });

    // Handle edit note (e)
    bookmarksList.key("e", () => {
      const index = bookmarksList.selected;
      if (index >= 0 && index < bookmarks.length) {
        const bookmark = bookmarks[index];
        const notePrompt = blessed.prompt({
          parent: this.screen,
          border: { type: "line" },
          height: "shrink",
          width: "half",
          top: "center",
          left: "center",
          label: " Edit Bookmark Note ",
          tags: true,
          keys: true,
          vi: true,
        });

        notePrompt.input("Edit note:", bookmark.note || "", (err, note) => {
          if (!err) {
            bookmark.note = note || "";
            if (onUpdate) {
              onUpdate(bookmarks);
            }
            refreshList();
          }
          bookmarksList.focus();
          this.screen.render();
        });
      }
    });

    // Handle move up (K - vim style)
    bookmarksList.key(["K"], () => {
      const index = bookmarksList.selected;
      if (index > 0) {
        const [bookmark] = bookmarks.splice(index, 1);
        bookmarks.splice(index - 1, 0, bookmark);
        if (onUpdate) {
          onUpdate(bookmarks);
        }
        refreshList();
        bookmarksList.select(index - 1);
        this.screen.render();
      }
    });

    // Handle move down (J - vim style)
    bookmarksList.key(["J"], () => {
      const index = bookmarksList.selected;
      if (index >= 0 && index < bookmarks.length - 1) {
        const [bookmark] = bookmarks.splice(index, 1);
        bookmarks.splice(index + 1, 0, bookmark);
        if (onUpdate) {
          onUpdate(bookmarks);
        }
        refreshList();
        bookmarksList.select(index + 1);
        this.screen.render();
      }
    });

    // Now focus the list after all handlers are set up
    bookmarksList.focus();
    this.screen.render();
  }

  /**
   * Display a temporary theme picker menu and apply selection
   */
  showThemePicker() {
    const themeKeys = ["yudhisthira", "bhima", "arjuna", "nakula", "sahadeva"];
    const currentTheme = config.get("theme");
    const items = themeKeys.map((key) => {
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      return ` ${name}`;
    });
    const picker = blessed.list({
      parent: this.screen,
      label: " Select Theme ",
      top: "center",
      left: "center",
      width: "30%",
      height: themeKeys.length + 4,
      keys: true,
      vi: true,
      mouse: true,
      items,
      border: { type: "line", fg: this.theme.highlight },
      style: {
        selected: { bg: this.theme.highlight },
        item: { fg: this.theme.fg },
        label: { fg: this.theme.highlight, bold: true },
      },
    });
    const currentIndex = Math.max(0, themeKeys.indexOf(currentTheme));
    picker.select(currentIndex);
    picker.focus();
    this.screen.render();
    picker.on("select", (item, index) => {
      const chosen = themeKeys[index];
      config.set("theme", chosen);
      this.applyTheme();
      picker.destroy();
      // Restore focus to active panel or default to content box
      if (this.activePanel) {
        this.activePanel.focus();
      } else {
        this.contentBox.focus();
      }
      this.screen.render();
    });
    picker.key(["escape", "q"], () => {
      picker.destroy();
      // Restore focus to active panel or default to content box
      if (this.activePanel) {
        this.activePanel.focus();
      } else {
        this.contentBox.focus();
      }
      this.screen.render();
    });
  }

  /**
   * Apply the current theme to all UI components and redraw content
   */
  applyTheme() {
    this.theme = getTheme();
    // Update panel styles
    const panels = [
      { panel: this.chaptersList, name: "Chapters", colorKey: "chapter" },
      { panel: this.versesList, name: "Verses", colorKey: "verse" },
    ];
    panels.forEach(({ panel, name, colorKey }) => {
      const isActive = panel === this.activePanel;
      panel.style.border.fg = isActive ? this.theme.highlight : "white";
      panel.style.label.fg = isActive ? this.theme.highlight : "white";
      panel.style.label.bold = !!isActive;
      panel.setLabel(isActive ? ` [*] ${name} ` : ` [ ] ${name} `);
    });
    // Update scripture box border
    const contentBoxActive = this.contentBox === this.activePanel;
    this.contentBox.style.border.fg = contentBoxActive
      ? this.theme.highlight
      : "white";
    this.contentBox.setLabel(
      contentBoxActive ? " [*] Scripture " : " [ ] Scripture "
    );
    // Update status bar colors
    this.statusBar.style.fg = this.theme.fg;
    this.statusBar.style.bg = this.theme.statusBg;
    this.statusBar.style.bold = true;
    // Update help box
    this.helpBox.style.border.fg = this.theme.highlight;
    this.helpBox.style.fg = this.theme.fg;
    // Redraw last content to apply new text colors
    this.redrawContent();
  }

  /**
   * Redraw current displayed content (scripture, search, or bookmarks)
   */
  redrawContent() {
    if (!this.lastDisplay) return;
    const d = this.lastDisplay;
    switch (d.type) {
      case "scripture":
        this.displayScripture(d.book, d.chapter, d.verses);
        break;
      case "search":
        // Don't redraw search on theme change - they're in a modal
        break;
      case "bookmarks":
        // Don't redraw bookmarks on theme change - they're in a modal
        break;
    }
  }

  render() {
    this.screen.render();
  }

  /**
   * Start automatic scrolling of chapter text
   */
  startAutoScroll() {
    // Clear any existing timer
    this.stopAutoScroll();

    // Start scrolling after a brief delay
    const scroll = () => {
      const selectedIndex = this.chaptersList.selected;
      if (selectedIndex < 0 || !this.originalChapterItems) {
        return;
      }

      const fullText = this.originalChapterItems[selectedIndex];
      const availableWidth = this.chaptersList.width - 4;

      // Only scroll if text is longer than available width
      if (fullText.length <= availableWidth) {
        return;
      }

      // Extract chapter number and title separately
      const match = fullText.match(/^\s*(\d+\.\s+)(.+)$/);
      if (!match) {
        // If pattern doesn't match, fall back to scrolling full text
        const maxOffset = fullText.length - availableWidth;
        this.chapterTextOffset += this.scrollDirection;

        if (this.chapterTextOffset >= maxOffset) {
          this.scrollDirection = -1;
          this.chapterTextOffset = maxOffset;
        } else if (this.chapterTextOffset <= 0) {
          this.scrollDirection = 1;
          this.chapterTextOffset = 0;
        }

        const items = [...this.originalChapterItems];
        items[selectedIndex] = fullText.substring(this.chapterTextOffset);
        this.chaptersList.setItems(items);
        this.chaptersList.select(selectedIndex);
        this.screen.render();
        this.autoScrollTimer = setTimeout(scroll, 150);
        return;
      }

      const chapterPrefix = match[1]; // e.g., " 13. "
      const titleOnly = match[2]; // e.g., "Nature, the Enjoyer and Consciousness"
      const prefixLength = chapterPrefix.length;
      const titleWidth = availableWidth - prefixLength;

      // If title fits within available space, no need to scroll
      if (titleOnly.length <= titleWidth) {
        return;
      }

      const maxOffset = titleOnly.length - titleWidth;

      // Update offset based on direction
      this.chapterTextOffset += this.scrollDirection;

      // Reverse direction at boundaries with pause
      if (this.chapterTextOffset >= maxOffset) {
        this.scrollDirection = -1;
        this.chapterTextOffset = maxOffset;
        // Pause at end for 2 seconds before reversing
        this.autoScrollTimer = setTimeout(() => {
          this.autoScrollTimer = setTimeout(scroll, 150);
        }, 2000);
        return;
      } else if (this.chapterTextOffset <= 0) {
        this.scrollDirection = 1;
        this.chapterTextOffset = 0;
        // Pause at start for 2 seconds before continuing
        this.autoScrollTimer = setTimeout(() => {
          this.autoScrollTimer = setTimeout(scroll, 150);
        }, 2000);
        return;
      }

      // Update display - keep number fixed, scroll only title
      const visibleTitle = titleOnly.substring(
        this.chapterTextOffset,
        this.chapterTextOffset + titleWidth
      );
      const items = [...this.originalChapterItems];
      items[selectedIndex] = chapterPrefix + visibleTitle;
      this.chaptersList.setItems(items);
      this.chaptersList.select(selectedIndex);
      this.screen.render();

      // Schedule next scroll
      this.autoScrollTimer = setTimeout(scroll, 150);
    };

    // Start scrolling after initial delay
    this.autoScrollTimer = setTimeout(scroll, 1000);
  }

  /**
   * Stop automatic scrolling
   */
  stopAutoScroll() {
    if (this.autoScrollTimer) {
      clearTimeout(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }
}

export default GeetaUI;
