
# AI Assistant for the Dealer Panel

## Overview

A floating AI chat assistant will be embedded into the dealer panel, accessible from every page via a chat bubble in the bottom-right corner. It will be context-aware (knowing the dealer's data), conversational, and able to help with daily tasks, compliance questions, and platform navigation.

---

## What it will do

The assistant will be able to:
- Answer questions about the dealer's own data ("How many open leads do I have?", "Show me overdue tasks")
- Provide guidance on compliance, FCA rules, and GDPR
- Explain CRA Shield scores and aftersales case statuses
- Give a daily briefing (expiring warranties, overdue tasks, trial status)
- Help navigate the platform ("Where do I raise an aftersales case?")
- Answer general dealership business questions

It will NOT have write access — it reads and explains, it does not create or modify records.

---

## Architecture

```text
[Dealer UI] → floating chat bubble
     ↓ open
[Chat Panel] — sends messages
     ↓
[Edge Function: dealer-ai-chat]
     ├── Fetches dealer context (stats, open items) from DB using service role
     ├── Builds system prompt with dealer-specific context
     └── Streams response from Lovable AI (gemini-3-flash-preview)
```

The edge function uses the `LOVABLE_API_KEY` already configured — no new secrets needed.

---

## Components to Build

### 1. Edge Function — `supabase/functions/dealer-ai-chat/index.ts`
- Accepts `{ messages, dealerId }` from the authenticated request
- Validates the dealer has access (JWT check)
- Fetches a live snapshot of dealer data:
  - Open leads count
  - Active warranties
  - Overdue tasks
  - Open aftersales cases
  - Open compliance items (complaints, DSRs)
  - Trial status / days remaining
- Injects this context into a system prompt
- Streams the response back using `gemini-3-flash-preview` via Lovable AI gateway
- Handles 429/402 rate limit errors gracefully

### 2. Chat UI Component — `src/components/app/DealerAIChat.tsx`
A self-contained floating chat widget:
- **Trigger button**: Fixed bottom-right `Bot` icon button with a pulsing indicator
- **Chat panel**: Slides up as a card (not a full-page modal) — roughly 400px wide, 500px tall
- **Message list**: Shows user and assistant messages with markdown rendering (using `dangerouslySetInnerHTML` with basic markdown parsing or a lightweight approach)
- **Input bar**: Text input + send button, `Enter` to send
- **Streaming**: Tokens render as they arrive, no full-page reload
- **Suggested prompts**: On first open, shows 4 quick-start chips:
  - "Give me a daily briefing"
  - "How many open leads do I have?"
  - "What are my overdue tasks?"
  - "Explain my CRA Shield score"
- **Clear chat**: Button to reset the conversation
- **Loading state**: Animated dots while the assistant is thinking

### 3. Integration into AppLayout — `src/components/app/AppLayout.tsx`
- Import and render `<DealerAIChat />` inside the layout, alongside `<Outlet />`
- It will float over all dealer pages without affecting layout flow

### 4. Config — `supabase/config.toml`
- Add `[functions.dealer-ai-chat]` with `verify_jwt = false` (JWT validated manually in the function using the auth header)

---

## System Prompt Design

The AI will receive a context-rich system prompt like:

```
You are DealerOps AI, an assistant embedded in the DealerOps platform for a UK motor dealership.

Current dealer snapshot (live data):
- Open Leads: 12
- Active Warranties: 8
- Overdue Tasks: 3
- Open Aftersales Cases: 5
- Open Complaints: 1
- Open DSRs: 0
- Trial: 9 days remaining

You help dealer staff understand their data, navigate the platform, and answer compliance questions (FCA, GDPR, Consumer Duty). You do not modify records. Be concise, professional, and helpful.
```

---

## Security Considerations

- The edge function reads the JWT from the `Authorization` header and verifies the user's `dealer_id` from their profile before fetching any data
- All data fetching uses the service role key server-side — the client never sees raw data queries
- The assistant only has access to the dealer's own scoped data (RLS-equivalent filtering done manually in the function)
- No write operations are performed by the AI

---

## Files to Create / Modify

| File | Action |
|---|---|
| `supabase/functions/dealer-ai-chat/index.ts` | Create — edge function |
| `src/components/app/DealerAIChat.tsx` | Create — floating chat UI |
| `src/components/app/AppLayout.tsx` | Edit — add `<DealerAIChat />` |
| `supabase/config.toml` | Edit — register new function |

---

## Design Style

- Matches existing dark/light theme using Tailwind and existing `bg-card`, `border-border`, `text-primary` tokens
- Floating button uses `bg-primary` with a subtle `ring-2 ring-primary/30` glow
- Chat panel uses the same card/border styling as the rest of the app
- No third-party UI libraries needed beyond what's already installed
