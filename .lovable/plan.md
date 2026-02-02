
# מערכת ניהול משתמשים וקורסים מקיפה

## סקירה

המערכת הנוכחית כבר כוללת תשתית טובה לאימות משתמשים ותפקידים. נרחיב אותה כדי לתמוך:
- רישום לקורסים ספציפיים (לא רק "course_member" כללי)
- עמוד ניהול משתמשים חדש
- גישה מבוקרת לתכנים לפי קורס

## מה קיים כבר

| רכיב | סטטוס |
|------|-------|
| התחברות עם מייל וסיסמא | קיים ועובד |
| טבלת `user_roles` עם תפקיד admin | קיים |
| טבלת `student_enrollments` עם course_key | קיים (ריקה) |
| פונקציית `is_course_member` | קיימת (בודקת תפקיד כללי) |
| טבלת `lessons` | קיימת (ללא שיוך לקורס) |

## שינויים נדרשים

### 1. שינויי Database

#### א. טבלה חדשה: `courses`
טבלה להגדרת קורסים זמינים במערכת:

| עמודה | טיפוס | תיאור |
|-------|-------|-------|
| id | uuid | מזהה ייחודי |
| course_key | text | מפתח ייחודי (לדוגמה: "turning_point") |
| name_he | text | שם הקורס בעברית |
| name_en | text | שם הקורס באנגלית |
| description | text | תיאור הקורס |
| is_active | boolean | האם הקורס פעיל |
| created_at | timestamp | תאריך יצירה |

#### ב. עדכון טבלת `lessons`
הוספת עמודה `course_key` לשיוך שיעורים לקורס ספציפי:

```sql
ALTER TABLE lessons 
ADD COLUMN course_key text DEFAULT 'turning_point';
```

#### ג. פונקציה חדשה: `is_enrolled_in_course`
בדיקת האם משתמש רשום לקורס ספציפי:

```sql
CREATE FUNCTION is_enrolled_in_course(_user_id uuid, _course_key text)
RETURNS boolean
-- בודקת אם המשתמש רשום לקורס הספציפי או שהוא admin
```

#### ד. עדכון RLS Policies
עדכון מדיניות הגישה לשיעורים כך שמשתמש יראה רק שיעורים של הקורסים שהוא רשום אליהם.

### 2. קומפוננטות Frontend חדשות

#### א. עמוד ניהול משתמשים (`/admin/users`)

**תצוגה ראשית:**
- טבלה של כל המשתמשים הרשומים (מ-profiles)
- עמודות: מייל, שם, תאריך הצטרפות, קורסים משויכים, פעולות

**יכולות:**
- צפייה ברשימת משתמשים רשומים
- שיוך/ביטול שיוך משתמש לקורס
- סינון לפי קורס

**קבצים:**
- `src/pages/UsersAdmin.tsx` - עמוד ניהול ראשי
- `src/components/admin/UsersTable.tsx` - טבלת משתמשים
- `src/components/admin/CourseAssignmentDialog.tsx` - דיאלוג שיוך לקורס
- `src/hooks/useUsersManagement.ts` - hook לניהול נתונים

#### ב. קומפוננטת Access Denied משודרגת

**עדכון ל-`PortalAccessDenied.tsx`:**
- הוספת אייקון מנעול בולט
- הבחנה בין משתמש לא מחובר למשתמש ללא גישה
- כפתור להפניה לדף ההתחברות

#### ג. עדכון תפריט הניהול

**עדכון `AdminQuickActions.tsx`:**
- הוספת קישור לעמוד ניהול משתמשים

### 3. Hook חדש לבדיקת גישה לקורס

**קובץ: `src/hooks/useCourseAccess.ts`**
```typescript
function useCourseAccess(courseKey: string) {
  // מחזיר: { hasAccess, isLoading, isEnrolled }
  // בודק אם המשתמש רשום לקורס הספציפי
}
```

### 4. עדכון נתיבים ב-App.tsx

הוספת נתיב חדש:
```typescript
<Route path="/admin/users" element={<UsersAdmin />} />
```

## זרימת עבודה

```text
מנהל/ת:
1. נכנס/ת לעמוד ניהול משתמשים
2. רואה רשימת כל המשתמשים הרשומים
3. בוחר/ת משתמש ולוחץ/ת "שייך לקורס"
4. בוחר/ת קורס מהרשימה
5. המשתמש מקבל גישה מיידית

משתמש/ת רגיל/ה:
1. נרשם/ת לאתר עם מייל וסיסמא
2. מנסה לגשת לפורטל הקורס
3. אם לא משויך/ת - רואה מסך עם מנעול
4. אחרי שיוך ע"י מנהל - מקבל/ת גישה
```

## קבצים שייווצרו או ישתנו

| קובץ | פעולה | תיאור |
|------|-------|-------|
| `src/pages/UsersAdmin.tsx` | חדש | עמוד ניהול משתמשים |
| `src/components/admin/UsersTable.tsx` | חדש | טבלת משתמשים |
| `src/components/admin/CourseAssignmentDialog.tsx` | חדש | דיאלוג שיוך |
| `src/hooks/useUsersManagement.ts` | חדש | ניהול נתונים |
| `src/hooks/useCourseAccess.ts` | חדש | בדיקת גישה לקורס |
| `src/components/portal/PortalAccessDenied.tsx` | עדכון | הוספת מנעול |
| `src/components/dashboard/AdminQuickActions.tsx` | עדכון | קישור לניהול משתמשים |
| `src/App.tsx` | עדכון | נתיב חדש |
| `src/contexts/LanguageContext.tsx` | עדכון | תרגומים |

## שינויי Database (SQL)

### יצירת טבלת קורסים
```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key text UNIQUE NOT NULL,
  name_he text NOT NULL,
  name_en text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- הכנסת הקורס הקיים
INSERT INTO courses (course_key, name_he, name_en)
VALUES ('turning_point', 'נקודת מפנה', 'Turning Point');
```

### עדכון טבלת שיעורים
```sql
ALTER TABLE lessons 
ADD COLUMN course_key text REFERENCES courses(course_key) DEFAULT 'turning_point';
```

### פונקציה לבדיקת הרשמה לקורס
```sql
CREATE FUNCTION is_enrolled_in_course(_user_id uuid, _course_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM student_enrollments
    WHERE user_id = _user_id 
    AND course_key = _course_key
  ) OR has_role(_user_id, 'admin')
$$;
```

### RLS Policies מעודכנות

**על טבלת `lessons`:**
```sql
-- מדיניות קיימת תוחלף
CREATE POLICY "Users can view lessons for enrolled courses"
ON lessons FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  OR is_enrolled_in_course(auth.uid(), course_key)
);
```

**על טבלת `courses`:**
```sql
-- כולם יכולים לראות קורסים פעילים
CREATE POLICY "Anyone can view active courses"
ON courses FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- רק admin יכול לנהל
CREATE POLICY "Admins can manage courses"
ON courses FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

## אבטחה

- כל הבדיקות נעשות בצד השרת דרך RLS
- פונקציות `SECURITY DEFINER` למניעת גישה ישירה לטבלאות
- Admin מזוהה לפי תפקיד ב-`user_roles` ולא לפי מייל בקוד
- המייל `dr.ariel.shapira@gmail.com` כבר מוגדר כ-admin ב-DB

## הערות חשובות

1. **תאימות לאחור**: השיעורים הקיימים ישויכו אוטומטית לקורס "turning_point"
2. **גמישות**: ניתן להוסיף קורסים נוספים בעתיד
3. **ביצועים**: שימוש ב-RLS במקום בדיקות בצד הלקוח
