## Goal

Update model, max_tokens, and temperature for the existing AI agents. No prompts, knowledge base, or UI changes.

## Changes

**`mentor_ai_settings`** (1 row):
- model → `google/gemini-2.5-pro`, max_tokens → `6000`, temperature → `0.5`

**`bot_configurations`** (5 rows by `bot_key`):
| bot_key | model | max_tokens | temperature |
|---|---|---|---|
| niche-finder | google/gemini-2.5-flash | 1500 | 0.5 |
| pricing-calculator | google/gemini-2.5-flash | 1500 | 0.5 |
| contact-finder | google/gemini-2.5-flash | 1500 | 0.5 |
| self-presentation | google/gemini-2.5-flash | 1500 | 0.5 |
| connection-bridge | google/gemini-2.5-flash | 2000 | 0.6 |

Skipped per user: Content Creation and Strategy Planning (no matching bots exist in the project).

## Implementation

Single Supabase migration with two `UPDATE` statements (one per table). All other columns — `system_prompt`, `welcome_message_*`, `name_*`, `icon`, etc. — are left untouched.
