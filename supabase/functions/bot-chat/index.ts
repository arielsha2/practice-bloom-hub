import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
};

// Bots that allow anonymous (unauthenticated) access
const PUBLIC_BOTS: Record<string, string> = {
  "contact-finder": "2026-03-22",
};

interface ChatRequest {
  botKey: string;
  conversationId?: string;
  message: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body first to check if it's a public bot
    const { botKey, conversationId, message }: ChatRequest = await req.json();
    
    const isPublicBot = PUBLIC_BOTS[botKey] && new Date() < new Date(PUBLIC_BOTS[botKey]);

    const authHeader = req.headers.get("Authorization");
    let user: { id: string } | null = null;
    let supabase: any;

    if (authHeader) {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (!userError && authUser) {
        user = authUser;
      }
    }

    // If not authenticated and not a public bot, reject
    if (!user && !isPublicBot) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For anonymous public bot access, use service role client (read-only for bot config)
    if (!supabase) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    // 1. Load bot configuration
    const { data: botConfig, error: botError } = await supabase
      .from("bot_configurations")
      .select("*")
      .eq("bot_key", botKey)
      .eq("is_active", true)
      .single();

    if (botError || !botConfig) {
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt and messages array
    let systemPrompt = botConfig.system_prompt || "You are a helpful assistant.";

    // GLOBAL: hand-off protocol back to the Mentor.
    // The bot must emit [ADVANCE] on its own line at the END of its reply when:
    //   (a) it concludes the therapist reached sufficient progress in this tool, OR
    //   (b) the therapist explicitly asks to move on / advance / return to the mentor.
    // The client detects this marker, runs the summary extractor, and routes the
    // therapist back to the Mentor with the summary attached.
    systemPrompt += `

---
פרוטוקול סיום (חובה):
כאשר אתה מזהה שהמטפל הגיע לנקודת התקדמות מספקת בכלי הזה, או שהמטפל מבקש במפורש להתקדם / לסיים / לחזור למנטור — סיים את התשובה האחרונה שלך במשפט סיכום קצר וחם, ואז הוסף בשורה נפרדת בלבד את הסמן: [ADVANCE]

טריגרים מפורשים להוספת [ADVANCE] (בעברית ובאנגלית) — אם המטפל כותב אחד מהביטויים האלו, סיים תמיד עם הסמן:
"תודה", "סיימנו", "מספיק", "חזרה למנטור", "אני רוצה לחזור", "זה הספיק לי",
"done", "finished", "thank you", "that's enough", "back to mentor", "i'm done".

אל תשתמש בסמן הזה בשום מצב אחר. אל תזכיר את הסמן בטקסט הגלוי.
---`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
    ];

    // 2. Get or create conversation (only for authenticated users)
    let currentConversationId = conversationId;
    let isNewConversation = false;
    const isAnonymous = !user;

    if (!isAnonymous) {
      if (!currentConversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("bot_conversations")
          .insert({
            user_id: user!.id,
            bot_key: botKey,
            title: "שיחה חדשה",
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating conversation:", convError);
          return new Response(JSON.stringify({ error: "Failed to create conversation" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        currentConversationId = newConv.id;
        isNewConversation = true;
      }

      // 3. Load user memory (personal insights)
      const { data: userMemories } = await supabase
        .from("bot_user_memory")
        .select("key, value")
        .eq("user_id", user!.id)
        .eq("bot_key", botKey)
        .order("created_at", { ascending: false });

      if (userMemories && userMemories.length > 0) {
        const memorySection = userMemories
          .map((m: any) => `- ${m.value}`)
          .join("\n");
        systemPrompt += `\n\n---\nמידע שנאסף על המשתמש (השתמש במידע זה כדי לתת מענה מותאם אישית):\n${memorySection}\n---`;
      }

      // 4. Load conversation history (last 20 messages)
      if (currentConversationId) {
        const { data: conversationHistory } = await supabase
          .from("bot_messages")
          .select("role, content")
          .eq("conversation_id", currentConversationId)
          .order("created_at", { ascending: true })
          .limit(20);

        if (conversationHistory && conversationHistory.length > 0) {
          for (const msg of conversationHistory) {
            messages.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }
      }

      // Save user message to database
      if (currentConversationId) {
        const { error: saveUserMsgError } = await supabase
          .from("bot_messages")
          .insert({
            conversation_id: currentConversationId,
            role: "user",
            content: message,
          });

        if (saveUserMsgError) {
          console.error("Error saving user message:", saveUserMsgError);
        }
      }
    }

    // Add new user message
    messages.push({ role: "user", content: message });

    // Update system prompt in messages array (it may have been modified by memory injection)
    messages[0] = { role: "system", content: systemPrompt };

    // 7. Call Lovable AI with streaming
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: botConfig.model || "google/gemini-3-flash-preview",
        messages,
        temperature: botConfig.temperature || 0.7,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a TransformStream to capture the full response while streaming
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullAssistantResponse = "";

    // Process the stream in the background
    (async () => {
      try {
        const reader = aiResponse.body!.getReader();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullAssistantResponse += content;
                }
                // Pass through the SSE event with proper SSE format
                await writer.write(encoder.encode(line + "\n\n"));
              } catch {
                // Incomplete JSON, pass through anyway
                await writer.write(encoder.encode(line + "\n\n"));
              }
            } else {
              // Pass through non-data lines (comments, empty lines)
              await writer.write(encoder.encode(line + "\n"));
            }
          }
        }

        // 8. Save assistant response to database (only for authenticated users)
        if (fullAssistantResponse && !isAnonymous) {
          const { error: saveAssistantMsgError } = await supabase
            .from("bot_messages")
            .insert({
              conversation_id: currentConversationId,
              role: "assistant",
              content: fullAssistantResponse,
            });

          if (saveAssistantMsgError) {
            console.error("Error saving assistant message:", saveAssistantMsgError);
          }

          // 9. Generate title for new conversations
          if (isNewConversation && message.length > 10) {
            generateConversationTitle(supabase, currentConversationId!, message, lovableApiKey);
          }
        }

        await writer.close();
      } catch (error) {
        console.error("Stream processing error:", error);
        await writer.abort(error);
      }
    })();

    // Return streaming response with conversation ID in header
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Conversation-Id": currentConversationId!,
      },
    });
  } catch (error) {
    console.error("Bot chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to generate conversation title (non-blocking)
async function generateConversationTitle(
  supabase: any,
  conversationId: string,
  userMessage: string,
  apiKey: string
) {
  try {
    const titleResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "בהתבסס על ההודעה הבאה, תן כותרת קצרה בעברית (3-5 מילים) לשיחה. תן רק את הכותרת, ללא גרשיים או הסברים.",
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 30,
      }),
    });

    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      const title = titleData.choices?.[0]?.message?.content?.trim();
      
      if (title && title.length > 0 && title.length < 100) {
        await supabase
          .from("bot_conversations")
          .update({ title })
          .eq("id", conversationId);
      }
    }
  } catch (error) {
    console.error("Error generating title:", error);
    // Non-critical, don't throw
  }
}
