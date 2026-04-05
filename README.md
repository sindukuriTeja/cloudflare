# AI Task Assistant - Cloudflare AI Application

An AI-powered task management assistant built on Cloudflare's platform using Workers AI, Durable Objects, and the Agents SDK.

## Features

This application demonstrates all required components for the Cloudflare AI assignment:

### ✅ LLM Integration
- Uses **Llama 3.3 70B** via Workers AI (Cloudflare's serverless GPU platform)
- **LLaVA 1.5 7B** for image analysis and vision capabilities
- Streaming responses for real-time interaction
- Multi-modal support (text and images)

### ✅ Workflow / Coordination
- Built on **Durable Objects** for stateful coordination
- Real-time WebSocket communication
- Automatic message persistence
- Per-user chat history management

### ✅ User Input (Chat Interface)
- ChatGPT-style modern UI with dark theme
- Real-time WebSocket-based chat
- **Voice input** using Web Speech API
- **Text-to-speech** for AI responses with auto-read option
- **File upload** support (images, PDF, DOC, TXT, CSV, JSON)
- **Drag & drop** and **clipboard paste** for images
- Image preview thumbnails
- Connection status monitoring

### ✅ Memory / State
- Persistent chat history using Durable Objects storage
- **Per-user chat separation** - each user has their own history
- **Google OAuth authentication** (optional) for cross-device sync
- Anonymous mode fallback with localStorage
- Chat history sidebar with conversation management
- Message attachments stored with conversations

### 🆕 Authentication
- **Google Sign-In** integration
- User profile display with picture and name
- Cross-device chat history sync for authenticated users
- Optional anonymous mode for quick access
- Secure OAuth 2.0 flow

## Architecture

\`\`\`
┌─────────────────┐
│   Browser UI    │
│  (WebSocket)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Worker Entry   │
│   (index.ts)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Durable Object │
│   TaskAgent     │
│  (agent.ts)     │
├─────────────────┤
│  • State/Memory │
│  • LLM (Llama)  │
│  • Tools        │
│  • Workflow     │
└─────────────────┘
\`\`\`

## Project Structure

\`\`\`
cf_ai_task_assistant/
├── src/
│   ├── index.ts      # Worker entry point + HTML UI
│   └── agent.ts      # TaskAgent (Durable Object + AI Chat)
├── wrangler.toml     # Cloudflare configuration
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── README.md         # This file
└── PROMPTS.md        # AI prompts used
\`\`\`

## Running Locally

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (free tier works)
- (Optional) Google OAuth credentials for authentication

### Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. (Optional) Configure Google OAuth:
   - See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) for detailed instructions
   - Update `GOOGLE_CLIENT_ID` in `wrangler.toml` and `src/index.ts`
   - App works without this (anonymous mode)

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open your browser to the URL shown (typically http://127.0.0.1:8787)

The app will run locally using Cloudflare's local development environment with Workers AI.

## Deploying to Cloudflare

1. Login to Cloudflare:
\`\`\`bash
npx wrangler login
\`\`\`

2. Deploy:
\`\`\`bash
npm run deploy
\`\`\`

Your app will be live at \`https://cf-ai-task-assistant.<your-subdomain>.workers.dev\`

## Usage Examples

### Chat Interactions
- Type any question or request
- Use voice input by clicking the microphone button
- Upload images for AI to analyze
- Paste screenshots with Ctrl+V
- Drag and drop files into the input area

### Authentication
- Click "Sign in with Google" to authenticate
- Your chat history will sync across devices
- Or use anonymously without signing in

### Voice Features
- Click microphone to speak your message
- Enable "Auto-read responses" for hands-free operation
- Click speaker icon on any message to hear it read aloud

### Example Prompts
- "What's in this image?" (with image upload)
- "Explain quantum computing"
- "Write a creative story"
- "Help me debug this code"

## How It Works

### 1. LLM (Llama 3.3)
The agent uses Cloudflare Workers AI to run Llama 3.3 70B:
\`\`\`typescript
const workersai = createWorkersAI({ binding: this.env.AI });
const result = streamText({
  model: workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
  messages: [...],
  tools: { ... }
});
\`\`\`

### 2. Workflow Coordination
Durable Objects provide stateful coordination:
- Each agent instance is a micro-server
- Handles WebSocket connections
- Manages tool execution flow
- Coordinates between user input and LLM responses

### 3. User Input
WebSocket-based real-time chat:
\`\`\`javascript
ws.send(JSON.stringify({
  type: 'chat',
  content: 'Create a task...'
}));
\`\`\`

### 4. Memory/State
Persistent state in Durable Objects:
\`\`\`typescript
this.setState({
  tasks: [...this.state.tasks, newTask],
  conversationHistory: this.state.conversationHistory + 1
});
\`\`\`

## Tools Available

The AI assistant has access to these tools:

- **createTask**: Create a new task with a title
- **listTasks**: List all tasks in memory
- **updateTaskStatus**: Update task status (pending/in-progress/completed)

## Technologies Used

- **Cloudflare Workers**: Serverless compute platform
- **Workers AI**: Serverless GPU-powered LLM inference
- **Durable Objects**: Stateful coordination and storage
- **Agents SDK**: TypeScript framework for building AI agents
- **Llama 3.3 70B**: Meta's large language model
- **WebSockets**: Real-time bidirectional communication

## Benefits of Cloudflare Platform

- **No infrastructure management**: Deploy and forget
- **Global edge network**: Low latency worldwide
- **Automatic scaling**: Handles millions of concurrent agents
- **Built-in state**: SQL database per agent instance
- **Cost effective**: Free tier includes Workers AI
- **Fast cold starts**: Sub-millisecond activation

## License

MIT

## Author

Built for Cloudflare AI Application Assignment
