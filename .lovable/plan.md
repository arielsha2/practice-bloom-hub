
## תוכנית יישום: מערכת רישום סטודנטים מראש

### מיגרציית Database

#### 1. יצירת טבלת `student_enrollments`

```sql
CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  course_key text NOT NULL DEFAULT 'turning_point',
  enrolled_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, course_key)
);
```

#### 2. אינדקסים לחיפוש מהיר
```sql
CREATE INDEX idx_student_enrollments_email ON public.student_enrollments(email);
CREATE INDEX idx_student_enrollments_user_id ON public.student_enrollments(user_id);
```

#### 3. טריגר לנרמול אימייל ל-Lowercase
```sql
CREATE OR REPLACE FUNCTION public.normalize_enrollment_email()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.email = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_email_before_save
  BEFORE INSERT OR UPDATE ON public.student_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.normalize_enrollment_email();
```

#### 4. מדיניות RLS

| Policy | פעולה | תנאי |
|--------|-------|------|
| Admins can manage enrollments | ALL | `has_role(auth.uid(), 'admin')` |
| Users can view own enrollments | SELECT | אימייל תואם לפרופיל המחובר |

#### 5. טריגר 1: משתמש חדש נרשם
כאשר נוצר פרופיל חדש - בודק אם האימייל ברשימת ההרשמות:
- משתמש ב-`LOWER()` להשוואה
- מוסיף role `course_member`
- מעדכן `user_id` ו-`activated_at`

#### 6. טריגר 2: אדמין מוסיף הרשמה
כאשר מתווספת הרשמה חדשה - בודק אם המשתמש כבר קיים:
- אם קיים - מקצה role אוטומטית
- ממלא `user_id` ו-`activated_at`

---

### תרשים זרימה

```
┌─────────────────────────────────────────────────────────────┐
│                    תרחיש א': משתמש חדש                       │
├─────────────────────────────────────────────────────────────┤
│  1. אדמין מוסיף: student@email.com → student_enrollments   │
│  2. סטודנט נרשם לאתר עם student@email.com                  │
│  3. טריגר on_profile_created_check_enrollment מופעל        │
│  4. ✓ נמצאה התאמה → מוסיף course_member role               │
│  5. סטודנט מקבל גישה מיידית לקורס                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  תרחיש ב': משתמש קיים                        │
├─────────────────────────────────────────────────────────────┤
│  1. סטודנט כבר רשום באתר עם student@email.com              │
│  2. אדמין מוסיף את האימייל ל-student_enrollments           │
│  3. טריגר on_enrollment_check_existing_user מופעל          │
│  4. ✓ משתמש קיים → מוסיף course_member role אוטומטית       │
│  5. סטודנט מקבל גישה מיידית (ללא צורך ברישום מחדש)         │
└─────────────────────────────────────────────────────────────┘
```

---

### קבצים לעדכון

| קובץ | פעולה |
|------|-------|
| `supabase/migrations/20250129_student_enrollments.sql` | מיגרציה חדשה |

### הערות טכניות

- **אין צורך בשינויי קוד** - המערכת הקיימת (`useIsCourseMember`) כבר בודקת את `user_roles`
- הטריגרים עובדים ברמת ה-Database ולא דורשים שינוי בקוד React
- האימייל תמיד נשמר ב-lowercase למניעת כפילויות
- השוואת אימיילים מתבצעת עם `LOWER()` לבטיחות מלאה
