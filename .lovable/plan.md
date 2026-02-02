
# תיקון Edge Function - check-admin

## הבעיה

הפונקציה נכשלת ב-`supabaseAuth.auth.getUser(token)` כי:
1. `verify_jwt = false` מוגדר ב-config.toml
2. כאשר JWT verification מושבת, ה-client הרגיל לא יכול לאמת טוקנים כראוי
3. צריך לפענח את ה-JWT ידנית ולאמת את המשתמש דרך ה-admin API

## הפתרון

שכתוב הפונקציה כך ש:
1. תפענח את ה-JWT ידנית כדי לחלץ את ה-`sub` (User ID)
2. תאמת שהמשתמש קיים דרך `auth.admin.getUserById()`
3. תבדוק את התפקיד עם `has_role` RPC

## שינויים נדרשים

### קובץ `supabase/functions/check-admin/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to decode JWT payload (without verification)
function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user ID
    const payload = decodeJwtPayload(token);
    if (!payload?.sub) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Invalid token format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Token expired' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = payload.sub;
    
    // Create service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user exists using admin API
    const { data: userData, error: userError } = 
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check admin role using RPC
    const { data, error } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (error) {
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Error checking role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ isAdmin: data === true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

## שינויים עיקריים

| שינוי | תיאור |
|-------|--------|
| `decodeJwtPayload()` | פונקציה חדשה לפענוח ה-JWT ידנית |
| הסרת `auth.getUser()` | במקום זה, פענוח ישיר של ה-JWT |
| בדיקת תוקף | בדיקה אם הטוקן פג תוקף לפי `exp` |
| `auth.admin.getUserById()` | אימות שהמשתמש קיים דרך ה-admin API |
| Service role client בלבד | שימוש רק ב-service role key |

## זרימת האימות החדשה

```text
┌─────────────────────────────────────────────────────────────┐
│  1. קבלת Authorization header                               │
│  2. פענוח JWT ידני → חילוץ userId מ-sub claim               │
│  3. בדיקת תוקף הטוקן (exp)                                  │
│  4. אימות המשתמש דרך auth.admin.getUserById()               │
│  5. בדיקת תפקיד admin דרך has_role RPC                      │
│  6. החזרת תוצאה                                             │
└─────────────────────────────────────────────────────────────┘
```

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/functions/check-admin/index.ts` | שכתוב מלא |

## סיכום

הגישה החדשה עוקפת את הבעיה עם `auth.getUser()` על ידי:
- פענוח ידני של ה-JWT לחילוץ ה-user ID
- שימוש ב-admin API לאימות שהמשתמש קיים
- שימוש בלעדי ב-service role client שעוקף RLS
