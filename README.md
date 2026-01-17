# 🚀 Platform UI - AI-Powered GitHub PR & Change Intelligence Assistant

An intelligent chat interface for analyzing GitHub Pull Requests and Commits with AI-powered insights. Get instant code reviews, change summaries, and actionable feedback through a modern conversational UI.

![Platform UI Screenshot](./docs/screenshot.png)

## ✨ Features

- **🔍 PR Analysis** - Paste any GitHub PR URL to get detailed analysis including:
  - Change summary and impact assessment
  - Files modified with additions/deletions breakdown
  - Commit history review
  - Code quality insights

- **📝 Commit Analysis** - Analyze individual commits for:
  - Change breakdown and statistics
  - Author and timestamp information
  - File-level diff analysis

- **💬 Conversational Interface** - Natural chat experience with:
  - Real-time streaming responses
  - Auto-generated chat titles
  - Persistent chat history
  - Markdown rendering with syntax highlighting

- **🎨 Modern UI** - Clean, responsive design with:
  - GitHub-style metadata cards
  - Smooth animations and transitions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons

### Backend
- **FastAPI** (Python)
- **Server-Sent Events (SSE)** for real-time streaming
- **GitHub API** integration

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Python 3.9+ (for backend)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/altanyesilkurt/platform-ui.git
cd platform-ui

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Usage

### Analyzing a Pull Request

Simply paste a GitHub PR URL into the chat:

```
review https://github.com/owner/repo/pull/123
```

The assistant will fetch PR metadata and provide:
- Summary of changes
- Key modifications
- Code snippets with syntax highlighting
- Potential issues or suggestions

### Analyzing a Commit

Paste a GitHub commit URL:

```
analyze https://github.com/owner/repo/commit/abc123
```

## 📁 Project Structure

```
platform-ui/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatArea.tsx        # Main chat container
│   │   │   ├── ChatInput.tsx       # Message input component
│   │   │   ├── ChatLayout.tsx      # Layout with sidebar
│   │   │   ├── ChatMessage.tsx     # Message bubble component
│   │   │   ├── ChatSidebar.tsx     # Chat history sidebar
│   │   │   ├── PRMetadataCard.tsx  # PR info display
│   │   │   ├── CommitMetadataCard.tsx
│   │   │   └── MarkdownRenderer.tsx
│   │   └── ui/                     # shadcn/ui components
│   ├── hooks/
│   │   └── useChat.ts              # Chat state management
│   ├── lib/
│   │   └── api.ts                  # API client & types
│   ├── types/
│   │   └── chat.ts                 # TypeScript interfaces
│   └── App.tsx
├── public/
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats` | List all chats |
| `POST` | `/chats` | Create new chat |
| `PUT` | `/chats/{id}` | Update chat title |
| `DELETE` | `/chats/{id}` | Delete a chat |
| `GET` | `/chats/{id}/messages` | Get chat messages |
| `POST` | `/chat/stream` | Send message (SSE streaming) |
| `POST` | `/analyze-commit` | Direct commit analysis |
| `POST` | `/pr/review` | Submit PR review |
| `GET` | `/health` | Health check |

## 🎯 Roadmap

- [ ] Multi-repository support
- [ ] Code suggestion generation
- [ ] Integration with CI/CD pipelines
- [ ] Team collaboration features
- [ ] Custom review templates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👤 Author

**Altan Yesilkurt**

- GitHub: [@altanyesilkurt](https://github.com/altanyesilkurt)
