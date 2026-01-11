# VibeDiff

A clean, frontend-only diff and merge tool for developers working with AI-generated code. Perfect for comparing code from ChatGPT, Claude, or any LLM output with your original files.

## What is VibeDiff?

Ever blindly pasted AI-generated code only to find it broke something? VibeDiff helps you:
- Compare original vs modified code side-by-side
- Visually merge changes with a VS Code-like interface
- Save diffs locally (no backend, no accounts)
- Resolve conflicts before pasting

**All in the browser. All free. No nonsense.**

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/TDJR007/vibediff.git
cd vibediff

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Tech Stack

- **Vue 3** + **TypeScript** - Modern frontend framework
- **PrimeVue** + **Aura Theme** - UI components with clean design
- **Pinia** - State management
- **diff** - JavaScript diff library
- **Vite** - Fast build tool

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── diffs/          # Diffs library components
│   ├── diff-viewer/    # Diff visualization components
│   └── merge/          # Merge view components
├── composables/        # Vue composables (custom hooks)
├── layouts/           # Page layouts
├── pages/             # Route pages
├── router/            # Vue Router configuration
├── stores/            # Pinia stores
└── main.ts           # App entry point
```

## ✨ Key Features

1. **Side-by-Side Diff Viewer**
   - Clean visual comparison
   - Syntax highlighting
   - Interactive hunk selection

2. **Intelligent Merge Interface**
   - Accept left/right changes
   - Accept both changes (in order)
   - Real-time conflict detection

3. **Local Storage**
   - Save diffs to browser
   - Search and filter saved diffs
   - Export merged results

4. **Dark/Light Theme**
   - System-aware theme switching
   - Persistent theme preference

## 🧑‍💻 Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

## 📖 Usage

1. **Home** - Paste original and modified code, generate diff
2. **Merge View** - Review changes and select what to keep
3. **My Diffs** - Browse saved diffs, reload, or export
4. **About** - Learn best practices for working with AI code

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License
---