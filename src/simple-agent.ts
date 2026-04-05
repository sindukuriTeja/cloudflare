// Simple TaskAgent without complex dependencies
export class TaskAgent {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // Send welcome message immediately
    server.send(JSON.stringify({
      type: "connected",
      message: "Connected to AI Task Assistant"
    }));

    // Handle incoming messages
    server.addEventListener("message", async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === "chat") {
          await this.handleChat(data.content, server);
        }
      } catch (error) {
        server.send(JSON.stringify({
          type: "error",
          content: "Error: " + (error as Error).message
        }));
      }
    });

    server.addEventListener("close", () => {
      console.log("WebSocket closed");
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleChat(message: string, ws: WebSocket) {
    try {
      // Get tasks from storage
      const tasks = (await this.state.storage.get("tasks")) as any[] || [];

      // Simple AI call
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: `You are a helpful task assistant. Current tasks: ${JSON.stringify(tasks)}. 
            When user wants to create a task, say "CREATE_TASK: [title]" in your response.
            When user wants to list tasks, describe the tasks.`
          },
          { role: "user", content: message }
        ]
      });

      // Send response
      const aiMessage = response.response || "I'm here to help!";
      
      ws.send(JSON.stringify({
        type: "message",
        content: aiMessage
      }));

      // Check for task creation
      const createMatch = aiMessage.match(/CREATE_TASK:\s*(.+?)(?:\n|$)/i);
      if (createMatch) {
        const title = createMatch[1].trim();
        const newTask = {
          id: Date.now().toString(),
          title,
          status: "pending",
          created: new Date().toISOString()
        };
        tasks.push(newTask);
        await this.state.storage.put("tasks", tasks);
        
        ws.send(JSON.stringify({
          type: "task_created",
          task: newTask
        }));
      }

    } catch (error) {
      ws.send(JSON.stringify({
        type: "error",
        content: "AI Error: " + (error as Error).message
      }));
    }
  }
}
