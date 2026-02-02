
# תיקון התנתקויות תכופות ב-useIsAdmin

## הבעיה

הקריאה ל-`supabase.auth.refreshSession()` ב-hook גורמת לקונפליקט עם ה-`AuthContext` הגלובלי, מה שמוביל להתנתקויות מיידיות.

## הפתרון

עדכון ה-hook כך ש:
1. **לא יבצע רענון סשן אגרסיבי** - ישתמש בטוקן הקיים מה-AuthContext
2. **ירענן רק אם הטוקן פג תוקף** - בדיקת `session.expires_at`
3. **לא יגרום להתנתקות בשגיאה** - רק יגדיר `isAdmin = false`

## שינויים נדרשים

### קובץ `src/hooks/useIsAdmin.ts`

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useIsAdmin() {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!user || !session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      const isTokenExpired = session.expires_at 
        && session.expires_at * 1000 < Date.now();

      try {
        let currentToken = session.access_token;

        // Only refresh if token is expired
        if (isTokenExpired) {
          const { data: refreshData, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData?.session) {
            // Token refresh failed - user session is invalid
            // Don't sign out, just mark as not admin
            console.error('Session refresh failed:', refreshError?.message);
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }
          
          currentToken = refreshData.session.access_token;
        }

        // Call check-admin with current token
        const { data, error } = await supabase.functions.invoke('check-admin', {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (error) {
          console.error('Error checking admin status:', error);
          // Don't sign out on error - just set isAdmin to false
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
        }
      } catch (error) {
        console.error('Error invoking check-admin:', error);
        // Don't sign out on error - just set isAdmin to false
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, session, authLoading]);

  return { isAdmin, isLoading };
}
```

## השינויים העיקריים

| לפני | אחרי |
|------|------|
| רענון סשן בכל בדיקה | רענון רק אם הטוקן פג תוקף |
| שימוש בטוקן מרוענן תמיד | שימוש בטוקן קיים כברירת מחדל |
| אין טיפול בשגיאת רענון | טיפול נכון בשגיאה - לא מתנתק |

## לוגיקת הזרימה החדשה

```text
┌─────────────────────────────────────────────────────────────┐
│  1. בדיקה: authLoading? → המתנה                             │
│  2. בדיקה: !user || !session? → isAdmin = false             │
│  3. בדיקה: session.expires_at < now?                        │
│     ├─ כן: נסה רענון סשן                                    │
│     │   ├─ הצלחה: השתמש בטוקן חדש                           │
│     │   └─ כשלון: isAdmin = false (ללא התנתקות)            │
│     └─ לא: השתמש בטוקן הקיים                                │
│  4. קריאה ל-check-admin                                     │
│  5. עדכון isAdmin לפי תוצאה                                 │
└─────────────────────────────────────────────────────────────┘
```

## קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `src/hooks/useIsAdmin.ts` | עדכון הלוגיקה |

## סיכום

התיקון מונע התנתקויות על ידי:
- שימוש בטוקן הקיים מה-AuthContext במקום רענון אגרסיבי
- רענון סשן רק כשהטוקן באמת פג תוקף
- אי-התנתקות בשגיאות - רק הגדרת `isAdmin = false`
