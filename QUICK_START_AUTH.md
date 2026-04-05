# Quick Start: Enable Google Authentication

## Current Status

✅ Google OAuth code is implemented  
✅ Server is running with auth endpoints  
⚠️ Needs Google Cloud credentials to work  

## 3-Minute Setup

### Step 1: Get Google Credentials (2 minutes)

1. Open https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI:
   ```
   http://127.0.0.1:8787/auth/callback
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Update Configuration (1 minute)

**File 1: `wrangler.toml`** (line 20)
```toml
[vars]
GOOGLE_CLIENT_ID = "123456789-abc.apps.googleusercontent.com"  # ← Paste your Client ID here
GOOGLE_REDIRECT_URI = "http://127.0.0.1:8787/auth/callback"
```

**File 2: `src/index.ts`** (around line 1050)
```javascript
var GOOGLE_CLIENT_ID = '123456789-abc.apps.googleusercontent.com';  // ← Paste your Client ID here
```

**Set the secret:**
```bash
wrangler secret put GOOGLE_CLIENT_SECRET
# Paste your Client Secret when prompted
```

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Test It

1. Open http://127.0.0.1:8787
2. Look for "Sign in with Google" button in sidebar
3. Click it
4. Sign in with your Google account
5. You should see your profile picture and name!

## Without Setup

The app works fine without Google OAuth:
- Uses anonymous user IDs
- Chat history per browser
- All features work

Google auth adds:
- Cross-device sync
- Real user identity
- Better UX

## Troubleshooting

**"Sign in with Google" button not appearing?**
- Check browser console for errors
- Verify GOOGLE_CLIENT_ID is set in both files

**"redirect_uri_mismatch" error?**
- Make sure redirect URI in Google Console exactly matches:
  `http://127.0.0.1:8787/auth/callback`

**"invalid_client" error?**
- Double-check Client ID and Client Secret
- Make sure no extra spaces when copying

## Full Documentation

See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) for complete details.
