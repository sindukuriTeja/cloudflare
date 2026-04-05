# Google Authentication Setup Guide

## Overview

The app now supports Google OAuth authentication, allowing users to:
- Sign in with their Google account
- Have their chat history tied to their Google account
- Access their chats from any device
- See their profile picture and name

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For local development: `http://127.0.0.1:8787/auth/callback`
     - For production: `https://your-domain.workers.dev/auth/callback`
   - Click "Create"
   - Copy the Client ID and Client Secret

### 2. Configure Cloudflare Workers

Add the Google OAuth credentials to your `wrangler.toml`:

```toml
[vars]
GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "http://127.0.0.1:8787/auth/callback"

# For production, use secrets instead:
# wrangler secret put GOOGLE_CLIENT_SECRET
```

Or set them as environment variables:

```bash
# Development
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="http://127.0.0.1:8787/auth/callback"
```

### 3. Update Frontend Configuration

Edit `src/index.ts` and replace the placeholder:

```javascript
var GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
```

With your actual Client ID:

```javascript
var GOOGLE_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
```

### 4. Deploy

For local development:
```bash
npm run dev
```

For production:
```bash
npm run deploy
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google's OAuth consent screen
3. User approves access
4. Google redirects back to `/auth/callback` with authorization code
5. Backend exchanges code for access token
6. Backend fetches user info from Google
7. User info stored in localStorage
8. User ID becomes `google_[google-user-id]`

### User ID Format

- **Authenticated users**: `google_123456789` (Google user ID)
- **Anonymous users**: `anon_[timestamp]_[random]` (fallback)

### Benefits

- **Cross-device sync**: Same Google account = same chat history everywhere
- **Real identity**: Know who's using the app
- **Secure**: OAuth 2.0 standard authentication
- **Optional**: App still works without signing in (anonymous mode)

## Security Notes

1. **Never commit secrets**: Use `wrangler secret put` for production
2. **HTTPS only**: Use HTTPS in production (Cloudflare Workers provides this)
3. **Validate tokens**: In production, validate session tokens server-side
4. **Scope minimal**: Only request necessary permissions (email, profile)

## Testing

1. Start the dev server: `npm run dev`
2. Open http://127.0.0.1:8787
3. Click "Sign in with Google"
4. Approve the consent screen
5. You should see your profile picture and name in the sidebar
6. Create some chats
7. Open in incognito/different browser and sign in with the same account
8. Your chats should appear!

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure the redirect URI in Google Console exactly matches your app's URL
- Include the `/auth/callback` path

### "invalid_client" error
- Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Make sure they're properly set in wrangler.toml or environment

### User info not showing
- Check browser console for errors
- Verify localStorage has 'user' and 'session' keys
- Clear localStorage and try signing in again

## Optional: Disable Anonymous Mode

If you want to require Google sign-in, modify the frontend to check for authentication:

```javascript
if (!currentUser) {
  // Show login screen instead of chat interface
  messagesContainer.innerHTML = '<div style="text-align:center;padding:40px;">Please sign in to continue</div>';
  return;
}
```
