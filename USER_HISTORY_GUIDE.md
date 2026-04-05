# Per-User Chat History

## What Changed

The application now maintains separate chat histories for each user instead of showing the same history to everyone.

## How It Works

### User Identification
- Each browser/device gets a unique user ID automatically
- User ID format: `user_[timestamp]_[random]`
- Stored in browser's localStorage
- Persists across page refreshes on the same browser

### Separate Histories
- Each chat is now tagged with the user ID
- Users only see their own chat history in the sidebar
- Different browsers/devices will have different histories
- Chat IDs are prefixed with user ID: `[userId]_[chatId]`

### Testing
To test that histories are separate:

1. Open the app in your main browser (e.g., Chrome)
   - Create some chats
   - See them appear in the sidebar

2. Open the app in a different browser (e.g., Firefox) or incognito mode
   - You'll see an empty history
   - Create different chats
   - These won't appear in the first browser

3. Go back to the first browser
   - Your original chats are still there
   - The chats from the second browser are NOT visible

### Technical Implementation

**Frontend Changes:**
- Generates and stores userId in localStorage
- Sends userId with every message and on connection
- Sends userId when loading specific chats

**Backend Changes:**
- Stores userId with each chat
- Filters chat history by userId
- Only returns chats belonging to the requesting user
- Chat IDs are prefixed with userId for uniqueness

### Data Structure

```typescript
// Chat object now includes userId
{
  id: "user_123_456789",  // Prefixed with userId
  userId: "user_123",      // User who owns this chat
  title: "Chat title",
  messages: [...],
  createdAt: "2026-04-05T..."
}
```

## Benefits

- Privacy: Users can't see each other's conversations
- Multi-user support: Multiple people can use the same deployment
- Persistent: Each user's history is saved and restored
- Automatic: No login required, works seamlessly
