// TaskAgent - Durable Object with AI capabilities
export class TaskAgent {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("Expected WebSocket", { status: 400 });
  }

  async handleSession(websocket: WebSocket) {
    websocket.accept();
    this.sessions.add(websocket);

    // Send connection confirmation first
    websocket.send(JSON.stringify({
      type: "connected",
      message: "WebSocket connection established"
    }));

    // Send initial state
    const tasks = (await this.state.storage.get("tasks")) || [];
    const conversationCount = (await this.state.storage.get("conversationCount")) || 0;
    
    websocket.send(JSON.stringify({
      type: "stateUpdate",
      state: { tasks, conversationCount }
    }));

    websocket.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        
        if (data.type === "chat") {
          await this.handleChatMessage(data.content, websocket);
        }
      } catch (error) {
        websocket.send(JSON.stringify({
          type: "error",
          content: "Failed to process message"
        }));
      }
    });

    websocket.addEventListener("close", () => {
      this.sessions.delete(websocket);
    });
  }

  async handleChatMessage(userMessage: string, websocket: WebSocket) {
    // Increment conversation count
    const conversationCount = ((await this.state.storage.get("conversationCount")) || 0) + 1;
    await this.state.storage.put("conversationCount", conversationCount);

    // Get current tasks
    const tasks = (await this.state.storage.get("tasks")) || [];

    // Build system prompt with context
    const systemPrompt = `You are a helpful task management assistant. You can help users create, list, and update tasks.

Current tasks: ${JSON.stringify(tasks)}
Conversation count: ${conversationCount}

Available commands:
- To create a task, respond with: CREATE_TASK: [task title]
- To list tasks, respond with: LIST_TASKS
- To update task status, respond with: UPDATE_TASK: [task_id] [status]

Always be helpful and conversational. When you use a command, also provide a natural language response.`;

    // Call Workers AI
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    try {
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages,
        stream: true
      });

      let fullResponse = "";
      
      // Stream the response
      for await (const chunk of response as any) {
        if (chunk.response) {
          fullResponse += chunk.response;
          websocket.send(JSON.stringify({
            type: "message_chunk",
            content: chunk.response
          }));
        }
      }

      // Process commands in the response
      await this.processCommands(fullResponse, websocket);

      // Send complete message
      websocket.send(JSON.stringify({
        type: "message_complete",
        content: fullResponse
      }));

    } catch (error) {
      websocket.send(JSON.stringify({
        type: "error",
        content: "Failed to get AI response: " + (error as Error).message
      }));
    }
  }

  async processCommands(response: string, websocket: WebSocket) {
    const tasks = (await this.state.storage.get("tasks")) || [];

    // Check for CREATE_TASK command
    const createMatch = response.match(/CREATE_TASK:\s*(.+?)(?:\n|$)/i);
    if (createMatch) {
      const title = createMatch[1].trim();
      const newTask = {
        id: crypto.randomUUID(),
        title,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      tasks.push(newTask);
      await this.state.storage.put("tasks", tasks);
      
      this.broadcast({
        type: "stateUpdate",
        state: { tasks }
      });
    }

    // Check for UPDATE_TASK command
    const updateMatch = response.match(/UPDATE_TASK:\s*(\S+)\s+(\S+)/i);
    if (updateMatch) {
      const [, taskId, status] = updateMatch;
      const updatedTasks = tasks.map((t: any) =>
        t.id === taskId ? { ...t, status } : t
      );
      await this.state.storage.put("tasks", updatedTasks);
      
      this.broadcast({
        type: "stateUpdate",
        state: { tasks: updatedTasks }
      });
    }
  }

  broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    for (const session of this.sessions) {
      try {
        session.send(messageStr);
      } catch (error) {
        this.sessions.delete(session);
      }
    }
  }
}

interface Env {
  AI: any;
  TASK_AGENT: DurableObjectNamespace;
}
