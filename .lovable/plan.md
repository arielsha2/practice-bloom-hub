

# מימוש מערכת מחזורים וניהול תפקידים מתקדם

## סקירת המצב הנוכחי

| רכיב | סטטוס |
|------|-------|
| טבלת `courses` | קיימת עם קורס אחד (turning_point) |
| טבלת `student_enrollments` | קיימת (ריקה), כוללת course_key |
| טבלת `user_roles` | קיימת עם admin אחד |
| פונקציות RLS | `is_enrolled_in_course`, `has_role` קיימות |

## שינויים נדרשים

### שלב 1: עדכוני Database

#### א. יצירת טבלת מחזורים (cohorts)

```sql
CREATE TABLE public.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he text NOT NULL,
  name_en text NOT NULL,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### ב. הוספת עמודת cohort_id לטבלאות קיימות

```sql
-- שיוך קורסים למחזור
ALTER TABLE public.courses 
ADD COLUMN cohort_id uuid REFERENCES public.cohorts(id);

-- שיוך הרשמות למחזור
ALTER TABLE public.student_enrollments 
ADD COLUMN cohort_id uuid REFERENCES public.cohorts(id);
```

#### ג. יצירת מחזור ראשון ושיוך הקורס הקיים

```sql
INSERT INTO public.cohorts (name_he, name_en)
VALUES ('מחזור א׳', 'Cohort A');

UPDATE public.courses 
SET cohort_id = (SELECT id FROM cohorts WHERE name_en = 'Cohort A');
```

#### ד. RLS Policies עבור cohorts

```sql
-- כולם יכולים לראות מחזורים פעילים
CREATE POLICY "Anyone can view active cohorts"
ON public.cohorts FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- רק admin יכול לנהל מחזורים
CREATE POLICY "Admins can manage cohorts" 
ON public.cohorts FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### שלב 2: קומפוננטות Frontend

#### קבצים חדשים

| קובץ | תיאור |
|------|-------|
| `src/pages/CoursesAdmin.tsx` | עמוד ניהול קורסים ומחזורים |
| `src/components/admin/CohortsManager.tsx` | רכיב ליצירה ועריכת מחזורים |
| `src/components/admin/RoleChangeDialog.tsx` | דיאלוג לשינוי תפקיד משתמש |
| `src/hooks/useCohortsManagement.ts` | Hook לניהול מחזורים |

#### קבצים לעדכון

| קובץ | שינויים |
|------|----------|
| `src/components/admin/UsersTable.tsx` | הוספת עמודות: תפקיד, מחזור, סינון לפי מחזור |
| `src/components/admin/CourseAssignmentDialog.tsx` | בחירת מחזור בנוסף לקורס |
| `src/hooks/useUsersManagement.ts` | הוספת fetch לתפקידים ומחזורים, פונקציות לשינוי תפקיד |
| `src/pages/UsersAdmin.tsx` | תמיכה בדיאלוג שינוי תפקיד |
| `src/components/dashboard/AdminQuickActions.tsx` | הוספת קישור לניהול קורסים |
| `src/App.tsx` | נתיב חדש `/admin/courses` |

### שלב 3: פירוט ממשק ניהול משתמשים מעודכן

#### טבלת משתמשים חדשה

| מייל | שם | תפקיד | מחזור | קורסים | פעולות |
|------|-----|-------|-------|--------|--------|
| user@example.com | יוסי | סטודנט | מחזור א׳ | נקודת מפנה | [שייך] [תפקיד] |
| admin@example.com | אריאל | מנהל | - | הכל | [תפקיד] |

#### סינון לפי מחזור

- Dropdown לבחירת מחזור
- אופציה "הכל" להצגת כל המשתמשים
- אופציה "ללא מחזור" למשתמשים לא משויכים

#### תגיות תפקיד (Badges)

- **מנהל** - Badge כתום/אדום
- **סטודנט** - Badge ירוק (יש לפחות הרשמה אחת פעילה)
- **לא רשום** - Badge אפור (רשום לאתר אבל לא לקורס)

#### שיוך למספר מחזורים

בדיאלוג שיוך לקורס:
1. בחירת מחזור מהרשימה
2. בחירת קורס מהמחזור הנבחר
3. ניתן לחזור ולשייך לקורס אחר ממחזור אחר

### שלב 4: לוגיקת הרשאות

#### אדמין רואה הכל

הפונקציה `is_enrolled_in_course` כבר כוללת בדיקה:
```sql
SELECT EXISTS (...) OR has_role(_user_id, 'admin')
```

כך שאדמין תמיד מקבל גישה לכל התכנים ללא קשר למחזור או קורס.

#### משתמש רגיל

- רואה רק קורסים שהוא רשום אליהם
- יכול להיות רשום למספר קורסים ממחזורים שונים
- כל הרשמה נפרדת ב-student_enrollments

### שלב 5: Hook לניהול מחזורים

```typescript
// useCohortsManagement.ts
export function useCohortsManagement() {
  // שליפת כל המחזורים
  const { data: cohorts } = useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cohorts')
        .select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  // יצירת מחזור חדש
  const createCohort = useMutation({...});

  // עדכון מחזור
  const updateCohort = useMutation({...});

  // מחיקת/כיבוי מחזור
  const deactivateCohort = useMutation({...});

  return { cohorts, createCohort, updateCohort, deactivateCohort };
}
```

### שלב 6: עדכון Hook לניהול משתמשים

```typescript
// useUsersManagement.ts - הוספות
// שליפת תפקידי משתמשים
const { data: userRoles = [] } = useQuery({
  queryKey: ['admin-user-roles'],
  queryFn: async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*');
    return data;
  },
});

// שליפת מחזורים
const { data: cohorts = [] } = useQuery({
  queryKey: ['cohorts'],
  queryFn: async () => {
    const { data } = await supabase
      .from('cohorts')
      .select('*');
    return data;
  },
});

// שינוי תפקיד משתמש
const changeRole = useMutation({
  mutationFn: async ({ userId, newRole, currentRole }) => {
    if (currentRole) {
      // מחיקת התפקיד הקודם
      await supabase.from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', currentRole);
    }
    if (newRole) {
      // הוספת התפקיד החדש
      await supabase.from('user_roles')
        .insert({ user_id: userId, role: newRole });
    }
  },
});

// פונקציה לקבלת התפקיד הראשי של משתמש
const getUserRole = (userId: string) => {
  const roles = userRoles.filter(r => r.user_id === userId);
  if (roles.some(r => r.role === 'admin')) return 'admin';
  if (roles.some(r => r.role === 'course_member')) return 'student';
  return 'none';
};
```

### שלב 7: עדכון דיאלוג שיוך לקורס

הדיאלוג יציג:
1. בחירת מחזור (dropdown)
2. רשימת קורסים מהמחזור הנבחר
3. כפתור שיוך לכל קורס

כך ניתן לשייך משתמש לקורסים ממחזורים שונים.

### שלב 8: סיכום קבצים

#### קבצים חדשים (4)
- `src/pages/CoursesAdmin.tsx`
- `src/components/admin/CohortsManager.tsx`
- `src/components/admin/RoleChangeDialog.tsx`
- `src/hooks/useCohortsManagement.ts`

#### קבצים לעדכון (6)
- `src/components/admin/UsersTable.tsx`
- `src/components/admin/CourseAssignmentDialog.tsx`
- `src/hooks/useUsersManagement.ts`
- `src/pages/UsersAdmin.tsx`
- `src/components/dashboard/AdminQuickActions.tsx`
- `src/App.tsx`

### הערות חשובות

1. **אדמין רואה הכל** - הפונקציה `is_enrolled_in_course` כבר מטפלת בזה
2. **מספר מחזורים** - ניתן ליצור הרשמות מרובות לאותו משתמש
3. **סינון לפי מחזור** - יאפשר לראות רק סטודנטים ממחזור ספציפי
4. **תאימות לאחור** - הקורס הקיים ישויך למחזור ראשון אוטומטית

