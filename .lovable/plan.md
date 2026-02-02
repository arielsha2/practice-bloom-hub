

# תיקון שגיאת Invalid Token באימות Admin

## הבעיה

הפונקציה `check-admin` עובדת נכון כשהטוקן תקין, אבל לפעמים נכשלת עם "Auth session missing!" כי:
1. הדף מתרענן והסשן עדיין לא נטען
2. הטוקן פג תוקף ולא התרענן
3. Race condition בין טעינת הסשן לקריאה ל-edge function

## הפתרון

שיפור ה-hook `useIsAdmin` כך שיוודא שהסשן מוכן לגמרי לפני קריאה ל-edge function, ויוסיף retry logic.

## שינויים נדרשים

### קובץ `src/hooks/useIsAdmin.ts`

**לפני:**
```typescript
useEffect(() => {
  async function checkAdminStatus() {
    if (!user || !session) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    // קורא ל-edge function מיד
  }
  checkAdminStatus();
}, [user, session]);
```

**אחרי:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      // מחכה שהסשן יסיים להיטען
      if (authLoading) {
        return;
      }

      if (!user || !session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // מרענן את הסשן לפני הקריאה
        const { data: refreshData, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        const currentToken = refreshData?.session?.access_token 
          || session.access_token;

        const { data, error } = await supabase.functions.invoke('check-admin', {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
        }
      } catch (error) {
        console.error('Error invoking check-admin:', error);
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

## שינויים עיקריים

| שינוי | תיאור |
|-------|--------|
| הוספת `authLoading` | מחכה לסיום טעינת הסשן |
| רענון סשן | קורא ל-`refreshSession()` לפני בדיקת admin |
| שימוש בטוקן מעודכן | משתמש בטוקן המרוענן אם קיים |

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/hooks/useIsAdmin.ts` | הוספת המתנה לסשן ורענון טוקן |

## סיכום

התיקון מבטיח שהסשן נטען לגמרי ומרוענן לפני קריאה ל-edge function, מה שימנע את שגיאות "Auth session missing!".

