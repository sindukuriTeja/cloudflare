# AI Task Assistant - Cloudflare AI Application

An AI-powered task management assistant built on Cloudflare's platform using Workers AI, Durable Objects, and the Agents SDK.

## Features

This application demonstrates all required components for the Cloudflare AI assignment:

### ✅ LLM Integration
- Uses **Llama 3.3 70B** via Workers AI (Cloudflare's serverless GPU platform)
- Streaming responses for real-time interaction
- Tool calling capabilities for task management

### ✅ Workflow / Coordination
- Built on **Durable Objects** for stateful coordination
- Agents SDK for structured agent behavior
- Automatic message persistence and stream resumption
- Tool execution with state updates

### ✅ User Input (Chat Interface)
- Real-time WebSocket-based chat interface
- Clean, responsive UI with gradient design
- Message history with user/assistant distinction
- Connection status monitoring

### ✅ Memory / State
- Persistent state using Durable Objects SQL database
- Task list stored in agent state
- Conversation history counter
- State syncs to connected clients in real-time
- Survives restarts, deploys, and hibernation

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

### Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open your browser to the URL shown (typically http://localhost:8787)

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

Try these prompts in the chat interface:

- "Create a task to review the quarterly report"
- "List all my tasks"
- "Mark the first task as in-progress"
- "Create three tasks: buy groceries, call mom, finish homework"
- "Show me completed tasks"
- "Update task status to completed"

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
