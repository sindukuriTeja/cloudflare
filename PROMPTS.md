# AI Prompts Used in Development

This document contains all AI prompts and interactions used to build this Cloudflare AI application, as required by the assignment.

## Initial Project Setup Prompt

**User Request:**
> Build Agents on Cloudflare [documentation provided]
> 
> Optional Assignment: See instructions below for Cloudflare AI app assignment.
> SUBMIT GitHub repo URL for the AI project here. (Please do not submit irrelevant repositories.)
> 
> Requirements:
> - LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
> - Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
> - User input via chat or voice (recommend using Pages or Realtime)
> - Memory or state
> 
> Repository must be prefixed with \`cf_ai_\`, must include a README.md file with project documentation and clear running instructions, and AI prompts used in PROMPTS.md

**AI Response:**
Created a complete Cloudflare AI application with:
1. Project structure with proper naming convention (\`cf_ai_task_assistant\`)
2. TypeScript configuration
3. Durable Objects-based agent with memory
4. Workers AI integration (Llama 3.3)
5. WebSocket-based chat interface
6. Task management tools
7. Comprehensive README.md
8. This PROMPTS.md file

## System Prompt for TaskAgent

The AI agent uses this system prompt to understand its role and capabilities:

\`\`\`
You are a helpful task management assistant. You can help users:
- Create tasks
- List tasks
- Update task status
- Mark tasks as complete

Current tasks in memory: [JSON state]
Conversation count: [number]
\`\`\`

This prompt is dynamically generated in \`agent.ts\` and includes:
- Current state of all tasks
- Conversation history count
- Available actions

## Tool Definitions

### createTask Tool
\`\`\`typescript
{
  description: "Create a new task",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Task title" }
    },
    required: ["title"]
  }
}
\`\`\`

### listTasks Tool
\`\`\`typescript
{
  description: "List all tasks",
  parameters: { type: "object", properties: {} }
}
\`\`\`

### updateTaskStatus Tool
\`\`\`typescript
{
  description: "Update task status",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "Task ID" },
      status: {
        type: "string",
        enum: ["pending", "in-progress", "completed"]
      }
    },
    required: ["id", "status"]
  }
}
\`\`\`

## Example User Interactions

### Creating a Task
**User:** "Create a task to review the quarterly report"

**AI Process:**
1. Receives message via WebSocket
2. Sends to Llama 3.3 with system prompt and tools
3. LLM decides to call \`createTask\` tool
4. Tool executes: generates UUID, creates task object, updates state
5. Returns success message to user

### Listing Tasks
**User:** "List all my tasks"

**AI Process:**
1. LLM calls \`listTasks\` tool
2. Tool retrieves tasks from Durable Object state
3. Returns formatted list to user

### Updating Status
**User:** "Mark the first task as in-progress"

**AI Process:**
1. LLM understands context (first task)
2. Calls \`updateTaskStatus\` with task ID and new status
3. State updates in Durable Object
4. Confirms update to user

## Development Prompts Used

### Prompt 1: Project Structure
"Create a Cloudflare Agents project with TypeScript, Durable Objects, and Workers AI integration"

### Prompt 2: Agent Implementation
"Implement an AIChatAgent that extends the Agents SDK, uses Llama 3.3, and includes task management tools with persistent state"

### Prompt 3: UI Development
"Create a clean, responsive chat interface with WebSocket connection, message display, and real-time status updates"

### Prompt 4: Documentation
"Write comprehensive README.md with architecture diagram, setup instructions, usage examples, and technology explanations"

## AI-Assisted Coding Notes

This project was built with AI assistance following these principles:

1. **Minimal Code**: Only essential functionality, no bloat
2. **Clear Structure**: Separation of concerns (agent logic, UI, routing)
3. **Best Practices**: TypeScript, proper error handling, WebSocket reconnection
4. **Documentation**: Inline comments and comprehensive README
5. **Cloudflare Native**: Uses platform features (Workers AI, Durable Objects, Agents SDK)

## Model Used

- **Primary Model**: Llama 3.3 70B Instruct (via Cloudflare Workers AI)
- **Model ID**: \`@cf/meta/llama-3.3-70b-instruct-fp8-fast\`
- **Provider**: Cloudflare Workers AI (serverless GPU)
- **Streaming**: Yes, via AI SDK
- **Tool Calling**: Yes, native support

## Prompt Engineering Techniques

1. **Context Injection**: Current state included in system prompt
2. **Tool Descriptions**: Clear, concise descriptions for LLM understanding
3. **Structured Output**: JSON schema for tool parameters
4. **Conversation History**: Full message history sent to LLM
5. **State Awareness**: Agent knows its own state and conversation count

## Future Prompt Ideas

To extend this application, consider these prompts:

- "Add task priorities (high/medium/low)"
- "Implement task due dates and reminders"
- "Add task categories/tags"
- "Create task search functionality"
- "Add task notes/descriptions"
- "Implement task dependencies"
- "Add user authentication"
- "Create task analytics dashboard"

## Conclusion

This application demonstrates effective use of AI prompts for:
- Code generation
- Architecture design
- Documentation writing
- User interaction design

All prompts were designed to leverage Cloudflare's platform capabilities while maintaining simplicity and clarity.
