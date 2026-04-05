// Simple TaskAgent with AI integration and chat history
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

    // Send welcome message
    server.send(JSON.stringify({
      type: "ready",
      message: "WebSocket ready!"
    }));

    // Send chat history
    const chats = (await this.state.storage.get("chats")) as any[] || [];
    server.send(JSON.stringify({
      type: "history",
      chats: chats
    }));

    // Handle incoming messages
    server.addEventListener("message", async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === "chat") {
          await this.handleChat(data.content, data.chatId, server);
        } else if (data.type === "newChat") {
          const chatId = Date.now().toString();
          server.send(JSON.stringify({
            type: "newChatCreated",
            chatId: chatId
          }));
        } else if (data.type === "loadChat") {
          await this.loadChat(data.chatId, server);
        }
      } catch (error) {
        server.send(JSON.stringify({
          type: "error",
          content: "Error: " + (error as Error).message
        }));
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleChat(message: string, chatId: string, ws: WebSocket) {
    try {
      // Get or create chat
      const chats = (await this.state.storage.get("chats")) as any[] || [];
      let chat = chats.find((c: any) => c.id === chatId);
      
      if (!chat) {
        chat = {
          id: chatId,
          title: message.substring(0, 50),
          messages: [],
          createdAt: new Date().toISOString()
        };
        chats.unshift(chat);
      }

      // Add user message
      chat.messages.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      });

      // Build conversation history for AI
      const aiMessages = [
        {
          role: "system",
          content: "You are a helpful AI assistant. Be friendly and conversational."
        },
        ...chat.messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ];

      // Call Workers AI
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: aiMessages
      });

      const aiMessage = response.response || "I am here to help!";
      
      // Add AI response to chat
      chat.messages.push({
        role: "assistant",
        content: aiMessage,
        timestamp: new Date().toISOString()
      });

      // Update chat title if it's the first exchange
      if (chat.messages.length === 2) {
        chat.title = message.substring(0, 50);
      }

      // Save to storage
      await this.state.storage.put("chats", chats);

      // Send response
      ws.send(JSON.stringify({
        type: "message",
        content: aiMessage,
        chatId: chatId
      }));

      // Send updated history
      ws.send(JSON.stringify({
        type: "history",
        chats: chats.map((c: any) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt
        }))
      }));

    } catch (error) {
      ws.send(JSON.stringify({
        type: "error",
        content: "AI Error: " + (error as Error).message
      }));
    }
  }

  async loadChat(chatId: string, ws: WebSocket) {
    try {
      const chats = (await this.state.storage.get("chats")) as any[] || [];
      const chat = chats.find((c: any) => c.id === chatId);
      
      if (chat) {
        ws.send(JSON.stringify({
          type: "chatLoaded",
          chat: chat
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: "error",
        content: "Load Error: " + (error as Error).message
      }));
    }
  }
}
