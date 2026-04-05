# AI Task Assistant - Cloudflare AI Application

A production-ready, full-stack AI chat application built on Cloudflare's serverless platform, featuring real-time communication, multi-modal AI capabilities, and persistent state management.

## 🌟 Overview

This application demonstrates a complete implementation of a modern AI assistant using Cloudflare's cutting-edge infrastructure. It combines Workers AI for LLM inference, Durable Objects for stateful coordination, and WebSockets for real-time bidirectional communication.

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │  WebSocket   │  │  Local       │         │
│  │   UI/UX      │◄─┤  Connection  │◄─┤  Storage     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Cloudflare Worker                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Router   │  │   Static   │  │  WebSocket │         │  │
│  │  │   Handler  │  │   Assets   │  │   Handler  │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Durable Objects Layer                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    TaskAgent Instance                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   State    │  │  Message   │  │   Chat     │         │  │
│  │  │  Manager   │  │  Handler   │  │  History   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────────────────────────────────────┐         │  │
│  │  │        Persistent Storage (SQL)             │         │  │
│  │  └────────────────────────────────────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Workers AI Platform                         │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Llama 3.3 70B   │         │  LLaVA 1.5 7B    │            │
│  │  (Text Model)    │         │  (Vision Model)  │            │
│  └──────────────────┘         └──────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Frontend Layer
- **Technology**: Vanilla JavaScript (no framework dependencies)
- **Communication**: WebSocket for real-time bidirectional messaging
- **State Management**: localStorage for user preferences and session data
- **UI Framework**: Custom CSS with CSS variables for theming

#### 2. Worker Layer (Entry Point)
- **File**: `src/index.ts`
- **Responsibilities**:
  - HTTP request routing
  - Static HTML serving
  - WebSocket upgrade handling
  - Durable Object stub creation

#### 3. Durable Objects Layer
- **File**: `src/test-simple.ts`
- **Class**: `TaskAgent`
- **Responsibilities**:
  - WebSocket connection management
  - Message processing and routing
  - Chat history persistence
  - AI model orchestration
  - State synchronization

#### 4. AI Layer
- **Text Model**: Llama 3.3 70B Instruct (FP8 Fast)
  - Context window: 128K tokens
  - Use case: Conversational AI, text generation
- **Vision Model**: LLaVA 1.5 7B HF
  - Use case: Image analysis and description
  - Input: Base64 encoded images

## 🎯 Features

### Core Features

#### 1. Multi-Modal AI Capabilities
- **Text Conversations**: Powered by Llama 3.3 70B
- **Image Analysis**: LLaVA vision model for image understanding
- **Context Awareness**: Maintains conversation history
- **Streaming Responses**: Real-time token streaming (future enhancement)

#### 2. Real-Time Communication
- **WebSocket Protocol**: Persistent bidirectional connection
- **Auto-Reconnection**: Automatic reconnection on disconnect
- **Connection Status**: Visual feedback for connection state
- **Low Latency**: Edge-based processing for minimal delay

#### 3. User Interface
- **Theme System**: Light and dark mode with smooth transitions
- **Responsive Design**: Mobile-first, adaptive layout
- **ChatGPT-Style UI**: Familiar, intuitive interface
- **Accessibility**: Keyboard navigation and screen reader support

#### 4. Voice Capabilities
- **Speech-to-Text**: Web Speech API integration
- **Text-to-Speech**: Browser-native voice synthesis
- **Auto-Read Mode**: Automatic reading of AI responses
- **Voice Controls**: Visual feedback for recording state

#### 5. File Management
- **Multi-File Upload**: Support for images, PDFs, documents
- **Drag & Drop**: Intuitive file attachment
- **Clipboard Paste**: Direct image paste from clipboard
- **File Preview**: Thumbnail previews for images
- **Size Validation**: 10MB limit per file

#### 6. Chat Management
- **Per-User History**: Isolated chat history per user
- **Persistent Storage**: Durable Objects SQL storage
- **Chat Organization**: Sidebar with chat list
- **New Chat**: Quick chat creation
- **Message Persistence**: Survives page refreshes

### Advanced Features

#### 1. State Management
- **User Identification**: Unique user ID generation
- **Session Persistence**: localStorage-based sessions
- **Theme Persistence**: Saved theme preferences
- **Chat State**: Durable Objects state management

#### 2. Performance Optimizations
- **Edge Computing**: Global edge network deployment
- **Lazy Loading**: On-demand resource loading
- **Efficient Rendering**: Minimal DOM manipulation
- **Connection Pooling**: WebSocket connection reuse

## 📋 Prerequisites

### Required
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Cloudflare Account**: Free tier available
- **Git**: For version control

### Optional
- **Wrangler CLI**: Cloudflare's development tool (installed via npm)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/sindukuriTeja/cloudflare.git
cd cloudflare/cf_ai_task_assistant
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `wrangler`: Cloudflare Workers CLI
- `@cloudflare/workers-types`: TypeScript definitions
- Development dependencies

### Step 3: Configure Cloudflare Account

#### 3.1 Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser window for authentication.

#### 3.2 Verify Configuration

Check `wrangler.toml`:

```toml
name = "cf-ai-task-assistant"
main = "src/index.ts"
compatibility_date = "2024-11-27"

# Workers AI binding
[ai]
binding = "AI"

# Durable Objects configuration
[[durable_objects.bindings]]
name = "TASK_AGENT"
class_name = "TaskAgent"

# Migrations for Durable Objects
[[migrations]]
tag = "v1"
new_classes = ["TaskAgent"]
```

### Step 4: Local Development

```bash
npm run dev
```

This starts the local development server with:
- Hot reload enabled
- Local Durable Objects simulation
- Workers AI connection (requires internet)

**Access the application**: http://127.0.0.1:8787

### Step 5: Production Deployment

#### 5.1 Verify Email (First Time Only)

Cloudflare requires email verification before deploying Workers.

1. Go to https://dash.cloudflare.com/
2. Verify your email address
3. Wait for confirmation

#### 5.2 Deploy to Production

```bash
npm run deploy
```

This:
- Bundles the application
- Uploads to Cloudflare
- Provisions Durable Objects
- Configures Workers AI binding

**Production URL**: `https://cf-ai-task-assistant.<your-subdomain>.workers.dev`

## 🔧 Configuration

### Environment Variables

No environment variables required for basic setup. All configuration is in `wrangler.toml`.

### Custom Domain (Optional)

1. Add a custom domain in Cloudflare Dashboard
2. Update `wrangler.toml`:

```toml
routes = [
  { pattern = "chat.yourdomain.com", custom_domain = true }
]
```

3. Redeploy:

```bash
npm run deploy
```

### Workers AI Models

Current models (configured in code):
- Text: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Vision: `@cf/llava-hf/llava-1.5-7b-hf`

To change models, edit `src/test-simple.ts`:

```typescript
// Text model
const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
  messages: aiMessages
});

// Vision model
const visionResponse = await this.env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
  image: imageData,
  prompt: message
});
```

## 📁 Project Structure

```
cf_ai_task_assistant/
├── src/
│   ├── index.ts              # Worker entry point + HTML UI
│   ├── test-simple.ts        # TaskAgent Durable Object
│   └── agent.ts              # (Legacy) Original agent implementation
├── .wrangler/                # Local development cache
│   ├── state/                # Durable Objects local state
│   └── tmp/                  # Temporary build files
├── node_modules/             # Dependencies
├── wrangler.toml             # Cloudflare configuration
├── package.json              # Project metadata
├── tsconfig.json             # TypeScript configuration
├── README.md                 # This file
├── PROMPTS.md                # AI prompts documentation
└── USER_HISTORY_GUIDE.md     # User history feature guide
```

### Key Files Explained

#### `src/index.ts`
- **Purpose**: Main entry point for the Worker
- **Exports**: Default fetch handler, TaskAgent class
- **Contains**: 
  - HTTP routing logic
  - HTML/CSS/JavaScript for UI
  - WebSocket upgrade handling

#### `src/test-simple.ts`
- **Purpose**: Durable Object implementation
- **Class**: `TaskAgent`
- **Methods**:
  - `fetch()`: Handles WebSocket connections
  - `handleChat()`: Processes chat messages
  - `loadChat()`: Retrieves chat history
  - `sendUserHistory()`: Sends user-specific chats

#### `wrangler.toml`
- **Purpose**: Cloudflare Workers configuration
- **Sections**:
  - `[ai]`: Workers AI binding
  - `[[durable_objects.bindings]]`: DO configuration
  - `[[migrations]]`: DO schema migrations

## 🎨 UI Components

### Theme System

The application supports light and dark themes with CSS variables:

```css
:root {
  --bg-main: #F8FAFC;
  --bg-secondary: #FFFFFF;
  --primary: #2563EB;
  --accent: #10B981;
  --text-main: #0F172A;
}

[data-theme="dark"] {
  --bg-main: #0F172A;
  --bg-secondary: #1E293B;
  --primary: #8B5CF6;
  --accent: #22C55E;
  --text-main: #FFFFFF;
}
```

### Component Hierarchy

```
App
├── Sidebar
│   ├── Theme Toggle
│   ├── New Chat Button
│   ├── Chat History List
│   └── Footer (Auto-read toggle)
├── Main Content
│   ├── Status Bar
│   ├── Messages Container
│   │   ├── Empty State
│   │   └── Message List
│   │       ├── User Messages
│   │       └── Assistant Messages
│   └── Input Area
│       ├── Attachments Preview
│       └── Input Container
│           ├── Attach Button
│           ├── Voice Button
│           ├── Textarea
│           └── Send Button
```

## 🔐 Security Considerations

### Data Privacy
- **User IDs**: Generated client-side, not linked to personal data
- **Chat History**: Stored per-user, isolated in Durable Objects
- **No Authentication**: Currently anonymous (can be extended)

### Input Validation
- **File Size**: Limited to 10MB per file
- **File Types**: Restricted to safe formats
- **Message Length**: No explicit limit (consider adding)

### Best Practices
1. **HTTPS Only**: Enforced by Cloudflare Workers
2. **CORS**: Configured for same-origin only
3. **Rate Limiting**: Consider implementing for production
4. **Content Filtering**: Add for user-generated content

## 📊 Performance Metrics

### Expected Performance
- **Cold Start**: < 50ms (Cloudflare Workers)
- **WebSocket Latency**: < 100ms (edge-based)
- **AI Response Time**: 2-5 seconds (model dependent)
- **Concurrent Users**: Scales automatically

### Optimization Tips
1. **Minimize Bundle Size**: Remove unused code
2. **Lazy Load**: Load features on demand
3. **Cache Static Assets**: Use Cloudflare CDN
4. **Optimize Images**: Compress before upload

## 🧪 Testing

### Local Testing

```bash
# Start development server
npm run dev

# Test WebSocket connection
# Open http://127.0.0.1:8787/test
```

### Manual Testing Checklist
- [ ] WebSocket connects successfully
- [ ] Messages send and receive
- [ ] Theme toggle works
- [ ] Voice input records
- [ ] File upload works
- [ ] Image analysis functions
- [ ] Chat history persists
- [ ] Auto-read speaks messages

## 🐛 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Fails
**Symptoms**: "Connecting..." never changes to "Connected"

**Solutions**:
- Check browser console for errors
- Verify server is running (`npm run dev`)
- Clear browser cache (Ctrl + Shift + R)
- Check firewall settings

#### 2. AI Responses Not Working
**Symptoms**: Messages send but no response

**Solutions**:
- Verify Workers AI is enabled in Cloudflare dashboard
- Check Wrangler logs for errors
- Ensure internet connection (Workers AI requires remote access)
- Verify model names are correct

#### 3. Chat History Not Saving
**Symptoms**: Chats disappear on refresh

**Solutions**:
- Check Durable Objects are configured correctly
- Verify `wrangler.toml` has DO bindings
- Check browser localStorage is enabled
- Review console for storage errors

#### 4. Deployment Fails
**Symptoms**: `npm run deploy` errors

**Solutions**:
- Verify email is confirmed
- Check Cloudflare account status
- Ensure `wrangler login` was successful
- Review error message for specific issue

## 📚 API Reference

### WebSocket Messages

#### Client → Server

**Initialize Connection**
```json
{
  "type": "init",
  "userId": "user_1234567890_abc123"
}
```

**Send Chat Message**
```json
{
  "type": "chat",
  "id": 1,
  "content": "Hello, AI!",
  "chatId": "1234567890",
  "userId": "user_1234567890_abc123",
  "attachments": [
    {
      "name": "image.png",
      "type": "image",
      "size": "1.2 MB",
      "data": "data:image/png;base64,..."
    }
  ]
}
```

**Load Chat**
```json
{
  "type": "loadChat",
  "chatId": "1234567890",
  "userId": "user_1234567890_abc123"
}
```

#### Server → Client

**Connection Ready**
```json
{
  "type": "ready",
  "message": "WebSocket ready!"
}
```

**Chat History**
```json
{
  "type": "history",
  "chats": [
    {
      "id": "user_123_1234567890",
      "title": "Chat about AI",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**AI Response**
```json
{
  "type": "message",
  "content": "Hello! How can I help you today?",
  "chatId": "1234567890"
}
```

**Error**
```json
{
  "type": "error",
  "content": "Error message here"
}
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes**
4. **Test locally**
   ```bash
   npm run dev
   ```
5. **Commit changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open Pull Request**

### Code Style
- Use TypeScript for type safety
- Follow existing code formatting
- Add comments for complex logic
- Update README for new features

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Cloudflare**: For the amazing Workers platform
- **Meta**: For Llama 3.3 model
- **LLaVA Team**: For the vision model
- **Open Source Community**: For inspiration and tools

## 📞 Support

- **Issues**: https://github.com/sindukuriTeja/cloudflare/issues
- **Discussions**: https://github.com/sindukuriTeja/cloudflare/discussions
- **Cloudflare Docs**: https://developers.cloudflare.com/

## 🗺️ Roadmap

### Planned Features
- [ ] User authentication system
- [ ] Chat export functionality
- [ ] Advanced file type support
- [ ] Streaming AI responses
- [ ] Multi-language support
- [ ] Voice cloning for TTS
- [ ] Custom AI model selection
- [ ] Rate limiting
- [ ] Analytics dashboard
- [ ] Mobile app (PWA)

---

**Built with ❤️ using Cloudflare Workers, Durable Objects, and Workers AI**
