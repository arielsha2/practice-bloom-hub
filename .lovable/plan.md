

# הוספת רישום מראש למערכת ניהול המשתמשים

## סקירה

המערכת כבר כוללת תשתית מלאה לרישום מוקדם (Whitelist):
- טבלת `student_enrollments` תומכת ברשומות עם `email` ללא `user_id`
- טריגרים אוטומטיים מקשרים את החשבון כשהמשתמש נרשם

הנדרש: **ממשק UI להוספת משתמשים מראש** - דיאלוג שמאפשר להזין מייל ולהגדיר מחזור, קורס והרשאה.

## זרימת עבודה חדשה

```text
רישום מוקדם (Whitelist):
1. מנהל לוחץ "הוסף משתמש"
2. מזין כתובת מייל
3. בוחר מחזור וקורס
4. בוחר הרשאה (admin / student)
5. הרשומה נשמרת ב-student_enrollments עם user_id=null
6. כשהמשתמש נרשם עם אותו מייל - הטריגר מקשר אוטומטית

הצגה בטבלה:
- משתמשים רשומים (מ-profiles) עם פרטי ההרשמות שלהם
- משתמשים ברשימת המתנה (מ-student_enrollments ללא user_id)
```

## קומפוננטות חדשות

### 1. דיאלוג הוספת משתמש (`AddUserDialog.tsx`)

| שדה | סוג | תיאור |
|-----|-----|-------|
| email | input | כתובת המייל (חובה) |
| full_name | input | שם מלא (אופציונלי) |
| cohort | select | בחירת מחזור |
| course | select | בחירת קורס |
| role | select | הרשאה: סטודנט / מנהל |
| notes | textarea | הערות (אופציונלי) |

### 2. עדכון טבלת משתמשים

הוספת סקשן נפרד למשתמשים ברשימת המתנה (pending):
- תצוגה של משתמשים שהוזנו מראש אך טרם נרשמו
- אפשרות לערוך או למחוק רשומות ממתינות

## שינויים נדרשים

### קבצים חדשים

| קובץ | תיאור |
|------|-------|
| `src/components/admin/AddUserDialog.tsx` | דיאלוג להוספת משתמש חדש |

### קבצים לעדכון

| קובץ | שינויים |
|------|----------|
| `src/hooks/useUsersManagement.ts` | הוספת mutation להוספת משתמש לרשימת המתנה |
| `src/pages/UsersAdmin.tsx` | כפתור "הוסף משתמש" ודיאלוג |
| `src/components/admin/UsersTable.tsx` | סקשן נפרד למשתמשים ממתינים |

## לוגיקה חדשה ב-Hook

```typescript
// הוספת משתמש לרשימת המתנה
const addPendingUser = useMutation({
  mutationFn: async ({ email, fullName, courseKey, cohortId, isAdmin, notes }) => {
    // שמירת הרשמה ללא user_id
    await supabase.from('student_enrollments').insert({
      email: email.toLowerCase(),
      full_name: fullName,
      course_key: courseKey,
      cohort_id: cohortId,
      notes: notes,
      // user_id נשאר null - ימולא אוטומטית כשהמשתמש ירשם
    });
    
    // אם נבחר admin - נשמור במבנה נתונים נפרד
    // (ייושם רק כשהמשתמש נרשם בפועל)
  }
});
```

## הערה חשובה: הרשאת Admin מראש

הטבלה `user_roles` דורשת `user_id` ולכן **לא ניתן להגדיר admin לפני שהמשתמש נרשם**.

**פתרון:** נוסיף עמודה `pending_role` לטבלת `student_enrollments` שתישמור את התפקיד המתוכנן, והטריגר יפעיל אותו בעת ההרשמה.

### שינוי Database נדרש

```sql
-- הוספת עמודה לתפקיד מתוכנן
ALTER TABLE public.student_enrollments 
ADD COLUMN pending_role text DEFAULT 'course_member';

-- עדכון הטריגר לתמוך בתפקיד מתוכנן
CREATE OR REPLACE FUNCTION public.auto_assign_course_role_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  enrollment_record RECORD;
BEGIN
  FOR enrollment_record IN
    SELECT id, course_key, pending_role
    FROM public.student_enrollments
    WHERE LOWER(email) = LOWER(NEW.email)
      AND user_id IS NULL
  LOOP
    -- הוספת התפקיד המתוכנן (admin או course_member)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, enrollment_record.pending_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    UPDATE public.student_enrollments
    SET user_id = NEW.id,
        activated_at = now()
    WHERE id = enrollment_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;
```

## עיצוב הממשק

### כפתור הוספה

בראש עמוד ניהול המשתמשים, ליד הכותרת:
```
[+ הוסף משתמש]
```

### דיאלוג הוספת משתמש

```
┌─────────────────────────────────────────┐
│  הוסף משתמש חדש                         │
│─────────────────────────────────────────│
│  📧 כתובת מייל *                        │
│  ┌───────────────────────────────────┐  │
│  │ user@example.com                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  👤 שם מלא                              │
│  ┌───────────────────────────────────┐  │
│  │ ישראל ישראלי                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📅 מחזור                               │
│  ┌───────────────────────────────────┐  │
│  │ מחזור א׳                      ▼   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📚 קורס                                │
│  ┌───────────────────────────────────┐  │
│  │ נקודת מפנה                    ▼   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🛡️ הרשאה                               │
│  ┌───────────────────────────────────┐  │
│  │ ○ סטודנט  ○ מנהל                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📝 הערות                               │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│              [ביטול]  [הוסף משתמש]      │
└─────────────────────────────────────────┘
```

### סקשן משתמשים ממתינים

מתחת לטבלת המשתמשים הרשומים:

```
┌─────────────────────────────────────────┐
│ ⏳ רשימת המתנה (4)                       │
│─────────────────────────────────────────│
│ מייל          | מחזור    | קורס   | פעולות│
│───────────────┼──────────┼────────┼──────│
│ a@test.com   | מחזור א׳ | נ.מ.   | ✏️ 🗑️│
│ b@test.com   | מחזור ב׳ | נ.מ.   | ✏️ 🗑️│
└─────────────────────────────────────────┘
```

## סיכום קבצים

### חדשים (1)
- `src/components/admin/AddUserDialog.tsx`

### עדכונים (3)
- `src/hooks/useUsersManagement.ts` - mutation חדש
- `src/pages/UsersAdmin.tsx` - כפתור ודיאלוג
- `src/components/admin/UsersTable.tsx` - סקשן ממתינים

### Database (1)
- הוספת עמודה `pending_role` ועדכון טריגר

## אבטחה

- וולידציה על פורמט המייל בצד הלקוח והשרת
- המייל מנורמל ל-lowercase אוטומטית (טריגר קיים)
- רק admin יכול להוסיף משתמשים (RLS קיים)
- בדיקת כפילויות לפני הוספה

