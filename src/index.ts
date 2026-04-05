import { TaskAgent } from "./test-simple";

export { TaskAgent };

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Google OAuth callback
    if (url.pathname === "/auth/callback") {
      return handleGoogleCallback(request, env);
    }

    // Get user info endpoint
    if (url.pathname === "/auth/user") {
      return getUserInfo(request);
    }

    // Logout endpoint
    if (url.pathname === "/auth/logout") {
      return logout();
    }

    if (url.pathname === "/test") {
      return new Response(TEST_HTML, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(MAIN_HTML, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === "/agent") {
      const id = env.TASK_AGENT.idFromName("default");
      const stub = env.TASK_AGENT.get(id);
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

// Google OAuth handler
async function handleGoogleCallback(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json() as any;

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userInfo = await userResponse.json() as any;

    // Create session token
    const sessionToken = crypto.randomUUID();
    const userData = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };

    // Return HTML that stores session and redirects
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Login Success</title></head>
      <body>
        <script>
          localStorage.setItem('session', '${sessionToken}');
          localStorage.setItem('user', JSON.stringify(${JSON.stringify(userData)}));
          window.location.href = '/';
        </script>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    return new Response("Authentication failed: " + (error as Error).message, { status: 500 });
  }
}

function getUserInfo(request: Request): Response {
  // In a real app, validate session token here
  return new Response(JSON.stringify({ authenticated: false }), {
    headers: { "Content-Type": "application/json" },
  });
}

function logout(): Response {
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head><title>Logout</title></head>
    <body>
      <script>
        localStorage.removeItem('session');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        window.location.href = '/';
      </script>
    </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

const TEST_HTML = `<!DOCTYPE html>
<html>
<head><title>WebSocket Test</title></head>
<body style="font-family: monospace; padding: 20px;">
    <h1>WebSocket Connection Test</h1>
    <div id="status" style="font-size: 24px; margin: 20px 0;">Starting...</div>
    <div id="log" style="background: #f0f0f0; padding: 10px; border-radius: 5px;"></div>
    <script>
        const statusDiv = document.getElementById('status');
        const logDiv = document.getElementById('log');
        function log(msg) {
            console.log(msg);
            const time = new Date().toLocaleTimeString();
            logDiv.innerHTML += time + ' - ' + msg + '<br>';
        }
        log('Script loaded!');
        log('Attempting WebSocket connection to ws://127.0.0.1:8787/agent');
        try {
            const ws = new WebSocket('ws://127.0.0.1:8787/agent');
            log('WebSocket object created');
            ws.onopen = function() {
                log('CONNECTED!');
                statusDiv.textContent = 'Connected!';
                statusDiv.style.color = 'green';
            };
            ws.onerror = function(e) {
                log('ERROR: ' + JSON.stringify(e));
                statusDiv.textContent = 'Error';
                statusDiv.style.color = 'red';
            };
            ws.onclose = function(e) {
                log('CLOSED: Code=' + e.code + ', Reason=' + e.reason);
                statusDiv.textContent = 'Closed';
                statusDiv.style.color = 'orange';
            };
            ws.onmessage = function(e) {
                log('MESSAGE: ' + e.data);
            };
        } catch (error) {
            log('EXCEPTION: ' + error.message);
            statusDiv.textContent = 'Exception';
            statusDiv.style.color = 'red';
        }
    </script>
</body>
</html>`;

const MAIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Assistant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: #343541;
      color: #ececf1;
      height: 100vh;
      display: flex;
      overflow: hidden;
      margin: 0;
    }
    
    /* Sidebar */
    .sidebar {
      width: 260px;
      background: #202123;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #2e2f33;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2);
    }
    
    .sidebar-header {
      padding: 12px;
    }
    
    .new-chat-btn {
      width: 100%;
      padding: 14px 16px;
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
    }
    
    .new-chat-btn:hover {
      background: linear-gradient(135deg, #0d8a6a 0%, #0a7558 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 163, 127, 0.4);
    }
    
    .new-chat-btn:active {
      transform: translateY(0);
    }
    
    .chat-history {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    
    .chat-item {
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 6px;
      color: #ececf1;
      transition: all 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
    }
    
    .chat-item::before {
      content: '💬';
      margin-right: 8px;
      opacity: 0.7;
    }
    
    .chat-item:hover {
      background: linear-gradient(135deg, #2a2b32 0%, #343541 100%);
      padding-left: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .chat-item.active {
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
      font-weight: 600;
    }
    
    .sidebar-footer {
      padding: 12px;
      border-top: 1px solid #4d4d4f;
      font-size: 12px;
      color: #8e8ea0;
    }
    
    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: linear-gradient(135deg, #2a2b32 0%, #343541 100%);
      border-radius: 8px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .user-profile:hover {
      background: linear-gradient(135deg, #343541 0%, #3d3e4f 100%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .user-profile img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #10a37f;
    }
    
    .user-info {
      flex: 1;
      min-width: 0;
    }
    
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #ececf1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .user-email {
      font-size: 11px;
      color: #8e8ea0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .login-btn {
      width: 100%;
      padding: 12px 16px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s ease;
      color: #3c4043;
      margin-bottom: 12px;
    }
    
    .login-btn:hover {
      background: #f8f9fa;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .login-btn img {
      width: 18px;
      height: 18px;
    }
    
    .auto-read-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #2a2b32 0%, #343541 100%);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }
    
    .auto-read-toggle:hover {
      background: linear-gradient(135deg, #343541 0%, #3d3e4f 100%);
      border-color: #10a37f;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.2);
    }
    
    .auto-read-toggle input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    
    .auto-read-toggle label {
      cursor: pointer;
      font-size: 13px;
      color: #ececf1;
      flex: 1;
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    /* Status Bar */
    .status-bar {
      padding: 12px 20px;
      background: #444654;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid #2e2f33;
      transition: all 0.3s ease;
    }
    
    .status-bar.connected {
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
    }
    
    /* Messages Area */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    
    .messages-container::-webkit-scrollbar {
      width: 8px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: #565869;
      border-radius: 4px;
    }
    
    .message-wrapper {
      width: 100%;
      border-bottom: 1px solid #4d4d4f;
      padding: 24px 0;
    }
    
    .message-wrapper.user {
      background: #343541;
    }
    
    .message-wrapper.assistant {
      background: #444654;
    }
    
    .message-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      gap: 24px;
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .avatar.user {
      background: linear-gradient(135deg, #5436da 0%, #6b46e5 100%);
    }
    
    .avatar.assistant {
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
    }
    
    .message-text {
      flex: 1;
      line-height: 1.7;
      font-size: 16px;
      padding-top: 4px;
      position: relative;
    }
    
    .speak-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 28px;
      height: 28px;
      background: #565869;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s, background 0.2s;
    }
    
    .speak-btn:hover {
      opacity: 1;
      background: #6b6c7a;
    }
    
    .speak-btn.speaking {
      background: #19c37d;
      opacity: 1;
      animation: pulse-green 1s ease-in-out infinite;
    }
    
    @keyframes pulse-green {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }
    
    .speak-btn svg {
      width: 14px;
      height: 14px;
      fill: white;
    }
    
    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }
    
    .empty-state h1 {
      font-size: 32px;
      margin-bottom: 40px;
      font-weight: 600;
    }
    
    .examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      max-width: 900px;
      width: 100%;
      margin-bottom: 20px;
    }
    
    .example-card {
      background: linear-gradient(135deg, #444654 0%, #4d4d5f 100%);
      padding: 20px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      border: 1px solid transparent;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .example-card:hover {
      background: linear-gradient(135deg, #4d4d5f 0%, #565869 100%);
      border-color: #10a37f;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(16, 163, 127, 0.2);
    }
    
    .example-card h3 {
      font-size: 14px;
      margin-bottom: 8px;
      color: #ececf1;
    }
    
    .example-card p {
      font-size: 13px;
      color: #c5c5d2;
    }
    
    /* Input Area */
    .input-area {
      padding: 20px;
      background: #343541;
    }
    
    .input-wrapper {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }
    
    .attachments-preview {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .attachment-item {
      position: relative;
      background: #40414f;
      border: 1px solid #565869;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 200px;
    }
    
    .attachment-item img {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .attachment-item .file-icon {
      width: 40px;
      height: 40px;
      background: #565869;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .attachment-info {
      flex: 1;
      min-width: 0;
    }
    
    .attachment-name {
      font-size: 12px;
      color: #ececf1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .attachment-size {
      font-size: 10px;
      color: #8e8ea0;
    }
    
    .remove-attachment {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      background: #ef4444;
      border: 2px solid #343541;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
    }
    
    .input-container {
      background: #40414f;
      border-radius: 12px;
      border: 1px solid #565869;
      display: flex;
      align-items: flex-end;
      padding: 12px 16px;
      transition: border-color 0.2s, background 0.2s;
    }
    
    .input-container:focus-within {
      border-color: #8e8ea0;
    }
    
    .input-container.drag-over {
      border-color: #19c37d;
      background: #4a4b56;
    }
    
    .attach-btn {
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
      margin-right: 8px;
      color: #8e8ea0;
    }
    
    .attach-btn:hover {
      background: #565869;
    }
    
    .attach-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    .voice-btn {
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
      margin-right: 8px;
      color: #8e8ea0;
    }
    
    .voice-btn:hover {
      background: #565869;
    }
    
    .voice-btn.recording {
      background: #ef4444;
      color: white;
      animation: pulse-red 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse-red {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    .voice-btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    
    textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ececf1;
      font-size: 16px;
      font-family: inherit;
      resize: none;
      max-height: 200px;
      line-height: 1.5;
    }
    
    textarea::placeholder {
      color: #8e8ea0;
    }
    
    .send-btn {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      margin-left: 8px;
      box-shadow: 0 2px 8px rgba(16, 163, 127, 0.3);
    }
    
    .send-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #0d8a6a 0%, #0a7558 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 163, 127, 0.4);
    }
    
    .send-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .send-btn:disabled {
      background: #40414f;
      cursor: not-allowed;
      opacity: 0.5;
    }
    
    .send-btn svg {
      width: 16px;
      height: 16px;
      fill: white;
    }
    
    .file-input {
      display: none;
    }
    
    /* Typing Indicator */
    .typing-indicator {
      display: none;
    }
    
    .typing-indicator.active {
      display: flex;
      gap: 4px;
      padding-top: 4px;
    }
    
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #8e8ea0;
      animation: typing 1.4s infinite;
    }
    
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
      
      .examples {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-header">
      <button class="new-chat-btn" onclick="newChat()">
        <span>+</span>
        <span>New chat</span>
      </button>
    </div>
    <div class="chat-history" id="chatHistory">
      <!-- Chat history items will go here -->
    </div>
    <div class="sidebar-footer">
      <div id="authSection"></div>
      <div class="auto-read-toggle" onclick="toggleAutoRead()">
        <input type="checkbox" id="autoReadCheckbox" onclick="event.stopPropagation()">
        <label for="autoReadCheckbox">🔊 Auto-read responses</label>
      </div>
      Powered by Cloudflare Workers AI<br>
      <small style="opacity: 0.7;">Llama 3.3 70B + LLaVA Vision</small>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <div class="status-bar" id="status">Connecting...</div>
    
    <div class="messages-container" id="messagesContainer">
      <div class="empty-state" id="emptyState">
        <h1>AI Assistant</h1>
        <div class="examples">
          <div class="example-card" onclick="sendExample('Explain quantum computing in simple terms')">
            <h3>💡 Explain</h3>
            <p>Quantum computing in simple terms</p>
          </div>
          <div class="example-card" onclick="sendExample('Write a creative story about a robot')">
            <h3>✍️ Create</h3>
            <p>A creative story about a robot</p>
          </div>
          <div class="example-card" onclick="sendExample('Help me debug this Python code')">
            <h3>🔧 Code</h3>
            <p>Debug Python code</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="input-area">
      <div class="input-wrapper">
        <div class="attachments-preview" id="attachmentsPreview"></div>
        <div class="input-container" id="inputContainer">
          <button class="attach-btn" onclick="document.getElementById('fileInput').click()" title="Attach file or image">
            <svg viewBox="0 0 24 24">
              <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
            </svg>
          </button>
          <button class="voice-btn" id="voiceBtn" onclick="toggleVoiceInput()" title="Voice input (click to speak)">
            <svg viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
          <input 
            type="file" 
            id="fileInput" 
            class="file-input" 
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
            multiple
            onchange="handleFileSelect(event)"
          />
          <textarea 
            id="input" 
            placeholder="Send a message... (Paste images with Ctrl+V or click mic to speak)" 
            rows="1"
            onkeydown="handleKeyDown(event)"
            oninput="autoResize(this)"
            onpaste="handlePaste(event)"
          ></textarea>
          <button class="send-btn" id="sendBtn" onclick="sendMessage()">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    var messagesContainer = document.getElementById('messagesContainer');
    var emptyState = document.getElementById('emptyState');
    var chatHistory = document.getElementById('chatHistory');
    var attachmentsPreview = document.getElementById('attachmentsPreview');
    var inputContainer = document.getElementById('inputContainer');
    var input = document.getElementById('input');
    var sendBtn = document.getElementById('sendBtn');
    var voiceBtn = document.getElementById('voiceBtn');
    var statusDiv = document.getElementById('status');
    var authSection = document.getElementById('authSection');
    var ws = null;
    var messageId = 0;
    var hasMessages = false;
    var currentChatId = null;
    var chats = [];
    var attachedFiles = [];
    var recognition = null;
    var isRecording = false;
    var autoRead = false;
    var currentSpeech = null;
    var userId = null;
    var currentUser = null;
    
    // Google OAuth Config - YOU NEED TO SET THESE
    var GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
    var REDIRECT_URI = window.location.origin + '/auth/callback';

    // Check for existing user session
    var storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
        userId = 'google_' + currentUser.id;
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Fallback to anonymous user
    if (!userId) {
      userId = localStorage.getItem('userId');
      if (!userId) {
        userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
      }
    }
    
    console.log('User ID:', userId);
    
    // Render auth section
    function renderAuth() {
      if (currentUser) {
        authSection.innerHTML = '<div class="user-profile" onclick="showUserMenu()">' +
          '<img src="' + currentUser.picture + '" alt="' + currentUser.name + '">' +
          '<div class="user-info">' +
          '<div class="user-name">' + currentUser.name + '</div>' +
          '<div class="user-email">' + currentUser.email + '</div>' +
          '</div>' +
          '</div>';
      } else {
        authSection.innerHTML = '<button class="login-btn" onclick="loginWithGoogle()">' +
          '<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>' +
          'Sign in with Google' +
          '</button>';
      }
    }
    
    function loginWithGoogle() {
      var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        'client_id=' + encodeURIComponent(GOOGLE_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
        '&response_type=code' +
        '&scope=' + encodeURIComponent('openid email profile') +
        '&access_type=online';
      window.location.href = authUrl;
    }
    
    function showUserMenu() {
      if (confirm('Do you want to sign out?')) {
        window.location.href = '/auth/logout';
      }
    }
    
    renderAuth();

    // Load auto-read preference
    if (localStorage.getItem('autoRead') === 'true') {
      autoRead = true;
      document.getElementById('autoReadCheckbox').checked = true;
    }

    function toggleAutoRead() {
      var checkbox = document.getElementById('autoReadCheckbox');
      checkbox.checked = !checkbox.checked;
      autoRead = checkbox.checked;
      localStorage.setItem('autoRead', autoRead);
      
      if (autoRead) {
        statusDiv.textContent = 'Auto-read enabled ✓';
        setTimeout(function() {
          if (ws && ws.readyState === WebSocket.OPEN) {
            statusDiv.textContent = 'Connected';
            statusDiv.className = 'status-bar connected';
          }
        }, 2000);
      }
    }

    // Setup speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = function() {
        isRecording = true;
        voiceBtn.classList.add('recording');
        statusDiv.textContent = 'Listening... Speak now';
        statusDiv.className = 'status-bar';
        statusDiv.style.background = '#ef4444';
        statusDiv.style.color = 'white';
      };

      recognition.onresult = function(event) {
        var transcript = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        input.value = transcript;
        autoResize(input);
      };

      recognition.onend = function() {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        statusDiv.textContent = 'Connected';
        statusDiv.className = 'status-bar connected';
      };

      recognition.onerror = function(event) {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        statusDiv.textContent = 'Voice error: ' + event.error;
        statusDiv.className = 'status-bar';
        setTimeout(function() {
          statusDiv.textContent = 'Connected';
          statusDiv.className = 'status-bar connected';
        }, 3000);
      };
    } else {
      voiceBtn.style.display = 'none';
      console.log('Speech recognition not supported');
    }

    function toggleVoiceInput() {
      if (!recognition) {
        alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }

    // Setup drag and drop
    inputContainer.addEventListener('dragover', function(e) {
      e.preventDefault();
      inputContainer.classList.add('drag-over');
    });

    inputContainer.addEventListener('dragleave', function(e) {
      e.preventDefault();
      inputContainer.classList.remove('drag-over');
    });

    inputContainer.addEventListener('drop', function(e) {
      e.preventDefault();
      inputContainer.classList.remove('drag-over');
      
      var files = e.dataTransfer.files;
      if (files.length > 0) {
        addFilesToAttachments(files);
      }
    });

    function connect() {
      console.log('Connecting...');
      ws = new WebSocket('ws://' + location.host + '/agent');

      ws.onopen = function() {
        console.log('Connected!');
        statusDiv.textContent = 'Connected';
        statusDiv.className = 'status-bar connected';
        
        // Send userId to get user-specific history
        ws.send(JSON.stringify({
          type: 'init',
          userId: userId
        }));
      };

      ws.onclose = function() {
        console.log('Disconnected');
        statusDiv.textContent = 'Disconnected - Reconnecting...';
        statusDiv.className = 'status-bar';
        setTimeout(connect, 2000);
      };

      ws.onerror = function(e) {
        console.error('WebSocket error:', e);
      };

      ws.onmessage = function(event) {
        console.log('Message:', event.data);
        var data = JSON.parse(event.data);
        
        if (data.type === 'ready') {
          // Connection ready
        } else if (data.type === 'history') {
          chats = data.chats;
          renderChatHistory();
        } else if (data.type === 'message') {
          hideTyping();
          addMessage('assistant', data.content);
          
          // Auto-read if enabled
          if (autoRead && 'speechSynthesis' in window) {
            setTimeout(function() {
              speakText(data.content, null, true);
            }, 500);
          }
        } else if (data.type === 'newChatCreated') {
          currentChatId = data.chatId;
        } else if (data.type === 'chatLoaded') {
          loadChatMessages(data.chat);
        } else if (data.type === 'error') {
          hideTyping();
          addMessage('assistant', 'Error: ' + data.content);
        }
      };
    }

    function handleFileSelect(event) {
      var files = event.target.files;
      addFilesToAttachments(files);
      event.target.value = '';
    }

    function handlePaste(event) {
      var items = event.clipboardData.items;
      var files = [];
      
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        
        if (item.kind === 'file') {
          var file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      
      if (files.length > 0) {
        event.preventDefault();
        addFilesToAttachments(files);
      }
    }

    function addFilesToAttachments(files) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          alert('File ' + file.name + ' is too large. Max size is 10MB.');
          continue;
        }
        attachedFiles.push(file);
      }
      renderAttachments();
    }

    function renderAttachments() {
      attachmentsPreview.innerHTML = '';
      attachedFiles.forEach(function(file, index) {
        var item = document.createElement('div');
        item.className = 'attachment-item';
        
        if (file.type.startsWith('image/')) {
          var img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          item.appendChild(img);
        } else {
          var icon = document.createElement('div');
          icon.className = 'file-icon';
          icon.textContent = '📄';
          item.appendChild(icon);
        }
        
        var info = document.createElement('div');
        info.className = 'attachment-info';
        
        var name = document.createElement('div');
        name.className = 'attachment-name';
        name.textContent = file.name;
        
        var size = document.createElement('div');
        size.className = 'attachment-size';
        size.textContent = formatFileSize(file.size);
        
        info.appendChild(name);
        info.appendChild(size);
        item.appendChild(info);
        
        var remove = document.createElement('div');
        remove.className = 'remove-attachment';
        remove.textContent = '×';
        remove.onclick = function() {
          removeAttachment(index);
        };
        item.appendChild(remove);
        
        attachmentsPreview.appendChild(item);
      });
    }

    function removeAttachment(index) {
      attachedFiles.splice(index, 1);
      renderAttachments();
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function renderChatHistory() {
      chatHistory.innerHTML = '';
      chats.forEach(function(chat) {
        var item = document.createElement('div');
        item.className = 'chat-item';
        item.textContent = chat.title || 'New Chat';
        item.onclick = function() {
          loadChat(chat.id);
        };
        chatHistory.appendChild(item);
      });
    }

    function loadChat(chatId) {
      ws.send(JSON.stringify({ 
        type: 'loadChat', 
        chatId: chatId,
        userId: userId
      }));
      currentChatId = chatId;
    }

    function loadChatMessages(chat) {
      messagesContainer.innerHTML = '';
      emptyState.style.display = 'none';
      hasMessages = true;
      
      chat.messages.forEach(function(msg) {
        addMessage(msg.role, msg.content, msg.attachments);
      });
    }

    function addMessage(role, content, attachments) {
      if (!hasMessages) {
        emptyState.style.display = 'none';
        hasMessages = true;
      }

      var wrapper = document.createElement('div');
      wrapper.className = 'message-wrapper ' + role;
      
      var messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      
      var avatar = document.createElement('div');
      avatar.className = 'avatar ' + role;
      avatar.textContent = role === 'user' ? '👤' : '🤖';
      
      var textContainer = document.createElement('div');
      textContainer.className = 'message-text';
      
      if (attachments && attachments.length > 0) {
        attachments.forEach(function(att) {
          if (att.type === 'image') {
            var img = document.createElement('img');
            img.src = att.data;
            img.style.maxWidth = '300px';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '8px';
            textContainer.appendChild(img);
          } else {
            var fileDiv = document.createElement('div');
            fileDiv.textContent = '📎 ' + att.name + ' (' + att.size + ')';
            fileDiv.style.marginBottom = '8px';
            fileDiv.style.color = '#8e8ea0';
            textContainer.appendChild(fileDiv);
          }
        });
      }
      
      var text = document.createElement('div');
      text.textContent = content;
      textContainer.appendChild(text);
      
      // Add speak button for assistant messages
      if (role === 'assistant' && 'speechSynthesis' in window) {
        var speakBtn = document.createElement('button');
        speakBtn.className = 'speak-btn';
        speakBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        speakBtn.title = 'Read aloud';
        speakBtn.onclick = function() {
          speakText(content, speakBtn);
        };
        textContainer.appendChild(speakBtn);
      }
      
      messageContent.appendChild(avatar);
      messageContent.appendChild(textContainer);
      wrapper.appendChild(messageContent);
      
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function speakText(text, button, isAutoRead) {
      // Stop any current speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (currentSpeech) {
          currentSpeech.classList.remove('speaking');
          currentSpeech = null;
        }
        if (!isAutoRead && button) {
          button.classList.remove('speaking');
        }
        return;
      }

      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      if (button) {
        button.classList.add('speaking');
        currentSpeech = button;
      }
      
      utterance.onend = function() {
        if (button) {
          button.classList.remove('speaking');
        }
        currentSpeech = null;
      };
      
      utterance.onerror = function() {
        if (button) {
          button.classList.remove('speaking');
        }
        currentSpeech = null;
      };
      
      window.speechSynthesis.speak(utterance);
    }

    function showTyping() {
      var wrapper = document.createElement('div');
      wrapper.className = 'message-wrapper assistant';
      wrapper.id = 'typingIndicator';
      
      var messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      
      var avatar = document.createElement('div');
      avatar.className = 'avatar assistant';
      avatar.textContent = '🤖';
      
      var typing = document.createElement('div');
      typing.className = 'typing-indicator active';
      typing.innerHTML = '<span></span><span></span><span></span>';
      
      messageContent.appendChild(avatar);
      messageContent.appendChild(typing);
      wrapper.appendChild(messageContent);
      
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
      var typing = document.getElementById('typingIndicator');
      if (typing) typing.remove();
    }

    async function sendMessage() {
      var text = input.value.trim();
      if ((!text && attachedFiles.length === 0) || !ws || ws.readyState !== WebSocket.OPEN) return;
      
      if (!currentChatId) {
        currentChatId = Date.now().toString();
      }
      
      var attachmentsData = [];
      
      for (var i = 0; i < attachedFiles.length; i++) {
        var file = attachedFiles[i];
        var reader = new FileReader();
        
        await new Promise(function(resolve) {
          reader.onload = function(e) {
            attachmentsData.push({
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' : 'file',
              size: formatFileSize(file.size),
              data: e.target.result
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      
      addMessage('user', text || 'Sent ' + attachedFiles.length + ' file(s)', attachmentsData);
      showTyping();
      
      ws.send(JSON.stringify({ 
        type: 'chat', 
        id: ++messageId, 
        content: text,
        chatId: currentChatId,
        userId: userId,
        attachments: attachmentsData
      }));
      
      input.value = '';
      input.style.height = 'auto';
      attachedFiles = [];
      renderAttachments();
      sendBtn.disabled = true;
      setTimeout(function() { sendBtn.disabled = false; }, 1000);
    }

    function sendExample(text) {
      input.value = text;
      sendMessage();
    }

    function newChat() {
      messagesContainer.innerHTML = '';
      emptyState.style.display = 'flex';
      hasMessages = false;
      currentChatId = null;
      attachedFiles = [];
      renderAttachments();
    }

    function handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }

    function autoResize(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }

    connect();
  </script>
</body>
</html>`;
