

# Fix: Bot Messages Reset After Answering (Sync Race Condition)

## The Problem
After sending a message and receiving a response, the conversation "resets" to a previous state. The user's latest messages disappear and the bot appears to go back to earlier questions.

## Root Cause
In `src/hooks/useBotChat.ts` (line 148), after streaming completes, only the conversations list query is invalidated:
```
queryClient.invalidateQueries({ queryKey: ['bot-conversations', botKey] });
```
The `['bot-messages', conversationId]` query is **not** invalidated, so it retains stale data.

Then in `src/pages/BotChat.tsx` (lines 74-103), the sync effect runs 150ms after streaming ends, compares the stale `savedMessages` (from cache) with the fresh local `messages`, sees they differ, and **overwrites** local state with the stale cached data -- effectively erasing the latest exchange.

## Fix (2 changes)

### 1. `src/hooks/useBotChat.ts` - Invalidate messages query after streaming
After line 148, also invalidate the bot-messages cache so the DB data is fresh:
```typescript
queryClient.invalidateQueries({ queryKey: ['bot-conversations', botKey] });
queryClient.invalidateQueries({ queryKey: ['bot-messages', conversationId || pendingConversationId] });
```

### 2. `src/pages/BotChat.tsx` - Smarter sync guard
Change the comparison logic so that if local state has MORE messages than saved (i.e., we just finished streaming and DB hasn't caught up), we skip the sync instead of overwriting:
```typescript
if (savedMessages.length > 0) {
  // Don't overwrite local state if it has more messages (DB hasn't caught up yet)
  if (messages.length > savedMessages.length) {
    return;
  }
  // ... existing comparison logic
}
```

## Summary
| File | Change |
|------|--------|
| `src/hooks/useBotChat.ts` | Add invalidation of `bot-messages` query after streaming |
| `src/pages/BotChat.tsx` | Add guard: skip sync if local state has more messages than DB |

