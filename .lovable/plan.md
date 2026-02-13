
# Implementation: Difficulty Levels for Connection Bridge + One-Question Rule for All Bots

## What Will Change

### 1. New Component: `src/components/bots/DifficultySelector.tsx`
A mobile-friendly card with 3 large, tappable buttons for difficulty selection:
- **קל (Easy)**: "איש קשר שיתופי ופתוח להפניות" -- cooperative, friendly contact
- **בינוני (Medium)**: "איש קשר עסוק שצריך שכנוע" -- busy but professional
- **מאתגר (Hard)**: "איש קשר ציני עם הרבה מפנים, שחייבים לשכנע" -- cynical, has 5 minutes, many other therapists

Each button will be a full-width card with icon, title, and description. Touch-friendly with min-height for mobile.

### 2. Update `src/hooks/useBotChat.ts`
- `sendMessage` will accept an optional `messagePrefix` parameter
- The prefix is sent to the API but NOT shown in the user's message bubble
- This keeps the `[DIFFICULTY:X]` marker invisible to the user

### 3. Update `src/pages/BotChat.tsx`
- Add `selectedDifficulty` state
- Show `DifficultySelector` for connection-bridge bot when no messages exist and no active conversation
- When user selects difficulty, store it; on first message, prepend `[DIFFICULTY:X]`
- Reset difficulty on new conversation
- Difficulty selector disappears once conversation starts

### 4. Add Translations to `src/contexts/LanguageContext.tsx`
Hebrew and English translations for difficulty labels and descriptions.

### 5. Update Bot System Prompts (Database)
**All bots** - Add one-question-at-a-time rule and warm intro instruction:
```
CONVERSATION RULES:
1. Always start with a brief, warm, and welcoming introduction. Explain what you'll do together and how the process works. Reflect a professional yet empathic tone.
2. Ask only ONE question at a time. Wait for the user to respond before proceeding.
3. Never load multiple questions in a single message.
```

**Connection Bridge bot** - Add difficulty awareness to the system prompt:
```
DIFFICULTY LEVELS - Look for [DIFFICULTY:X] in the first user message:
- [DIFFICULTY:easy]: Cooperative, friendly, actively needs referrals
- [DIFFICULTY:medium]: Busy but professional, needs convincing but isn't hostile
- [DIFFICULTY:hard]: Very busy ("I have 5 minutes"), has many therapists already, 
  may be skeptical or dismissive, pushes the therapist to be concise and value-oriented. 
  NOT purely hostile - but makes the caller work to demonstrate their value.
Default to medium if no marker found. Strip the marker - never mention it.
```

## Technical Details

### Difficulty Selector UI (Mobile-First)
- Full-width stacked cards on mobile
- Each card: icon (Smile/Meh/Shield), Hebrew title, short description
- Selected state with primary border highlight
- Appears between the stepper and messages area
- Min touch target: 48px height per option

### Message Flow
```text
User opens Connection Bridge -> Welcome message + DifficultySelector shown
User taps "מאתגר" -> selectedDifficulty = "hard"  
User types "שלום..." -> sendMessage("שלום...", "[DIFFICULTY:hard]")
  -> API receives: "[DIFFICULTY:hard] שלום..."
  -> UI shows only: "שלום..."
DifficultySelector disappears (messages exist)
```

## Files Summary

| File | Change |
|------|--------|
| `src/components/bots/DifficultySelector.tsx` | New component - 3 difficulty cards |
| `src/hooks/useBotChat.ts` | Add optional `messagePrefix` to `sendMessage` |
| `src/pages/BotChat.tsx` | Integrate difficulty selector, pass prefix on first message |
| `src/contexts/LanguageContext.tsx` | Add difficulty translations (EN + HE) |
| Database (bot_configurations) | Update all bot prompts with one-question rule + connection-bridge difficulty logic |
