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

    // Chat history will be sent after receiving userId from client

    // Handle incoming messages
    server.addEventListener("message", async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === "chat") {
          await this.handleChat(data.content, data.chatId, server, data.attachments, data.userId);
        } else if (data.type === "newChat") {
          const chatId = Date.now().toString();
          server.send(JSON.stringify({
            type: "newChatCreated",
            chatId: chatId
          }));
        } else if (data.type === "loadChat") {
          await this.loadChat(data.chatId, server, data.userId);
        } else if (data.type === "init") {
          // Send user-specific chat history
          await this.sendUserHistory(data.userId, server);
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

  async handleChat(message: string, chatId: string, ws: WebSocket, attachments?: any[], userId?: string) {
    try {
      // Get or create chat with userId prefix
      const chats = (await this.state.storage.get("chats")) as any[] || [];
      const userChatId = userId ? `${userId}_${chatId}` : chatId;
      let chat = chats.find((c: any) => c.id === userChatId);
      
      if (!chat) {
        chat = {
          id: userChatId,
          userId: userId,
          title: message.substring(0, 50) || 'File upload',
          messages: [],
          createdAt: new Date().toISOString()
        };
        chats.unshift(chat);
      }

      // Add user message with attachments
      const userMessage: any = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      };
      
      if (attachments && attachments.length > 0) {
        userMessage.attachments = attachments;
      }
      
      chat.messages.push(userMessage);

      let aiMessage = "";
      
      // Check if there are images to analyze
      const images = attachments?.filter((a: any) => a.type === 'image') || [];
      
      if (images.length > 0) {
        // Use vision model for image analysis
        try {
          for (const image of images) {
            // Extract base64 data from data URL
            const base64Data = image.data.split(',')[1];
            
            const visionResponse = await this.env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
              image: Array.from(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))),
              prompt: message || "What do you see in this image? Describe it in detail.",
              max_tokens: 512
            });
            
            aiMessage += visionResponse.description || "I can see an image, but I'm having trouble analyzing it.";
            aiMessage += "\n\n";
          }
          
          // If there are multiple images or additional text, add context
          if (images.length > 1) {
            aiMessage = `I analyzed ${images.length} images:\n\n` + aiMessage;
          }
          
        } catch (visionError) {
          console.error("Vision error:", visionError);
          aiMessage = "I can see you've shared an image, but I'm having trouble analyzing it right now. ";
        }
      }
      
      // If no images or need additional text response, use text model
      if (images.length === 0 || message) {
        // Build conversation history for AI
        let contextMessage = message;
        
        // Add context about non-image attachments
        const files = attachments?.filter((a: any) => a.type !== 'image') || [];
        if (files.length > 0) {
          const fileNames = files.map((a: any) => a.name).join(', ');
          contextMessage += `\n[User attached file(s): ${fileNames}]`;
        }

        const aiMessages = [
          {
            role: "system",
            content: "You are a helpful AI assistant. Be friendly and conversational. When users share files, acknowledge them and offer to help."
          },
          ...chat.messages.slice(0, -1).map((m: any) => ({
            role: m.role,
            content: m.content
          })),
          {
            role: "user",
            content: contextMessage
          }
        ];

        // Call Workers AI for text using Llama 3.3 70B
        const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: aiMessages
        });

        const textResponse = response.response || "I am here to help!";
        
        // Combine vision and text responses
        if (images.length > 0 && message) {
          aiMessage += "\n" + textResponse;
        } else if (images.length === 0) {
          aiMessage = textResponse;
        }
      }
      
      // Add AI response to chat
      chat.messages.push({
        role: "assistant",
        content: aiMessage,
        timestamp: new Date().toISOString()
      });

      // Update chat title if it's the first exchange
      if (chat.messages.length === 2) {
        chat.title = message.substring(0, 50) || 'Image analysis';
      }

      // Save to storage
      await this.state.storage.put("chats", chats);

      // Send response
      ws.send(JSON.stringify({
        type: "message",
        content: aiMessage,
        chatId: chatId
      }));

      // Send updated user-specific history
      const userChats = chats.filter((c: any) => c.userId === userId);
      ws.send(JSON.stringify({
        type: "history",
        chats: userChats.map((c: any) => ({
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

  async loadChat(chatId: string, ws: WebSocket, userId?: string) {
    try {
      const chats = (await this.state.storage.get("chats")) as any[] || [];
      const chat = chats.find((c: any) => c.id === chatId && (!userId || c.userId === userId));
      
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

  async sendUserHistory(userId: string, ws: WebSocket) {
    try {
      const chats = (await this.state.storage.get("chats")) as any[] || [];
      const userChats = chats.filter((c: any) => c.userId === userId);
      
      ws.send(JSON.stringify({
        type: "history",
        chats: userChats.map((c: any) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt
        }))
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: "error",
        content: "History Error: " + (error as Error).message
      }));
    }
  }
}
