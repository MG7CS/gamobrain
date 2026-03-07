# GAMO BRAIN

Your digital twin. An AI that learns to think, speak, and behave exactly like you.

## Features

- **Neural Network Background** — Animated canvas with 80+ nodes and connections. Nodes are attracted to your cursor with a sticky effect.
- **Conversational Training** — Train GAMO through natural conversation, not forms. GAMO asks questions and learns from your answers.
- **Meet GAMO** — Chat with your digital twin powered by Claude Sonnet 4. GAMO responds as you would, using everything you've taught it.
- **Profile Visualization** — Beautiful circular progress indicator and narrative summary showing what GAMO knows about you.
- **Persistent Storage** — All training data saved locally in your browser. Your data never leaves your machine except for Claude API calls.

## Tech Stack

- React 19 + Vite
- Framer Motion for animations
- HTML5 Canvas for neural network background
- Claude API (claude-sonnet-4-20250514)
- localStorage for data persistence

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Add your Claude API key:**
   - Go to Profile section
   - Click "Add API Key"
   - Enter your Anthropic API key (starts with `sk-ant-`)

4. **Train GAMO:**
   - Go to Train section
   - Answer GAMO's questions naturally
   - The more you share, the better GAMO becomes

5. **Meet your twin:**
   - Go to Meet GAMO section
   - Have a conversation with your digital twin

## Project Structure

```
src/
├── App.jsx                      — Main app, routing, state management
├── main.jsx                     — Entry point
├── index.css                    — Global styles
├── components/
│   ├── NeuralBackground.jsx     — Animated neural network canvas
│   ├── FloatingMenu.jsx         — Draggable navigation menu
│   ├── ChatBar.jsx              — Persistent bottom chat input
│   └── sections/
│       ├── Home.jsx             — Landing page
│       ├── Train.jsx            — Conversational training interface
│       ├── Chat.jsx             — Meet GAMO conversation
│       └── Profile.jsx          — Profile visualization
└── utils/
    ├── storage.js               — localStorage helpers, training questions
    └── claudeAPI.js             — Claude API integration
```

## Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Notes

- API key is stored in localStorage and only sent to Anthropic's API
- All training data is stored locally in your browser
- No backend required — fully client-side
- Works offline (except for Claude API calls)
