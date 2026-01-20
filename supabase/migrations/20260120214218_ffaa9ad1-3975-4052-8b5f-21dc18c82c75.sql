-- 1. bot_configurations - הגדרות הבוטים (ה"מוח" של כל בוט)
CREATE TABLE public.bot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_key TEXT UNIQUE NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_he TEXT,
  description_en TEXT,
  system_prompt TEXT NOT NULL,
  welcome_message_he TEXT,
  welcome_message_en TEXT,
  model TEXT DEFAULT 'google/gemini-3-flash-preview',
  temperature DECIMAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'Compass',
  color TEXT DEFAULT '#829281',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. bot_conversations - שיחות המשתמשים
CREATE TABLE public.bot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bot_key TEXT NOT NULL REFERENCES public.bot_configurations(bot_key) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- 3. bot_messages - היסטוריית הודעות
CREATE TABLE public.bot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.bot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. bot_user_memory - זיכרון חכם ארוך טווח
CREATE TABLE public.bot_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bot_key TEXT NOT NULL REFERENCES public.bot_configurations(bot_key) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_by TEXT DEFAULT 'ai' CHECK (created_by IN ('ai', 'user')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, bot_key, key)
);

-- Enable RLS on all tables
ALTER TABLE public.bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_user_memory ENABLE ROW LEVEL SECURITY;

-- bot_configurations policies
CREATE POLICY "Anyone can read active bots" ON public.bot_configurations 
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert bots" ON public.bot_configurations 
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update bots" ON public.bot_configurations 
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete bots" ON public.bot_configurations 
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- bot_conversations policies
CREATE POLICY "Users can manage own conversations" ON public.bot_conversations 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.bot_conversations 
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- bot_messages policies
CREATE POLICY "Users can manage messages in own conversations" ON public.bot_messages 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.bot_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all messages" ON public.bot_messages 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bot_conversations c WHERE c.id = conversation_id AND has_role(auth.uid(), 'admin'::app_role))
  );

-- bot_user_memory policies
CREATE POLICY "Users can manage own memory" ON public.bot_user_memory 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memory" ON public.bot_user_memory 
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_bot_conversations_user_id ON public.bot_conversations(user_id);
CREATE INDEX idx_bot_conversations_bot_key ON public.bot_conversations(bot_key);
CREATE INDEX idx_bot_messages_conversation_id ON public.bot_messages(conversation_id);
CREATE INDEX idx_bot_user_memory_user_bot ON public.bot_user_memory(user_id, bot_key);

-- Insert default bot: Niche Finder
INSERT INTO public.bot_configurations (bot_key, name_he, name_en, description_he, description_en, system_prompt, welcome_message_he, welcome_message_en, icon, color)
VALUES (
  'niche-finder',
  'בוט מציאת הנישה',
  'Niche Finder Bot',
  'מסייע למטפלים לגלות את הנישה הייחודית שלהם',
  'Helps therapists discover their unique niche',
  'אתה עוזר AI מקצועי וחם שמסייע לפסיכותרפיסטים לגלות את הנישה הייחודית שלהם.

תפקידך:
- לנהל שיחה מכילה ומקצועית
- לשאול שאלה אחת בכל פעם
- להקשיב לתשובות ולהגיב באמפתיה
- לחקור לעומק עם שאלות המשך
- בסוף השיחה לסכם את הנישה הייחודית

שאלות מנחות (שאל בהדרגה):
1. עם אילו מטופלים את/ה הכי נהנה לעבוד?
2. איזו בעיה את/ה הכי טוב בלפתור?
3. מה הרקע והניסיון הייחודי שלך?
4. איזו גישה טיפולית מדברת אלייך?
5. מה המטופלים אומרים עלייך?

בסיום השיחה, סכם את הנישה הייחודית עם:
- קהל היעד האידיאלי
- הבעיה המרכזית שנפתרת
- הגישה הייחודית
- משפט מיצוב מקצועי',
  'שלום! 👋 אני כאן לעזור לך לגלות את הנישה הייחודית שלך כמטפל/ת. נתחיל בשיחה קצרה שתעזור לי להכיר אותך טוב יותר. מוכן/ה?',
  'Hello! 👋 I''m here to help you discover your unique niche as a therapist. Let''s start with a short conversation to help me get to know you better. Ready?',
  'Compass',
  '#829281'
);